import crypto from "crypto";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import Store from "../models/storeModel.js";
import Dish from "../models/dishModel.js";
import "../models/toppingModel.js";
import Customer from "../models/customerModel.js";
import Order from "../models/orderModel.js";
import { getCurrentVietnamTime } from "../utils/dateUtils.js";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_QUANTITY = 20;
const MAX_TOPPING_QUANTITY = 10;

interface SizeVariantDoc {
    _id: mongoose.Types.ObjectId;
    size: string;
    price: number;
    isDefault?: boolean;
}

interface ToppingDoc {
    _id: mongoose.Types.ObjectId;
    name: string;
    price: number;
    category?: string;
    isAvailable?: boolean;
    store?: mongoose.Types.ObjectId;
}

interface CategoryDoc {
    _id: mongoose.Types.ObjectId;
    name?: string;
    color?: string;
    isActive?: boolean;
}

interface DishDoc {
    _id: mongoose.Types.ObjectId;
    name: string;
    price: number;
    image?: string;
    note?: string;
    store?: mongoose.Types.ObjectId | null;
    isAvailable?: boolean;
    hasSizeVariants?: boolean;
    sizeVariants?: SizeVariantDoc[];
    allowToppings?: boolean;
    compatibleToppings?: ToppingDoc[];
    category?: CategoryDoc | mongoose.Types.ObjectId;
}

interface RequestItem {
    dishId?: unknown;
    size?: unknown;
    quantity?: unknown;
    toppingIds?: unknown;
    toppings?: unknown;
}

function asString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function makePublicCode(): string {
    let code = "";
    for (let index = 0; index < 4; index += 1) {
        const byte = crypto.randomBytes(1)[0] ?? 0;
        code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
    }
    return code;
}

function isDuplicateKey(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function requestedToppings(item: RequestItem): { id: string; quantity: number }[] {
    const counts = new Map<string, number>();
    const entries = Array.isArray(item.toppings) ? item.toppings : [];
    for (const entry of entries) {
        if (!entry || typeof entry !== "object") continue;
        const record = entry as { toppingId?: unknown; id?: unknown; quantity?: unknown };
        const id = asString(record.toppingId) || asString(record.id);
        const quantity = Number(record.quantity ?? 1);
        if (!id) continue;
        counts.set(id, (counts.get(id) || 0) + quantity);
    }
    if (counts.size === 0 && Array.isArray(item.toppingIds)) {
        for (const id of item.toppingIds.map((value) => asString(value)).filter(Boolean)) {
            counts.set(id, (counts.get(id) || 0) + 1);
        }
    }
    return [...counts.entries()].map(([id, quantity]) => ({ id, quantity }));
}

function dishBelongsToStore(dish: DishDoc, storeId: string): boolean {
    if (!dish.store) return true;
    return dish.store.toString() === storeId;
}

function publicStore(store: {
    _id: unknown;
    name: string;
    address?: string | null;
    phone?: string | null;
    mapUrl?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
    bankQrImage?: string | null;
}) {
    return {
        id: String(store._id),
        name: store.name,
        address: store.address || "",
        phone: store.phone || "",
        mapUrl: store.mapUrl || "",
        bankName: store.bankName || "",
        bankAccountNumber: store.bankAccountNumber || "",
        bankAccountName: store.bankAccountName || "",
        bankQrImage: store.bankQrImage || "",
    };
}

const listPublicStores = async (req, res, next) => {
    try {
        const stores = await Store.find({ isActive: true }).sort({ name: 1 }).lean();
        res.status(200).json({
            success: true,
            data: stores.map((store) => publicStore(store)),
        });
    } catch (error) {
        next(error);
    }
};

const getPublicMenu = async (req, res, next) => {
    try {
        const storeId = asString(req.params.id);
        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            return next(createHttpError(400, "Cửa hàng không hợp lệ"));
        }

        const store = await Store.findOne({ _id: storeId, isActive: true }).lean();
        if (!store) {
            return next(createHttpError(404, "Cửa hàng không tồn tại"));
        }

        const dishes = await Dish.find({
            isAvailable: true,
            $or: [{ store: storeId }, { store: null }],
        })
            .populate("category", "name isActive color")
            .populate("compatibleToppings", "name price category isAvailable store")
            .sort({ name: 1 })
            .lean();

        const grouped = new Map<string, { id: string; name: string; color: string; dishes: unknown[] }>();

        for (const dish of dishes as unknown as DishDoc[]) {
            const category = dish.category;
            if (!category || typeof category !== "object" || !("name" in category) || !category.name) {
                continue;
            }
            if (category.isActive === false) continue;

            const toppings = (dish.compatibleToppings || [])
                .filter((topping) => topping.isAvailable !== false)
                .filter((topping) => !topping.store || topping.store.toString() === storeId)
                .map((topping) => ({
                    id: topping._id,
                    name: topping.name,
                    price: topping.price,
                    category: topping.category || "",
                }));

            const sizes = (dish.sizeVariants || []).map((variant) => ({
                id: variant._id,
                size: variant.size,
                price: variant.price,
                isDefault: Boolean(variant.isDefault),
            }));

            const categoryId = category._id.toString();
            const bucket = grouped.get(categoryId) || {
                id: categoryId,
                name: category.name,
                color: category.color || "",
                dishes: [],
            };
            bucket.dishes.push({
                id: dish._id,
                name: dish.name,
                image: dish.image || "",
                price: dish.price,
                hasSizeVariants: Boolean(dish.hasSizeVariants && sizes.length > 0),
                sizes,
                allowToppings: Boolean(dish.allowToppings && toppings.length > 0),
                toppings,
            });
            grouped.set(categoryId, bucket);
        }

        res.status(200).json({
            success: true,
            data: {
                store: publicStore(store),
                categories: [...grouped.values()],
            },
        });
    } catch (error) {
        next(error);
    }
};

const createPublicOrder = async (req, res, next) => {
    try {
        const storeId = asString(req.body?.storeId);
        const name = asString(req.body?.customer?.name);
        const phone = asString(req.body?.customer?.phone);
        const address = asString(req.body?.customer?.address);
        const orderNote = asString(req.body?.orderNote).slice(0, 300);
        const items = Array.isArray(req.body?.items) ? (req.body.items as RequestItem[]) : [];

        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            return next(createHttpError(400, "Cửa hàng không hợp lệ"));
        }
        if (!/^\d{10}$/.test(phone)) {
            return next(createHttpError(400, "Số điện thoại phải có 10 chữ số"));
        }
        if (!name || name.length > 80) {
            return next(createHttpError(400, "Vui lòng nhập tên"));
        }
        if (!address || address.length > 200) {
            return next(createHttpError(400, "Vui lòng nhập địa chỉ"));
        }
        if (items.length === 0) {
            return next(createHttpError(400, "Giỏ hàng trống"));
        }

        const store = await Store.findOne({ _id: storeId, isActive: true });
        if (!store) {
            return next(createHttpError(404, "Cửa hàng không tồn tại"));
        }

        const dishIds = items.map((item) => asString(item.dishId)).filter((id) => mongoose.Types.ObjectId.isValid(id));
        const dishes = await Dish.find({ _id: { $in: dishIds } })
            .populate("category", "name")
            .populate("compatibleToppings", "name price category isAvailable store");
        const dishById = new Map(dishes.map((dish) => [dish._id.toString(), dish as unknown as DishDoc]));

        const orderItems = items.map((item, index) => {
            const dishId = asString(item.dishId);
            const dish = dishById.get(dishId);
            if (!dish || dish.isAvailable === false || !dishBelongsToStore(dish, storeId)) {
                throw createHttpError(400, `Món không còn bán (dòng ${index + 1})`);
            }

            const quantity = Number(item.quantity);
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
                throw createHttpError(400, `Số lượng không hợp lệ (dòng ${index + 1})`);
            }

            const requestedSize = asString(item.size);
            let unitPrice = dish.price;
            let variant: { size: string; price: number } | undefined;
            const sizes = dish.sizeVariants || [];
            if (dish.hasSizeVariants && sizes.length > 0) {
                const match = sizes.find((size) => size.size.toLowerCase() === requestedSize.toLowerCase())
                    || sizes.find((size) => size.isDefault)
                    || sizes[0];
                if (!match) {
                    throw createHttpError(400, `Chưa chọn size (dòng ${index + 1})`);
                }
                unitPrice = match.price;
                variant = { size: match.size, price: match.price };
            }

            const allowedToppings = new Map(
                (dish.allowToppings ? dish.compatibleToppings || [] : [])
                    .filter((topping) => topping?._id && topping.isAvailable !== false)
                    .filter((topping) => !topping.store || topping.store.toString() === storeId)
                    .map((topping) => [topping._id.toString(), topping])
            );
            const toppings = requestedToppings(item).map((requested) => {
                if (!Number.isInteger(requested.quantity) || requested.quantity < 1 || requested.quantity > MAX_TOPPING_QUANTITY) {
                    throw createHttpError(400, `Số lượng topping không hợp lệ (dòng ${index + 1})`);
                }
                const topping = allowedToppings.get(requested.id);
                if (!topping) {
                    throw createHttpError(400, `Topping không dùng cho món này (dòng ${index + 1})`);
                }
                return {
                    toppingId: topping._id,
                    name: topping.name,
                    price: topping.price,
                    quantity: requested.quantity,
                };
            });

            const toppingTotal = toppings.reduce((sum, topping) => sum + topping.price * topping.quantity, 0);
            const pricePerQuantity = unitPrice + toppingTotal;
            const lineTotal = pricePerQuantity * quantity;
            const categoryName = dish.category && typeof dish.category === "object" && "name" in dish.category
                ? dish.category.name || ""
                : "";

            return {
                dishId: dish._id,
                name: dish.name,
                originalPricePerQuantity: pricePerQuantity,
                pricePerQuantity,
                quantity,
                originalPrice: lineTotal,
                price: lineTotal,
                category: categoryName,
                image: dish.image || "",
                variant,
                toppings,
            };
        });

        const total = orderItems.reduce((sum, item) => sum + item.price, 0);
        let customer = await Customer.findOne({ phone });
        if (!customer) {
            customer = await Customer.create({ phone, name });
        } else if (customer.name !== name) {
            customer.name = name;
            await customer.save();
        }

        const order = new Order({
            store: store._id,
            customer: customer._id,
            customerDetails: { name, phone, address, guests: 1 },
            source: "web",
            orderNote,
            orderStatus: "pending",
            paymentMethod: "Banking",
            paymentStatus: "pending",
            orderDate: getCurrentVietnamTime(),
            bills: {
                subtotal: total,
                promotionDiscount: 0,
                rewardDiscount: 0,
                total,
                tax: 0,
                totalWithTax: total,
            },
            items: orderItems,
            createdBy: { userName: "Web" },
            orderHistory: [{
                changeType: "order_created",
                description: "Web order created",
                changedBy: { userName: "Web" },
                details: { source: "web" },
            }],
        });

        for (let attempt = 0; attempt < 5; attempt += 1) {
            order.publicCode = makePublicCode();
            order.publicToken = crypto.randomBytes(16).toString("hex");
            try {
                await order.save();
                break;
            } catch (error) {
                if (isDuplicateKey(error) && attempt < 4) continue;
                throw error;
            }
        }

        res.status(201).json({
            success: true,
            data: {
                token: order.publicToken,
                publicCode: order.publicCode,
                transferContent: `HIKO ${order.publicCode}`,
                total,
                bank: {
                    bankName: store.bankName || "",
                    bankAccountNumber: store.bankAccountNumber || "",
                    bankAccountName: store.bankAccountName || "",
                    bankQrImage: store.bankQrImage || "",
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

const getPublicReceipt = async (req, res, next) => {
    try {
        const token = asString(req.params.token);
        if (!token) {
            return next(createHttpError(400, "Không tìm thấy đơn"));
        }

        const order = await Order.findOne({ publicToken: token, source: "web" });
        if (!order) {
            return next(createHttpError(404, "Không tìm thấy đơn"));
        }

        const store = await Store.findById(order.store).lean();
        if (!store) {
            return next(createHttpError(404, "Cửa hàng không tồn tại"));
        }

        res.status(200).json({
            success: true,
            data: {
                publicCode: order.publicCode,
                transferContent: `HIKO ${order.publicCode}`,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus,
                orderNote: order.orderNote || "",
                customer: {
                    name: order.customerDetails?.name || "",
                    phone: order.customerDetails?.phone || "",
                    address: order.customerDetails?.address || "",
                },
                items: order.items.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    size: item.variant?.size || "",
                    toppings: (item.toppings || []).map((topping) => (
                        topping.quantity > 1 ? `${topping.name} ×${topping.quantity}` : topping.name
                    )),
                })),
                total: order.bills?.totalWithTax ?? 0,
                store: {
                    name: store.name,
                    address: store.address || "",
                    mapUrl: store.mapUrl || "",
                },
                bank: {
                    bankName: store.bankName || "",
                    bankAccountNumber: store.bankAccountNumber || "",
                    bankAccountName: store.bankAccountName || "",
                    bankQrImage: store.bankQrImage || "",
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

export { listPublicStores, getPublicMenu, createPublicOrder, getPublicReceipt };
