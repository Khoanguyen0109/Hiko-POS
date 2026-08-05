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

/** Target-store legacy codes that should align to source codes */
const CODE_ALIASES: Record<string, string> = {
  BOCMOCJI: "BOCMOCHI",
  HOPKEMOREO: "HOPDUNGKEM",
  HOPMOCHI: "HOPDUNGMOCHI",
  XIENDAI: "XIENMOCHI",
  "XIEN NGẮN": "XIENNGAN",
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function catalogFields(template: Record<string, unknown>) {
  return {
    name: template.name,
    code: template.code,
    description: template.description,
    category: template.category,
    unit: template.unit,
    minStock: template.minStock ?? 0,
    maxStock: template.maxStock ?? 1000,
    averageCost: template.averageCost ?? 0,
    lastPurchaseCost: template.lastPurchaseCost ?? 0,
    isActive: template.isActive ?? true,
    contentQuantity: template.contentQuantity ?? 0,
    contentUnit: template.contentUnit ?? "",
  };
}

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

  const sourceItems = await StorageItem.find({ store: sourceStore._id })
    .sort({ code: 1 })
    .lean();

  if (sourceItems.length === 0) {
    throw new Error(`Source store "${sourceStore.name}" has no active storage items`);
  }

  console.log(`Source: ${sourceStore.name} (${sourceStore.code}) — ${sourceItems.length} items\n`);

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const store of stores) {
    if (store._id.toString() === sourceStore._id.toString()) {
      console.log(`Skip source store: ${store.name} (${store.code})`);
      continue;
    }

    const existingItems = await StorageItem.find({ store: store._id }).lean();
    const existingByCode = new Map(existingItems.map((i) => [i.code, i]));
    const existingByName = new Map(existingItems.map((i) => [normalizeName(i.name), i]));

    const missing = sourceItems.filter((item) => !existingByCode.has(item.code));
    if (missing.length === 0) {
      console.log(`${store.name} (${store.code}): already complete`);
      continue;
    }

    console.log(`${store.name} (${store.code}): syncing ${missing.length} item(s)`);
    for (const template of missing) {
      const aliasTarget = Object.entries(CODE_ALIASES).find(([, sourceCodeValue]) => sourceCodeValue === template.code);
      const aliasMatch = aliasTarget
        ? existingByCode.get(aliasTarget[0])
        : null;
      const nameMatch = existingByName.get(normalizeName(template.name));
      const match = aliasMatch || nameMatch;

      if (match) {
        console.log(`  ~ ${match.code} -> ${template.code} | ${template.name} (align existing)`);
        if (isExecute) {
          await StorageItem.updateOne(
            { _id: match._id },
            { $set: catalogFields(template) }
          );
        }
        totalUpdated += 1;
        continue;
      }

      const payload = {
        store: store._id,
        ...catalogFields(template),
        currentStock: 0,
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
  console.log(`${isExecute ? "Updated" : "Would update"} ${totalUpdated} storage item(s)`);
  if (!isExecute && (totalCreated > 0 || totalUpdated > 0)) {
    console.log("\nRe-run with --execute to apply changes.");
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
