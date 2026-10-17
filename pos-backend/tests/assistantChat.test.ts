import { describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import Store from "../models/storeModel.js";
import User from "../models/userModel.js";
import StorageItem from "../models/storageItemModel.js";
import { handleChat } from "../services/assistant/assistantService.js";

async function fixture() {
    const store = await Store.create({ name: "Main", code: "MAIN" });
    const user = await User.create({
        name: "An",
        phone: "0900000001",
        password: "secret12",
        role: "User",
    });
    await StorageItem.create({
        store: store._id,
        name: "Rice",
        code: "RICE",
        unit: "kg",
        currentStock: 12,
    });
    return {
        actor: { _id: user._id as mongoose.Types.ObjectId, name: "An", role: "User" },
        store: { _id: store._id as mongoose.Types.ObjectId, name: "Main" },
    };
}

describe("handleChat", () => {
    it("reports on-hand stock for a single match", async () => {
        const { actor, store } = await fixture();
        const result = await handleChat("How much rice is left?", actor, store);
        expect(result.reply).toBe("Rice on hand: 12 kg.");
        expect(result.slip).toBeNull();
    });

    it("drafts an import and keeps confirm blocked without a unit cost", async () => {
        const { actor, store } = await fixture();
        const result = await handleChat("Import 5 kg rice", actor, store);
        expect(result.slip?.blocked).toBe("Unit cost needed");
        expect(result.slip?.rows).toContainEqual(["On hand after", "17 kg"]);
        expect(result.slip?.draftId).toBeTruthy();
    });

    it("refuses a shift edit for a non-admin", async () => {
        const { actor, store } = await fixture();
        const result = await handleChat("Assign Mai to Friday dinner", actor, store);
        expect(result.reply).toBe("Only an admin can change shifts.");
        expect(result.slip).toBeNull();
    });
});
