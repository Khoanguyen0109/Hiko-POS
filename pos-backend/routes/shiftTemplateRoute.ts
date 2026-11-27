import express from "express";
import { getAllShiftTemplates, getActiveShiftTemplates, getShiftTemplateById, createShiftTemplate, updateShiftTemplate, deleteShiftTemplate, toggleActiveStatus } from "../controllers/shiftTemplateController.js";
import { isVerifiedUser, canManageStore } from "../middlewares/tokenVerification.js";
import { storeContext, optionalStoreContext } from "../middlewares/storeContext.js";

const router = express.Router();

// List endpoints: scoped to X-Store-Id when present; admin without header sees all stores
router.route("/active")
    .get(isVerifiedUser, optionalStoreContext, getActiveShiftTemplates);

router.route("/")
    .get(isVerifiedUser, optionalStoreContext, canManageStore, getAllShiftTemplates)
    .post(isVerifiedUser, storeContext, canManageStore, createShiftTemplate);

router.route("/:id/toggle-active")
    .patch(isVerifiedUser, storeContext, canManageStore, toggleActiveStatus);

router.route("/:id")
    .get(isVerifiedUser, optionalStoreContext, canManageStore, getShiftTemplateById)
    .put(isVerifiedUser, storeContext, canManageStore, updateShiftTemplate)
    .delete(isVerifiedUser, storeContext, canManageStore, deleteShiftTemplate);

export default router;
