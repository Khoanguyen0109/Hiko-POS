/**
 * Migrate global shift templates to per-store templates.
 *
 * What it does:
 *  1. Assigns templates without a store to the source store (default: MAIN).
 *  2. Clones source templates into every other active store (matched by shortName).
 *  3. Rewires Schedule.shiftTemplate so each schedule uses its store's template copy.
 *
 * Usage:
 *   npx tsx scripts/migrate-shift-templates-per-store.ts              # dry-run
 *   npx tsx scripts/migrate-shift-templates-per-store.ts --execute    # apply
 *   npx tsx scripts/migrate-shift-templates-per-store.ts --source=MAIN --execute
 *
 * Railway (from your machine, using the public Mongo proxy URL):
 *   MONGODB_URI='mongodb://mongo:...@shuttle.proxy.rlwy.net:PORT' \
 *     npx tsx scripts/migrate-shift-templates-per-store.ts --execute
 *
 * Or via Railway CLI (uses project env vars):
 *   railway link
 *   railway run --service <backend-service> npx tsx scripts/migrate-shift-templates-per-store.ts --execute
 */
import "dotenv/config";
import mongoose from "mongoose";
import Store from "../models/storeModel.js";
import ShiftTemplate from "../models/shiftTemplateModel.js";
import Schedule from "../models/scheduleModel.js";

const isExecute = process.argv.includes("--execute");
const sourceArg = process.argv.find((a) => a.startsWith("--source="));
const sourceCode = sourceArg?.split("=")[1]?.toUpperCase() ?? "MAIN";

const noStoreFilter = { $or: [{ store: { $exists: false } }, { store: null }] };

const storeIdOf = (ref: unknown): string | null => {
  if (!ref) return null;
  if (typeof ref === "object" && ref !== null && "_id" in ref) {
    return String((ref as { _id: unknown })._id);
  }
  return String(ref);
};

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!uri) {
    throw new Error("MONGODB_URI (or MONGO_URL) is not set");
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`Database: ${mongoose.connection.name}`);
  console.log(`Mode: ${isExecute ? "EXECUTE" : "DRY-RUN"}`);
  console.log(`Source store code: ${sourceCode}\n`);

  const sourceStore = await Store.findOne({ code: sourceCode });
  if (!sourceStore) {
    throw new Error(`Source store with code "${sourceCode}" not found`);
  }

  const stores = await Store.find({ isActive: { $ne: false } }).sort({ code: 1 });
  if (stores.length === 0) {
    throw new Error("No active stores found");
  }

  // Step 1: assign orphan templates to source store
  const orphanCount = await ShiftTemplate.countDocuments(noStoreFilter);
  console.log(`--- Step 1: orphan templates (no store) ---`);
  console.log(`Found ${orphanCount} template(s) without a store`);

  if (orphanCount > 0) {
    if (isExecute) {
      const result = await ShiftTemplate.updateMany(noStoreFilter, {
        $set: { store: sourceStore._id },
      });
      console.log(`Assigned ${result.modifiedCount} template(s) to ${sourceStore.name}\n`);
    } else {
      console.log(`Would assign ${orphanCount} template(s) to ${sourceStore.name}\n`);
    }
  } else {
    console.log("Nothing to assign\n");
  }

  // Step 2: clone source templates into other stores
  const sourceTemplates = await ShiftTemplate.find({ store: sourceStore._id }).lean();
  if (sourceTemplates.length === 0) {
    console.log(`Source store "${sourceStore.name}" has no templates — nothing to clone.`);
    console.log("Create templates in the app first, or run shiftTemplateSeeds after assigning a store.\n");
  } else {
    console.log(`--- Step 2: clone templates from ${sourceStore.name} ---`);
    console.log(`Source has ${sourceTemplates.length} template(s)\n`);

    let totalCreated = 0;

    for (const store of stores) {
      if (storeIdOf(store._id) === storeIdOf(sourceStore._id)) {
        console.log(`Skip source: ${store.name} (${store.code})`);
        continue;
      }

      const existing = await ShiftTemplate.find({ store: store._id })
        .select("shortName name")
        .lean();
      const existingShortNames = new Set(existing.map((t) => t.shortName));

      const missing = sourceTemplates.filter((t) => !existingShortNames.has(t.shortName));
      if (missing.length === 0) {
        console.log(`${store.name} (${store.code}): already has all templates`);
        continue;
      }

      console.log(`${store.name} (${store.code}): would create ${missing.length} template(s)`);
      for (const template of missing) {
        const payload = {
          store: store._id,
          name: template.name,
          shortName: template.shortName,
          startTime: template.startTime,
          endTime: template.endTime,
          color: template.color,
          description: template.description ?? "",
          isActive: template.isActive ?? true,
          durationHours: template.durationHours ?? 0,
        };
        console.log(`  + ${template.shortName} | ${template.name} (${template.startTime}-${template.endTime})`);
        if (isExecute) {
          await ShiftTemplate.create(payload);
        }
        totalCreated += 1;
      }
    }

    console.log(`\n${isExecute ? "Created" : "Would create"} ${totalCreated} template(s) across other stores\n`);
  }

  // Step 3: rewire schedules to store-specific template IDs
  console.log("--- Step 3: rewire schedule references ---");

  const allTemplates = await ShiftTemplate.find({}).lean();
  const templateById = new Map(allTemplates.map((t) => [String(t._id), t]));

  // Map: storeId -> shortName -> templateId
  const templateLookup = new Map<string, Map<string, string>>();
  for (const t of allTemplates) {
    const sId = storeIdOf(t.store);
    if (!sId) continue;
    if (!templateLookup.has(sId)) templateLookup.set(sId, new Map());
    templateLookup.get(sId)!.set(t.shortName, String(t._id));
  }

  const schedules = await Schedule.find({}).select("_id store shiftTemplate date").lean();
  let rewired = 0;
  let alreadyCorrect = 0;
  let skipped = 0;

  for (const sched of schedules) {
    const schedStoreId = storeIdOf(sched.store);
    const currentTemplateId = storeIdOf(sched.shiftTemplate);
    if (!schedStoreId || !currentTemplateId) {
      skipped += 1;
      continue;
    }

    const currentTemplate = templateById.get(currentTemplateId);
    if (!currentTemplate) {
      console.warn(`  Schedule ${sched._id}: template ${currentTemplateId} not found — skipped`);
      skipped += 1;
      continue;
    }

    const targetId = templateLookup.get(schedStoreId)?.get(currentTemplate.shortName);
    if (!targetId) {
      console.warn(
        `  Schedule ${sched._id}: no "${currentTemplate.shortName}" template for store ${schedStoreId} — skipped`
      );
      skipped += 1;
      continue;
    }

    if (targetId === currentTemplateId) {
      alreadyCorrect += 1;
      continue;
    }

    console.log(
      `  Schedule ${sched._id}: ${currentTemplate.shortName} ${currentTemplateId} → ${targetId} (store ${schedStoreId})`
    );
    if (isExecute) {
      await Schedule.updateOne({ _id: sched._id }, { $set: { shiftTemplate: targetId } });
    }
    rewired += 1;
  }

  console.log(`\nSchedules already correct: ${alreadyCorrect}`);
  console.log(`${isExecute ? "Rewired" : "Would rewire"}: ${rewired}`);
  if (skipped > 0) console.log(`Skipped: ${skipped}`);

  if (!isExecute) {
    console.log("\nRe-run with --execute to apply changes.");
  } else {
    console.log("\nMigration complete.");
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
