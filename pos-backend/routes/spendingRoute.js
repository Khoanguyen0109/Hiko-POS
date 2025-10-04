const express = require("express");
const {
    // Spending CRUD
    addSpending,
    getSpendingById,
    getSpending,
    updateSpending,
    deleteSpending,
    
    // Category operations
    addSpendingCategory,
    getSpendingCategories,
    updateSpendingCategory,
    deleteSpendingCategory,
    
    // Vendor operations
    addVendor,
    getVendors,
    getVendorById,
    updateVendor,
    deleteVendor,
    
    // Analytics
    getSpendingAnalytics,
    getSpendingDashboard
} = require("../controllers/spendingController");

const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// ==================== SPENDING ROUTES ====================

/**
 * @route   POST /api/spending
 * @desc    Create a new spending record
 * @access  Private
 * @body    {
 *   title: string (required),
 *   description?: string,
 *   amount: number (required),
 *   currency?: string,
 *   category: ObjectId (required),
 *   subcategory?: string,
 *   vendor?: ObjectId,
 *   vendorName?: string,
 *   spendingDate?: Date,
 *   dueDate?: Date,
 *   paymentStatus?: string,
 *   paymentMethod?: string,
 *   paymentDate?: Date,
 *   paymentReference?: string,
 *   receiptNumber?: string,
 *   invoiceNumber?: string,
 *   taxAmount?: number,
 *   taxRate?: number,
 *   isDeductible?: boolean,
 *   isRecurring?: boolean,
 *   recurringPattern?: object,
 *   approvalStatus?: string,
 *   attachments?: array,
 *   tags?: array,
 *   notes?: string
 * }
 */
router.post("/", isVerifiedUser, addSpending);

/**
 * @route   GET /api/spending
 * @desc    Get all spending records with filtering and pagination
 * @access  Private
 * @query   {
 *   startDate?: string,
 *   endDate?: string,
 *   category?: string,
 *   vendor?: string,
 *   paymentStatus?: string,
 *   approvalStatus?: string,
 *   status?: string,
 *   tags?: string,
 *   isRecurring?: boolean,
 *   page?: number,
 *   limit?: number,
 *   sortBy?: string,
 *   sortOrder?: string
 * }
 */
router.get("/", isVerifiedUser, getSpending);

// ==================== ANALYTICS ROUTES ====================
// Note: Analytics routes must come before parameterized routes

/**
 * @route   GET /api/spending/analytics/dashboard
 * @desc    Get spending dashboard data
 * @access  Private
 */
router.get("/analytics/dashboard", isVerifiedUser, getSpendingDashboard);

/**
 * @route   GET /api/spending/analytics/reports
 * @desc    Get detailed spending analytics
 * @access  Private
 * @query   {
 *   startDate?: string,
 *   endDate?: string,
 *   period?: string
 * }
 */
router.get("/analytics/reports", isVerifiedUser, getSpendingAnalytics);

// ==================== CATEGORY ROUTES ====================
// Note: Category routes must come before parameterized routes

/**
 * @route   POST /api/spending/categories
 * @desc    Create a new spending category
 * @access  Private
 * @body    {
 *   name: string (required),
 *   description?: string,
 *   color?: string
 * }
 */
router.post("/categories", isVerifiedUser, addSpendingCategory);

/**
 * @route   GET /api/spending/categories
 * @desc    Get all spending categories
 * @access  Private
 * @query   {
 *   isActive?: boolean
 * }
 */
router.get("/categories", isVerifiedUser, getSpendingCategories);

/**
 * @route   PUT /api/spending/categories/:id
 * @desc    Update spending category
 * @access  Private
 */
router.put("/categories/:id", isVerifiedUser, updateSpendingCategory);

/**
 * @route   DELETE /api/spending/categories/:id
 * @desc    Delete spending category
 * @access  Private
 */
router.delete("/categories/:id", isVerifiedUser, deleteSpendingCategory);

// ==================== VENDOR ROUTES ====================
// Note: Vendor routes must come before parameterized routes

/**
 * @route   POST /api/spending/vendors
 * @desc    Create a new vendor
 * @access  Private
 * @body    {
 *   name: string (required),
 *   contactPerson?: string,
 *   phone?: string,
 *   email?: string,
 *   address?: object,
 *   taxId?: string,
 *   paymentTerms?: string,
 *   customPaymentTerms?: string,
 *   notes?: string
 * }
 */
router.post("/vendors", isVerifiedUser, addVendor);

/**
 * @route   GET /api/spending/vendors
 * @desc    Get all vendors
 * @access  Private
 * @query   {
 *   isActive?: boolean,
 *   search?: string
 * }
 */
router.get("/vendors", isVerifiedUser, getVendors);

/**
 * @route   GET /api/spending/vendors/:id
 * @desc    Get vendor by ID
 * @access  Private
 */
router.get("/vendors/:id", isVerifiedUser, getVendorById);

/**
 * @route   PUT /api/spending/vendors/:id
 * @desc    Update vendor
 * @access  Private
 */
router.put("/vendors/:id", isVerifiedUser, updateVendor);

/**
 * @route   DELETE /api/spending/vendors/:id
 * @desc    Delete vendor
 * @access  Private
 */
router.delete("/vendors/:id", isVerifiedUser, deleteVendor);

/**
 * @route   GET /api/spending/:id
 * @desc    Get spending record by ID
 * @access  Private
 */
router.get("/:id", isVerifiedUser, getSpendingById);

/**
 * @route   PUT /api/spending/:id
 * @desc    Update spending record
 * @access  Private
 */
router.put("/:id", isVerifiedUser, updateSpending);

/**
 * @route   DELETE /api/spending/:id
 * @desc    Delete spending record
 * @access  Private
 */
router.delete("/:id", isVerifiedUser, deleteSpending);

module.exports = router;
