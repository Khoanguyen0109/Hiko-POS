const PromotionService = require('../services/promotionService');
const Promotion = require('../models/promotionModel');
const Category = require('../models/categoryModel');
const mongoose = require('mongoose');

describe('PromotionService', () => {
  let testCategory;
  let testPromotion;

  beforeEach(async () => {
    // Create test category
    testCategory = new Category({
      name: 'Test Matcha',
      description: 'Test category for matcha drinks'
    });
    await testCategory.save();

    // Create test Happy Hour promotion
    testPromotion = new Promotion({
      name: 'Test Happy Hour',
      code: 'TESTHAPPYHOUR',
      type: 'happy_hour',
      discountType: 'uniform_price',
      discount: {
        uniformPrice: 35000
      },
      applicableItems: 'categories',
      categories: [testCategory._id],
      conditions: {
        minOrderAmount: 0,
        timeSlots: [
          {
            start: '08:00',
            end: '10:00'
          }
        ],
        daysOfWeek: []
      },
      isActive: true,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      priority: 1
    });
    await testPromotion.save();
  });

  describe('Time validation methods', () => {
    test('should correctly validate time slots', () => {
      // Mock current time to be 9:00 AM (within Happy Hour)
      const mockDate = new Date();
      mockDate.setHours(9, 0, 0, 0);
      jest.spyOn(PromotionService, 'getCurrentVietnamTime').mockReturnValue(mockDate);

      const timeSlot = { start: '08:00', end: '10:00' };
      const result = PromotionService.isCurrentTimeInSlot(timeSlot);
      
      expect(result).toBe(true);

      // Restore original method
      PromotionService.getCurrentVietnamTime.mockRestore();
    });

    test('should reject time outside slot', () => {
      // Mock current time to be 3:00 PM (outside Happy Hour)
      const mockDate = new Date();
      mockDate.setHours(15, 0, 0, 0);
      jest.spyOn(PromotionService, 'getCurrentVietnamTime').mockReturnValue(mockDate);

      const timeSlot = { start: '08:00', end: '10:00' };
      const result = PromotionService.isCurrentTimeInSlot(timeSlot);
      
      expect(result).toBe(false);

      PromotionService.getCurrentVietnamTime.mockRestore();
    });

    test('should handle time slots crossing midnight', () => {
      // Mock current time to be 1:00 AM
      const mockDate = new Date();
      mockDate.setHours(1, 0, 0, 0);
      jest.spyOn(PromotionService, 'getCurrentVietnamTime').mockReturnValue(mockDate);

      const timeSlot = { start: '23:00', end: '02:00' }; // 11 PM to 2 AM
      const result = PromotionService.isCurrentTimeInSlot(timeSlot);
      
      expect(result).toBe(true);

      PromotionService.getCurrentVietnamTime.mockRestore();
    });

    test('should validate days of week correctly', () => {
      // Mock current time to be Monday
      const mockDate = new Date('2025-09-29'); // This is a Monday
      jest.spyOn(PromotionService, 'getCurrentVietnamTime').mockReturnValue(mockDate);

      // Test with Monday included
      let result = PromotionService.isCurrentDayValid(['monday', 'tuesday']);
      expect(result).toBe(true);

      // Test with Monday not included
      result = PromotionService.isCurrentDayValid(['wednesday', 'thursday']);
      expect(result).toBe(false);

      // Test with empty array (no restrictions)
      result = PromotionService.isCurrentDayValid([]);
      expect(result).toBe(true);

      PromotionService.getCurrentVietnamTime.mockRestore();
    });
  });

  describe('Item eligibility', () => {
    test('should check item eligibility for category-based promotion', () => {
      const item = {
        dishId: new mongoose.Types.ObjectId(),
        category: 'Test Matcha'
      };

      const promotion = {
        applicableItems: 'categories',
        categories: [{ name: 'Test Matcha' }]
      };

      const result = PromotionService.isItemEligibleForPromotion(item, promotion);
      expect(result).toBe(true);
    });

    test('should reject item not in promotion category', () => {
      const item = {
        dishId: new mongoose.Types.ObjectId(),
        category: 'Coffee'
      };

      const promotion = {
        applicableItems: 'categories',
        categories: [{ name: 'Test Matcha' }]
      };

      const result = PromotionService.isItemEligibleForPromotion(item, promotion);
      expect(result).toBe(false);
    });

    test('should check item eligibility for all-order promotion', () => {
      const item = {
        dishId: new mongoose.Types.ObjectId(),
        category: 'Any Category'
      };

      const promotion = {
        applicableItems: 'all_order'
      };

      const result = PromotionService.isItemEligibleForPromotion(item, promotion);
      expect(result).toBe(true);
    });

    test('should check item eligibility for specific dishes', () => {
      const dishId = new mongoose.Types.ObjectId();
      const item = {
        dishId: dishId,
        category: 'Test Matcha'
      };

      const promotion = {
        applicableItems: 'specific_dishes',
        specificDishes: [dishId]
      };

      const result = PromotionService.isItemEligibleForPromotion(item, promotion);
      expect(result).toBe(true);
    });
  });

  describe('Happy Hour discount calculation', () => {
    test('should calculate uniform price discount correctly', () => {
      const item = {
        dishId: new mongoose.Types.ObjectId(),
        name: 'Test Matcha Latte',
        pricePerQuantity: 43000,
        quantity: 1,
        price: 43000,
        originalPricePerQuantity: 43000,
        originalPrice: 43000,
        category: 'Test Matcha'
      };

      const promotion = {
        discountType: 'uniform_price',
        discount: {
          uniformPrice: 35000
        },
        applicableItems: 'categories',
        categories: [{ name: 'Test Matcha' }]
      };

      const discount = PromotionService.calculateItemHappyHourDiscount(item, promotion);
      expect(discount).toBe(8000); // 43000 - 35000
    });

    test('should calculate percentage discount correctly', () => {
      const item = {
        dishId: new mongoose.Types.ObjectId(),
        name: 'Test Matcha Latte',
        pricePerQuantity: 40000,
        quantity: 1,
        price: 40000,
        originalPricePerQuantity: 40000,
        originalPrice: 40000,
        category: 'Test Matcha'
      };

      const promotion = {
        discountType: 'percentage',
        discount: {
          percentage: 20
        },
        applicableItems: 'categories',
        categories: [{ name: 'Test Matcha' }]
      };

      const discount = PromotionService.calculateItemHappyHourDiscount(item, promotion);
      expect(discount).toBe(8000); // 20% of 40000
    });

    test('should calculate fixed amount discount correctly', () => {
      const item = {
        dishId: new mongoose.Types.ObjectId(),
        name: 'Test Matcha Latte',
        pricePerQuantity: 43000,
        quantity: 1,
        price: 43000,
        originalPricePerQuantity: 43000,
        originalPrice: 43000,
        category: 'Test Matcha'
      };

      const promotion = {
        discountType: 'fixed_amount',
        discount: {
          fixedAmount: 5000
        },
        applicableItems: 'categories',
        categories: [{ name: 'Test Matcha' }]
      };

      const discount = PromotionService.calculateItemHappyHourDiscount(item, promotion);
      expect(discount).toBe(5000);
    });

    test('should return 0 discount for ineligible items', () => {
      const item = {
        dishId: new mongoose.Types.ObjectId(),
        name: 'Coffee',
        pricePerQuantity: 30000,
        quantity: 1,
        price: 30000,
        category: 'Coffee'
      };

      const promotion = {
        discountType: 'uniform_price',
        discount: {
          uniformPrice: 35000
        },
        applicableItems: 'categories',
        categories: [{ name: 'Test Matcha' }]
      };

      const discount = PromotionService.calculateItemHappyHourDiscount(item, promotion);
      expect(discount).toBe(0);
    });
  });

  describe('Find active promotions', () => {
    test('should find active promotions within time slot', async () => {
      // Mock current time to be within Happy Hour (9:00 AM)
      const mockDate = new Date();
      mockDate.setHours(9, 0, 0, 0);
      jest.spyOn(PromotionService, 'getCurrentVietnamTime').mockReturnValue(mockDate);

      const activePromotions = await PromotionService.findActiveHappyHourPromotions();
      
      expect(activePromotions).toHaveLength(1);
      expect(activePromotions[0].name).toBe('Test Happy Hour');

      PromotionService.getCurrentVietnamTime.mockRestore();
    });

    test('should not find promotions outside time slot', async () => {
      // Mock current time to be outside Happy Hour (3:00 PM)
      const mockDate = new Date();
      mockDate.setHours(15, 0, 0, 0);
      jest.spyOn(PromotionService, 'getCurrentVietnamTime').mockReturnValue(mockDate);

      const activePromotions = await PromotionService.findActiveHappyHourPromotions();
      
      expect(activePromotions).toHaveLength(0);

      PromotionService.getCurrentVietnamTime.mockRestore();
    });
  });

  describe('Apply Happy Hour promotions', () => {
    test('should apply promotions to eligible items within time slot', async () => {
      // Mock current time to be within Happy Hour
      const mockDate = new Date();
      mockDate.setHours(9, 0, 0, 0);
      jest.spyOn(PromotionService, 'getCurrentVietnamTime').mockReturnValue(mockDate);

      const orderItems = [
        {
          dishId: new mongoose.Types.ObjectId(),
          name: 'Test Matcha Latte',
          pricePerQuantity: 43000,
          quantity: 1,
          price: 43000,
          category: 'Test Matcha',
          originalPricePerQuantity: 43000,
          originalPrice: 43000
        }
      ];

      const result = await PromotionService.applyHappyHourPromotions(orderItems);
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].isHappyHourItem).toBe(true);
      expect(result.items[0].price).toBe(35000); // Uniform price
      expect(result.items[0].happyHourDiscount).toBe(8000);
      expect(result.appliedPromotions).toHaveLength(1);
      expect(result.totalDiscount).toBe(8000);

      PromotionService.getCurrentVietnamTime.mockRestore();
    });

    test('should not apply promotions outside time slot', async () => {
      // Mock current time to be outside Happy Hour
      const mockDate = new Date();
      mockDate.setHours(15, 0, 0, 0);
      jest.spyOn(PromotionService, 'getCurrentVietnamTime').mockReturnValue(mockDate);

      const orderItems = [
        {
          dishId: new mongoose.Types.ObjectId(),
          name: 'Test Matcha Latte',
          pricePerQuantity: 43000,
          quantity: 1,
          price: 43000,
          category: 'Test Matcha',
          originalPricePerQuantity: 43000,
          originalPrice: 43000
        }
      ];

      const result = await PromotionService.applyHappyHourPromotions(orderItems);
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].isHappyHourItem).toBe(false);
      expect(result.items[0].price).toBe(43000); // Original price
      expect(result.items[0].happyHourDiscount).toBe(0);
      expect(result.appliedPromotions).toHaveLength(0);
      expect(result.totalDiscount).toBe(0);

      PromotionService.getCurrentVietnamTime.mockRestore();
    });
  });
});


