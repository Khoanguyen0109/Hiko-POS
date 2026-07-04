import express from "express";
import { getAllShiftTemplates, getActiveShiftTemplates, getShiftTemplateById, createShiftTemplate, updateShiftTemplate, deleteShiftTemplate, toggleActiveStatus } from "../controllers/shiftTemplateController.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerification.js";
import { storeContext, optionalStoreContext } from "../middlewares/storeContext.js";

const router = express.Router();

// List endpoints: scoped to X-Store-Id when present; admin without header sees all stores
router.route("/active")
    .get(isVerifiedUser, optionalStoreContext, getActiveShiftTemplates);

router.route("/")
    .get(isVerifiedUser, isAdmin, optionalStoreContext, getAllShiftTemplates)
    .post(isVerifiedUser, isAdmin, storeContext, createShiftTemplate);

router.route("/:id/toggle-active")
    .patch(isVerifiedUser, isAdmin, storeContext, toggleActiveStatus);

router.route("/:id")
    .get(isVerifiedUser, isAdmin, optionalStoreContext, getShiftTemplateById)
    .put(isVerifiedUser, isAdmin, storeContext, updateShiftTemplate)
    .delete(isVerifiedUser, isAdmin, storeContext, deleteShiftTemplate);

export default router;
