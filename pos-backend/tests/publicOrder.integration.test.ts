/**
 * Public web-order API. Prices come from the dish record, not the client.
 *
 * Run: cd pos-backend && npm run test:integration -- --testPathPatterns=publicOrder
 */
import { beforeEach, describe, expect, test } from "@jest/globals";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import Store from "../models/storeModel.js";
import Category from "../models/categoryModel.js";
import Dish from "../models/dishModel.js";
import Order from "../models/orderModel.js";
import publicOrderRoute from "../routes/publicOrderRoute.js";
import globalErrorHandler from "../middlewares/globalErrorHandler.js";

process.env.HIKO_ORDER_KEY = "test-order-key";

const app = express();
app.use(express.json());
app.use("/api/public", publicOrderRoute);
app.use(globalErrorHandler);

const KEY = { "x-hiko-order-key": "test-order-key" };

describe("public web orders", () => {
    let storeId = "";
    let otherStoreId = "";
    let dishId = "";
    let otherDishId = "";

    beforeEach(async () => {
        const store = await Store.create({
            name: "Tân Bình",
            code: "TB",
            address: "281/25/1 Lê Văn Sỹ",
            phone: "0900000001",
            mapUrl: "https://maps.google.com/?q=hiko",
            bankName: "Techcombank",
            bankAccountNumber: "19074858483012",
            bankAccountName: "HKD THE HIKO MATCHA",
            bankQrImage: "https://hikomatcha.vn/qr/techcombank-hiko.jpg",
        });
        const other = await Store.create({ name: "Gò Vấp", code: "GV" });
        const category = await Category.create({ name: "Đỉnh của chóp", color: "#016D3B", store: store._id });
        const dish = await Dish.create({
            store: store._id,
            name: "Cold Whisk",
            price: 49000,
            category: category._id,
            hasSizeVariants: true,
            sizeVariants: [
                { size: "Medium", price: 49000, isDefault: true },
                { size: "Large", price: 59000 },
            ],
        });
        const otherDish = await Dish.create({
            store: other._id,
            name: "Secret",
            price: 1000,
            category: category._id,
        });
        storeId = store._id.toString();
        otherStoreId = other._id.toString();
        dishId = dish._id.toString();
        otherDishId = otherDish._id.toString();
    });

    test("rejects a missing key", async () => {
        const response = await request(app).get("/api/public/stores");
        expect(response.status).toBe(401);
    });

    test("lists the active store without owner data", async () => {
        const response = await request(app).get("/api/public/stores").set(KEY);
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: "Tân Bình",
                    mapUrl: "https://maps.google.com/?q=hiko",
                    bankName: "Techcombank",
                }),
            ])
        );
        expect(response.body.data[0].owner).toBeUndefined();
    });

    test("prices the order from the dish, not the client", async () => {
        const response = await request(app)
            .post("/api/public/orders")
            .set(KEY)
            .send({
                storeId,
                orderNote: "Ít đá",
                customer: {
                    name: "Nguyễn An",
                    phone: "0901234567",
                    address: "12 Nguyễn Văn Trỗi",
                },
                items: [{ dishId, size: "Large", quantity: 2, price: 1 }],
            });

        expect(response.status).toBe(201);
        expect(response.body.data.total).toBe(118000);
        expect(response.body.data.transferContent).toMatch(/^HIKO [A-Z2-9]{4}$/);

        const saved = await Order.findOne({ publicToken: response.body.data.token });
        expect(saved?.source).toBe("web");
        expect(saved?.paymentMethod).toBe("Banking");
        expect(saved?.orderStatus).toBe("pending");
        expect(saved?.bills.total).toBe(118000);
        expect(saved?.customerDetails?.address).toBe("12 Nguyễn Văn Trỗi");

        const receipt = await request(app)
            .get(`/api/public/orders/${response.body.data.token}`)
            .set(KEY);
        expect(receipt.status).toBe(200);
        expect(receipt.body.data.total).toBe(118000);
        expect(receipt.body.data.bank.bankQrImage).toContain("techcombank");
    });

    test("rejects a dish from another store", async () => {
        const response = await request(app)
            .post("/api/public/orders")
            .set(KEY)
            .send({
                storeId,
                customer: { name: "An", phone: "0901234567", address: "12 Nguyễn Văn Trỗi" },
                items: [{ dishId: otherDishId, quantity: 1 }],
            });
        expect(response.status).toBe(400);
        expect(otherStoreId).not.toBe(storeId);
        expect(mongoose.Types.ObjectId.isValid(otherDishId)).toBe(true);
    });
});
