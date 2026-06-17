/**
 * Sync storage item catalog so every store has the same item definitions (by code).
 * Stock levels are NOT copied — new items start at currentStock 0.
 *
 * Usage:
 *   npx tsx scripts/sync-storage-items-across-stores.ts              # dry-run
 *   npx tsx scripts/sync-storage-items-across-stores.ts --execute    # apply
 *   npx tsx scripts/sync-storage-items-across-stores.ts --source=MAIN
 *   MONGODB_URI='mongodb://...' npx tsx scripts/sync-storage-items-across-stores.ts --execute
 */
import "dotenv/config";
import mongoose from "mongoose";
import StorageItem from "../models/storageItemModel.js";
import Store from "../models/storeModel.js";

const isExecute = process.argv.includes("--execute");
const sourceArg = process.argv.find((a) => a.startsWith("--source="));
const targetArg = process.argv.find((a) => a.startsWith("--target="));
const sourceCode = sourceArg?.split("=")[1]?.toUpperCase() ?? "MAIN";
const targetCodes = targetArg
  ? targetArg.split("=")[1]?.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean)
  : null;

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`Database: ${mongoose.connection.name}`);
  console.log(`Mode: ${isExecute ? "EXECUTE" : "DRY-RUN"}`);
  console.log(`Source store code: ${sourceCode}`);
  if (targetCodes?.length) {
    console.log(`Target store codes: ${targetCodes.join(", ")}`);
  }
  console.log();

  let stores = await Store.find({}).sort({ code: 1 }).lean();
  if (targetCodes?.length) {
    stores = stores.filter((s) => targetCodes.includes(s.code));
  }
  const sourceStore = await Store.findOne({ code: sourceCode }).lean();
  if (!sourceStore) {
    throw new Error(`Source store with code "${sourceCode}" not found`);
  }

  const sourceItems = await StorageItem.find({ store: sourceStore._id, isActive: true })
    .sort({ code: 1 })
    .lean();

  if (sourceItems.length === 0) {
    throw new Error(`Source store "${sourceStore.name}" has no active storage items`);
  }

  console.log(`Source: ${sourceStore.name} (${sourceStore.code}) — ${sourceItems.length} items\n`);

  let totalCreated = 0;

  for (const store of stores) {
    if (store._id.toString() === sourceStore._id.toString()) {
      console.log(`Skip source store: ${store.name} (${store.code})`);
      continue;
    }

    const existing = await StorageItem.find({ store: store._id }).select("code").lean();
    const existingCodes = new Set(existing.map((i) => i.code));

    const missing = sourceItems.filter((item) => !existingCodes.has(item.code));
    if (missing.length === 0) {
      console.log(`${store.name} (${store.code}): already complete`);
      continue;
    }

    console.log(`${store.name} (${store.code}): creating ${missing.length} item(s)`);
    for (const template of missing) {
      const payload = {
        store: store._id,
        name: template.name,
        code: template.code,
        description: template.description,
        category: template.category,
        unit: template.unit,
        currentStock: 0,
        minStock: template.minStock ?? 0,
        maxStock: template.maxStock ?? 1000,
        averageCost: template.averageCost ?? 0,
        lastPurchaseCost: template.lastPurchaseCost ?? 0,
        isActive: template.isActive ?? true,
        createdBy: template.createdBy,
      };

      console.log(`  + ${template.code} | ${template.name}`);
      if (isExecute) {
        await StorageItem.create(payload);
      }
      totalCreated += 1;
    }
  }

  console.log(`\n${isExecute ? "Created" : "Would create"} ${totalCreated} storage item(s)`);
  if (!isExecute && totalCreated > 0) {
    console.log("\nRe-run with --execute to apply changes.");
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
