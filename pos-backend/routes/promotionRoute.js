const express = require('express');
const router = express.Router();
const {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  getPromotionAnalytics,
  validateCouponCode
} = require('../controllers/promotionController');
const { isVerifiedUser } = require('../middlewares/tokenVerification');
const { storeContext } = require('../middlewares/storeContext');

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

module.exports = router;

