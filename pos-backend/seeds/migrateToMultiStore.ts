// @ts-nocheck
/**
 * Migration script to convert existing single-store data to multi-store structure.
 * 
 * Usage:
 *   node seeds/migrateToMultiStore.js              # runs with confirmation prompt
 *   node seeds/migrateToMultiStore.js --dry-run    # preview only, no changes
 *   node seeds/migrateToMultiStore.js --force       # skip confirmation prompt
 * 
 * What it does:
 * 1. Creates a default "Main Store" if no stores exist
 * 2. Assigns all existing data (orders, tables, dishes, etc.) to the default store
 * 3. Creates StoreUser entries for all existing users
 * 
 * Rollback: node seeds/rollbackMultiStore.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import type { Model } from "mongoose";
import readline from "readline";
import config from "../config/config.js";

type MigratableModel = Model<unknown>;
type CollectionEntry = { model: MigratableModel; name: string };

// Models
import Store from "../models/storeModel.js";
import StoreUser from "../models/storeUserModel.js";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import Table from "../models/tableModel.js";
import Category from "../models/categoryModel.js";
import Dish from "../models/dishModel.js";
import Customer from "../models/customerModel.js";
import Topping from "../models/toppingModel.js";
import Promotion from "../models/promotionModel.js";
import Payment from "../models/paymentModel.js";
import { Spending, SpendingCategory, Vendor } from "../models/spendingModel.js";
import StorageItem from "../models/storageItemModel.js";
import StorageImport from "../models/storageImportModel.js";
import StorageExport from "../models/storageExportModel.js";
import Supplier from "../models/supplierModel.js";
import Schedule from "../models/scheduleModel.js";
import ShiftTemplate from "../models/shiftTemplateModel.js";
import ExtraWork from "../models/extraWorkModel.js";

const isDryRun = process.argv.includes("--dry-run");
const isForce = process.argv.includes("--force");

const noStoreFilter = { $or: [{ store: { $exists: false } }, { store: null }] };

function askConfirmation(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });
}

async function migrate() {
    try {
        await mongoose.connect(config.databaseURI);
        console.log("Connected to MongoDB");

        if (isDryRun) {
            console.log("\n========== DRY RUN — no changes will be made ==========\n");
        }

        // 1. Find or preview default store
        let defaultStore = await Store.findOne({ code: "MAIN" });
        if (!defaultStore) {
            if (isDryRun) {
                console.log("[DRY RUN] Would create default store: Main Store (MAIN)");
            } else {
                const firstAdmin = await User.findOne({ role: "Admin" });
                defaultStore = await Store.create({
                    name: "Main Store",
                    code: "MAIN",
                    address: "",
                    phone: "",
                    owner: firstAdmin ? firstAdmin._id : undefined,
                    settings: {
                        currency: "VND",
                        timezone: "Asia/Ho_Chi_Minh"
                    }
                });
                console.log(`Created default store: ${defaultStore.name} (${defaultStore._id})`);
            }
        } else {
            console.log(`Default store exists: ${defaultStore.name} (${defaultStore._id})`);
        }

        const storeId = defaultStore?._id;

        // 2. Count / assign users
        const users = await User.find({});
        let usersToAssign = 0;
        for (const user of users) {
            if (storeId) {
                const exists = await StoreUser.findOne({ user: user._id, store: storeId });
                if (!exists) usersToAssign++;
            } else {
                usersToAssign++;
            }
        }
        console.log(`\nUsers to assign to store: ${usersToAssign}`);

        if (!isDryRun && storeId) {
            let storeUsersCreated = 0;
            for (const user of users) {
                const exists = await StoreUser.findOne({ user: user._id, store: storeId });
                if (!exists) {
                    await StoreUser.create({
                        user: user._id,
                        store: storeId,
                        role: user.role === "Admin" ? "Owner" : "Staff"
                    });
                    storeUsersCreated++;
                }
            }
            console.log(`Created ${storeUsersCreated} StoreUser entries`);
        }

        // 3. Count / update all collections
        const collections: CollectionEntry[] = [
            { model: Order, name: "Orders" },
            { model: Table, name: "Tables" },
            { model: Category, name: "Categories" },
            { model: Dish, name: "Dishes" },
            { model: Customer, name: "Customers" },
            { model: Topping, name: "Toppings" },
            { model: Promotion, name: "Promotions" },
            { model: Payment, name: "Payments" },
            { model: Spending, name: "Spending" },
            { model: SpendingCategory, name: "SpendingCategories" },
            { model: Vendor, name: "Vendors" },
            { model: StorageItem, name: "StorageItems" },
            { model: StorageImport, name: "StorageImports" },
            { model: StorageExport, name: "StorageExports" },
            { model: Supplier, name: "Suppliers" },
            { model: Schedule, name: "Schedules" },
            { model: ShiftTemplate, name: "ShiftTemplates" },
            { model: ExtraWork, name: "ExtraWork" },
        ];

        console.log("\n--- Documents without a store ---");
        let totalToMigrate = 0;
        const counts: Array<{ model: MigratableModel; name: string; count: number }> = [];
        for (const { model, name } of collections) {
            const count = await model.countDocuments(noStoreFilter);
            counts.push({ model, name, count });
            totalToMigrate += count;
            if (count > 0) {
                console.log(`  ${name}: ${count}`);
            } else {
                console.log(`  ${name}: 0 (already migrated)`);
            }
        }

        console.log(`\n  Total documents to migrate: ${totalToMigrate}`);

        if (isDryRun) {
            console.log("\n========== DRY RUN complete — run without --dry-run to apply ==========");
            return;
        }

        if (totalToMigrate === 0 && usersToAssign === 0) {
            console.log("\nNothing to migrate. Everything is already assigned to a store.");
            return;
        }

        if (!isForce) {
            const answer = await askConfirmation(
                `\nProceed with migration? ${totalToMigrate} documents will be updated. (y/N): `
            );
            if (answer !== "y" && answer !== "yes") {
                console.log("Migration cancelled.");
                return;
            }
        }

        console.log("\n--- Assigning store to documents ---");
        for (const { model, name, count } of counts) {
            if (count === 0) continue;
            const result = await model.updateMany(
                noStoreFilter,
                { $set: { store: storeId } }
            );
            console.log(`  ${name}: updated ${result.modifiedCount} documents`);
        }

        console.log("\nMigration completed successfully!");
        console.log(`Default store ID: ${storeId}`);
        console.log(`\nTo rollback: node seeds/rollbackMultiStore.js`);

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

migrate();
