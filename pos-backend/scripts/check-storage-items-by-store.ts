/**
 * Compare storage items across all stores.
 * Usage: npx tsx scripts/check-storage-items-by-store.ts [--db test|pos-db]
 */
import "dotenv/config";
import mongoose from "mongoose";

const dbOverride = process.argv.find((a) => a.startsWith("--db="))?.split("=")[1];

function withDatabase(uri: string, dbName: string): string {
  const url = new URL(uri);
  url.pathname = `/${dbName}`;
  return url.toString();
}

async function run() {
  const baseUri = process.env.MONGODB_URI;
  if (!baseUri) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  const uri = dbOverride ? withDatabase(baseUri, dbOverride) : baseUri;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected to database: ${mongoose.connection.name}\n`);

  const stores = await mongoose.connection.db.collection("stores").find({}).sort({ code: 1 }).toArray();
  const allItems = await mongoose.connection.db.collection("storageitems").find({}).toArray();

  const byCode = new Map<string, { template: (typeof allItems)[0]; storeIds: Set<string> }>();
  for (const item of allItems) {
    const code = item.code as string;
    if (!byCode.has(code)) {
      byCode.set(code, { template: item, storeIds: new Set() });
    }
    byCode.get(code)!.storeIds.add(item.store.toString());
  }

  console.log("=== STORES ===");
  for (const store of stores) {
    const count = allItems.filter((i) => i.store.toString() === store._id.toString()).length;
    console.log(`  ${store.code} | ${store.name} | items: ${count}`);
  }

  console.log("\n=== STORAGE ITEMS BY STORE ===");
  for (const store of stores) {
    const items = allItems
      .filter((i) => i.store.toString() === store._id.toString())
      .sort((a, b) => String(a.code).localeCompare(String(b.code)));
    console.log(`\n${store.name} (${store.code}) — ${items.length} items`);
    for (const item of items) {
      console.log(`  ${item.code} | ${item.name} | ${item.unit} | stock: ${item.currentStock}`);
    }
  }

  console.log("\n=== MISSING PER STORE ===");
  for (const store of stores) {
    const sid = store._id.toString();
    const missing = [...byCode.entries()]
      .filter(([, data]) => !data.storeIds.has(sid))
      .map(([code, data]) => `${code} (${data.template.name})`);
    console.log(`\n${store.name} (${store.code}): missing ${missing.length}`);
    missing.forEach((m) => console.log(`  - ${m}`));
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Stores: ${stores.length}`);
  console.log(`Unique codes: ${byCode.size}`);
  const inAll = [...byCode.values()].filter((v) => v.storeIds.size === stores.length).length;
  console.log(`Codes in all stores: ${inAll}`);
  console.log(`Codes not in all stores: ${byCode.size - inAll}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
