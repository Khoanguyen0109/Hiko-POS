import express from "express";
const router = express.Router();
import { createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  getPromotionAnalytics,
  validateCouponCode } from "../controllers/promotionController.js";
import { isVerifiedUser } from "../middlewares/tokenVerification.js";
import { storeContext } from "../middlewares/storeContext.js";

// Public routes (for coupon validation)
router.post('/validate-coupon', validateCouponCode);

// Protected routes (require authentication)
router.use(isVerifiedUser);
router.use(storeContext);

// CRUD operations
router.post('/', createPromotion);
router.get('/', getPromotions);
router.get('/analytics', getPromotionAnalytics);
router.get('/:id', getPromotionById);
router.put('/:id', updatePromotion);
router.delete('/:id', deletePromotion);

// Status management
router.patch('/:id/toggle-status', togglePromotionStatus);

export default router;