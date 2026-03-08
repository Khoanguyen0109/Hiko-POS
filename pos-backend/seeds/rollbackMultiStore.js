/**
 * Rollback script to undo the multi-store migration.
 * 
 * Usage: node seeds/rollbackMultiStore.js
 * 
 * What it does:
 * 1. Finds the default "Main Store" (code: MAIN)
 * 2. Removes the `store` field from all documents that were assigned to it
 * 3. Deletes all StoreUser entries for that store
 * 4. Optionally deletes the default store itself (pass --delete-store flag)
 * 
 * Safe to run multiple times — only affects documents tied to the MAIN store.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config/config");

const Store = require("../models/storeModel");
const StoreUser = require("../models/storeUserModel");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");
const Category = require("../models/categoryModel");
const Dish = require("../models/dishModel");
const Customer = require("../models/customerModel");
const Topping = require("../models/toppingModel");
const Promotion = require("../models/promotionModel");
const Payment = require("../models/paymentModel");
const { Spending, SpendingCategory, Vendor } = require("../models/spendingModel");
const StorageItem = require("../models/storageItemModel");
const StorageImport = require("../models/storageImportModel");
const StorageExport = require("../models/storageExportModel");
const Supplier = require("../models/supplierModel");
const Schedule = require("../models/scheduleModel");
const ShiftTemplate = require("../models/shiftTemplateModel");
const ExtraWork = require("../models/extraWorkModel");

const deleteStore = process.argv.includes("--delete-store");

async function rollback() {
    try {
        await mongoose.connect(config.databaseURI);
        console.log("Connected to MongoDB");

        const defaultStore = await Store.findOne({ code: "MAIN" });
        if (!defaultStore) {
            console.log("No default store (code: MAIN) found. Nothing to rollback.");
            return;
        }

        const storeId = defaultStore._id;
        console.log(`Found default store: ${defaultStore.name} (${storeId})`);

        const storeCount = await Store.countDocuments();
        if (storeCount > 1) {
            console.warn("\n⚠  WARNING: Multiple stores exist. This rollback only removes the store");
            console.warn("   field from documents assigned to the MAIN store. Documents assigned");
            console.warn("   to other stores will NOT be affected.\n");
        }

        const collections = [
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

        console.log("\n--- Removing store field from documents ---");
        for (const { model, name } of collections) {
            const result = await model.updateMany(
                { store: storeId },
                { $unset: { store: "" } }
            );
            if (result.modifiedCount > 0) {
                console.log(`  ${name}: reverted ${result.modifiedCount} documents`);
            } else {
                console.log(`  ${name}: no documents to revert`);
            }
        }

        console.log("\n--- Removing StoreUser entries ---");
        const storeUserResult = await StoreUser.deleteMany({ store: storeId });
        console.log(`  Deleted ${storeUserResult.deletedCount} StoreUser entries`);

        if (deleteStore) {
            console.log("\n--- Deleting default store ---");
            await Store.deleteOne({ _id: storeId });
            console.log(`  Deleted store: ${defaultStore.name}`);
        } else {
            console.log("\n  Default store kept (pass --delete-store to remove it)");
        }

        console.log("\nRollback completed successfully!");

    } catch (error) {
        console.error("Rollback failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

rollback();
