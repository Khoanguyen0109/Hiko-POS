const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Store = require("../models/storeModel");
const StoreUser = require("../models/storeUserModel");
const User = require("../models/userModel");

const createStore = async (req, res, next) => {
    try {
        const { name, code, address, phone, settings } = req.body;

        if (!name || !code) {
            return next(createHttpError(400, "Store name and code are required."));
        }

        const existing = await Store.findOne({ code: code.toUpperCase() });
        if (existing) {
            return next(createHttpError(400, "A store with this code already exists."));
        }

        const store = new Store({
            name: name.trim(),
            code: code.toUpperCase().trim(),
            address: address ? address.trim() : undefined,
            phone: phone ? phone.trim() : undefined,
            owner: req.user._id,
            settings: settings || {}
        });

        await store.save();

        // Auto-create StoreUser for the creator as Owner
        await StoreUser.create({
            user: req.user._id,
            store: store._id,
            role: "Owner"
        });

        res.status(201).json({
            success: true,
            message: "Store created successfully!",
            data: store
        });
    } catch (error) {
        next(error);
    }
};

const getAllStores = async (req, res, next) => {
    try {
        const stores = await Store.find()
            .populate('owner', 'name phone email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: stores });
    } catch (error) {
        next(error);
    }
};

const getMyStores = async (req, res, next) => {
    try {
        const storeUsers = await StoreUser.find({
            user: req.user._id,
            isActive: true
        }).populate({
            path: 'store',
            match: { isActive: true }
        });

        const stores = storeUsers
            .filter(su => su.store)
            .map(su => ({
                _id: su.store._id,
                name: su.store.name,
                code: su.store.code,
                address: su.store.address,
                phone: su.store.phone,
                role: su.role,
                settings: su.store.settings
            }));

        res.status(200).json({ success: true, data: stores });
    } catch (error) {
        next(error);
    }
};

const getStoreById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid store ID."));
        }

        const store = await Store.findById(id).populate('owner', 'name phone email');
        if (!store) {
            return next(createHttpError(404, "Store not found."));
        }
        if (!store.isActive) {
            return next(createHttpError(404, "Store not found."));
        }

        const isAdmin = req.user?.role === "Admin";
        if (!isAdmin) {
            const membership = await StoreUser.findOne({
                user: req.user._id,
                store: id,
                isActive: true
            });
            if (!membership) {
                return next(createHttpError(403, "You do not have access to this store."));
            }
        }

        res.status(200).json({ success: true, data: store });
    } catch (error) {
        next(error);
    }
};

const updateStore = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, address, phone, settings, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid store ID."));
        }

        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (address !== undefined) updates.address = address.trim();
        if (phone !== undefined) updates.phone = phone.trim();
        if (settings !== undefined) updates.settings = settings;
        if (isActive !== undefined) updates.isActive = Boolean(isActive);

        const store = await Store.findByIdAndUpdate(id, updates, { new: true });
        if (!store) {
            return next(createHttpError(404, "Store not found."));
        }

        res.status(200).json({
            success: true,
            message: "Store updated successfully!",
            data: store
        });
    } catch (error) {
        next(error);
    }
};

const deleteStore = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(400, "Invalid store ID."));
        }

        const store = await Store.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!store) {
            return next(createHttpError(404, "Store not found."));
        }

        res.status(200).json({
            success: true,
            message: "Store deactivated successfully."
        });
    } catch (error) {
        next(error);
    }
};

// Store member management
const getStoreMembers = async (req, res, next) => {
    try {
        const storeId = req.store._id;

        const members = await StoreUser.find({ store: storeId })
            .populate('user', 'name phone email role isActive salary')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: members });
    } catch (error) {
        next(error);
    }
};

const addStoreMember = async (req, res, next) => {
    try {
        const storeId = req.store._id;
        const { userId, role } = req.body;

        if (!userId) {
            return next(createHttpError(400, "User ID is required."));
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return next(createHttpError(400, "Invalid user ID."));
        }

        const user = await User.findById(userId);
        if (!user) {
            return next(createHttpError(404, "User not found."));
        }

        const existing = await StoreUser.findOne({ user: userId, store: storeId });
        if (existing) {
            if (!existing.isActive) {
                existing.isActive = true;
                existing.role = role || "Staff";
                await existing.save();
                const populated = await existing.populate('user', 'name phone email role');
                return res.status(200).json({
                    success: true,
                    message: "Member re-activated in store.",
                    data: populated
                });
            }
            return next(createHttpError(400, "User is already a member of this store."));
        }

        const storeUser = await StoreUser.create({
            user: userId,
            store: storeId,
            role: role || "Staff"
        });

        const populated = await storeUser.populate('user', 'name phone email role');

        res.status(201).json({
            success: true,
            message: "Member added to store successfully!",
            data: populated
        });
    } catch (error) {
        next(error);
    }
};

const updateStoreMemberRole = async (req, res, next) => {
    try {
        const storeId = req.store._id;
        const { userId } = req.params;
        const { role } = req.body;

        if (!role || !["Owner", "Manager", "Staff"].includes(role)) {
            return next(createHttpError(400, "Valid role is required (Owner, Manager, Staff)."));
        }

        const storeUser = await StoreUser.findOneAndUpdate(
            { user: userId, store: storeId },
            { role },
            { new: true }
        ).populate('user', 'name phone email role');

        if (!storeUser) {
            return next(createHttpError(404, "Store member not found."));
        }

        res.status(200).json({
            success: true,
            message: "Member role updated successfully!",
            data: storeUser
        });
    } catch (error) {
        next(error);
    }
};

const removeStoreMember = async (req, res, next) => {
    try {
        const storeId = req.store._id;
        const { userId } = req.params;

        const storeUser = await StoreUser.findOneAndUpdate(
            { user: userId, store: storeId },
            { isActive: false },
            { new: true }
        );

        if (!storeUser) {
            return next(createHttpError(404, "Store member not found."));
        }

        res.status(200).json({
            success: true,
            message: "Member removed from store."
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createStore,
    getAllStores,
    getMyStores,
    getStoreById,
    updateStore,
    deleteStore,
    getStoreMembers,
    addStoreMember,
    updateStoreMemberRole,
    removeStoreMember
};
