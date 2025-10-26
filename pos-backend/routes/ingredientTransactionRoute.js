const express = require("express");
const {
    importIngredient,
    exportIngredient,
    adjustIngredient,
    getTransactions,
    getTransactionById,
    deleteTransaction
} = require("../controllers/ingredientTransactionController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Transaction operations
router.post("/import", isVerifiedUser, importIngredient);
router.post("/export", isVerifiedUser, exportIngredient);
router.post("/adjust", isVerifiedUser, adjustIngredient);

// Query transactions
router.get("/", isVerifiedUser, getTransactions);
router.get("/:id", isVerifiedUser, getTransactionById);

// Delete transaction
router.delete("/:id", isVerifiedUser, deleteTransaction);

module.exports = router;

