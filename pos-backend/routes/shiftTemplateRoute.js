const express = require("express");
const {
    getAllShiftTemplates,
    getActiveShiftTemplates,
    getShiftTemplateById,
    createShiftTemplate,
    updateShiftTemplate,
    deleteShiftTemplate,
    toggleActiveStatus
} = require("../controllers/shiftTemplateController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");

const router = express.Router();

// Global templates — no store context needed
router.route("/active")
    .get(isVerifiedUser, getActiveShiftTemplates);

router.route("/")
    .get(isVerifiedUser, isAdmin, getAllShiftTemplates)
    .post(isVerifiedUser, isAdmin, createShiftTemplate);

router.route("/:id/toggle-active")
    .patch(isVerifiedUser, isAdmin, toggleActiveStatus);

router.route("/:id")
    .get(isVerifiedUser, isAdmin, getShiftTemplateById)
    .put(isVerifiedUser, isAdmin, updateShiftTemplate)
    .delete(isVerifiedUser, isAdmin, deleteShiftTemplate);

module.exports = router;
