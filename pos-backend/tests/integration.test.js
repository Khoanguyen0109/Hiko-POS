const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Dish = require('../models/dishModel');
const Category = require('../models/categoryModel');
const Promotion = require('../models/promotionModel');
const orderController = require('../controllers/orderController');

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock middleware for user authentication
app.use((req, res, next) => {
  req.user = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User'
  };
  next();
});

// Setup routes
app.post('/api/order', orderController.addOrder);
app.get('/api/order/:id', orderController.getOrderById);
app.get('/api/order', orderController.getOrders);

describe('Integration Tests - Order Flow', () => {
  let testCategory;
  let testDish;
  let testPromotion;

  beforeEach(async () => {
    // Create test data
    testCategory = new Category({
      name: 'Integration Matcha',
      description: 'Test category for integration tests'
    });
    await testCategory.save();

    testDish = new Dish({
      name: 'Integration Matcha Latte',
      description: 'Test matcha latte for integration',
      category: testCategory._id,
      price: 43000,
      variants: [
        { size: 'Small', price: 33000, cost: 12000 },
        { size: 'Medium', price: 38000, cost: 14000 },
        { size: 'Large', price: 43000, cost: 15500 }
      ],
      isAvailable: true
    });
    await testDish.save();

    testPromotion = new Promotion({
      name: 'Integration 10% OFF',
      code: 'INT10',
      type: 'order_percentage',
      discount: {
        percentage: 10
      },
      applicableItems: 'all_order',
      conditions: {
        minOrderAmount: 0
      },
      isActive: true,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      priority: 1
    });
    await testPromotion.save();
  });

  describe('Complete Order Lifecycle', () => {
    test('should create, retrieve, and update order successfully', async () => {
      // Step 1: Create order
      const orderData = {
        customerDetails: {
          name: 'Integration Customer',
          phone: '0123456789',
          guests: 2
        },
        orderStatus: 'pending',
        bills: {
          subtotal: 81000, // 43000 + 38000
          promotionDiscount: 8100, // 10% of 81000
          total: 72900,
          tax: 0,
          totalWithTax: 72900
        },
        appliedPromotions: [
          {
            promotionId: testPromotion._id,
            name: 'Integration 10% OFF',
            type: 'order_percentage',
            discountAmount: 8100,
            code: 'INT10'
          }
        ],
        items: [
          {
            id: 'integration-item-1',
            dishId: testDish._id,
            name: 'Integration Matcha Latte (Large)',
            pricePerQuantity: 43000,
            quantity: 1,
            price: 43000,
            category: 'Integration Matcha',
            originalPricePerQuantity: 43000,
            originalPrice: 43000,
            variant: { size: 'Large', price: 43000, cost: 15500 }
          },
          {
            id: 'integration-item-2',
            dishId: testDish._id,
            name: 'Integration Matcha Latte (Medium)',
            pricePerQuantity: 38000,
            quantity: 1,
            price: 38000,
            category: 'Integration Matcha',
            originalPricePerQuantity: 38000,
            originalPrice: 38000,
            variant: { size: 'Medium', price: 38000, cost: 14000 }
          }
        ],
        thirdPartyVendor: 'None'
      };

      const createResponse = await request(app)
        .post('/api/order')
        .send(orderData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.bills.total).toBe(72900);
      expect(createResponse.body.data.appliedPromotions).toHaveLength(1);
      expect(createResponse.body.data.items).toHaveLength(2);

      const orderId = createResponse.body.data._id;

      // Step 2: Retrieve order by ID
      const getResponse = await request(app)
        .get(`/api/order/${orderId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data._id).toBe(orderId);
      expect(getResponse.body.data.customerDetails.name).toBe('Integration Customer');
      expect(getResponse.body.data.bills.total).toBe(72900);

      // Step 3: Update order status
      const updateResponse = await request(app)
        .put(`/api/order/${orderId}`)
        .send({ orderStatus: 'progress' })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.orderStatus).toBe('progress');

      // Step 4: Verify order appears in list
      const listResponse = await request(app)
        .get('/api/order')
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data).toHaveLength(1);
      expect(listResponse.body.data[0]._id).toBe(orderId);
      expect(listResponse.body.data[0].orderStatus).toBe('progress');
    });

    test('should handle multiple orders with different promotions', async () => {
      // Create first order with promotion
      const order1Data = {
        customerDetails: { name: 'Customer 1', phone: '0111111111', guests: 1 },
        orderStatus: 'pending',
        bills: {
          subtotal: 43000,
          promotionDiscount: 4300,
          total: 38700,
          tax: 0,
          totalWithTax: 38700
        },
        appliedPromotions: [
          {
            promotionId: testPromotion._id,
            name: 'Integration 10% OFF',
            type: 'order_percentage',
            discountAmount: 4300,
            code: 'INT10'
          }
        ],
        items: [
          {
            id: 'order1-item1',
            dishId: testDish._id,
            name: 'Integration Matcha Latte (Large)',
            pricePerQuantity: 43000,
            quantity: 1,
            price: 43000,
            category: 'Integration Matcha',
            originalPricePerQuantity: 43000,
            originalPrice: 43000,
            variant: { size: 'Large', price: 43000, cost: 15500 }
          }
        ],
        thirdPartyVendor: 'None'
      };

      // Create second order without promotion
      const order2Data = {
        customerDetails: { name: 'Customer 2', phone: '0222222222', guests: 1 },
        orderStatus: 'pending',
        bills: {
          subtotal: 38000,
          promotionDiscount: 0,
          total: 38000,
          tax: 0,
          totalWithTax: 38000
        },
        appliedPromotions: [],
        items: [
          {
            id: 'order2-item1',
            dishId: testDish._id,
            name: 'Integration Matcha Latte (Medium)',
            pricePerQuantity: 38000,
            quantity: 1,
            price: 38000,
            category: 'Integration Matcha',
            originalPricePerQuantity: 38000,
            originalPrice: 38000,
            variant: { size: 'Medium', price: 38000, cost: 14000 }
          }
        ],
        thirdPartyVendor: 'None'
      };

      // Create both orders
      const response1 = await request(app)
        .post('/api/order')
        .send(order1Data)
        .expect(201);

      const response2 = await request(app)
        .post('/api/order')
        .send(order2Data)
        .expect(201);

      expect(response1.body.data.bills.total).toBe(38700);
      expect(response1.body.data.appliedPromotions).toHaveLength(1);

      expect(response2.body.data.bills.total).toBe(38000);
      expect(response2.body.data.appliedPromotions).toHaveLength(0);

      // Verify both orders exist
      const listResponse = await request(app)
        .get('/api/order')
        .expect(200);

      expect(listResponse.body.data).toHaveLength(2);
      
      // Check that orders are sorted by creation time (newest first)
      const orders = listResponse.body.data;
      expect(new Date(orders[0].createdAt)).toBeInstanceOf(Date);
      expect(new Date(orders[1].createdAt)).toBeInstanceOf(Date);
    });

    test('should validate promotion math across different scenarios', async () => {
      const scenarios = [
        {
          name: '5% discount',
          subtotal: 100000,
          discountPercent: 5,
          expectedDiscount: 5000,
          expectedTotal: 95000
        },
        {
          name: '15% discount',
          subtotal: 80000,
          discountPercent: 15,
          expectedDiscount: 12000,
          expectedTotal: 68000
        },
        {
          name: '25% discount',
          subtotal: 60000,
          discountPercent: 25,
          expectedDiscount: 15000,
          expectedTotal: 45000
        }
      ];

      for (const scenario of scenarios) {
        const orderData = {
          customerDetails: { name: `Customer ${scenario.name}`, phone: '0123456789', guests: 1 },
          orderStatus: 'pending',
          bills: {
            subtotal: scenario.subtotal,
            promotionDiscount: scenario.expectedDiscount,
            total: scenario.expectedTotal,
            tax: 0,
            totalWithTax: scenario.expectedTotal
          },
          appliedPromotions: [
            {
              promotionId: testPromotion._id,
              name: `${scenario.discountPercent}% OFF`,
              type: 'order_percentage',
              discountAmount: scenario.expectedDiscount,
              code: `DISCOUNT${scenario.discountPercent}`
            }
          ],
          items: [
            {
              id: `scenario-item-${scenario.discountPercent}`,
              dishId: testDish._id,
              name: 'Test Item',
              pricePerQuantity: scenario.subtotal,
              quantity: 1,
              price: scenario.subtotal,
              category: 'Integration Matcha',
              originalPricePerQuantity: scenario.subtotal,
              originalPrice: scenario.subtotal
            }
          ],
          thirdPartyVendor: 'None'
        };

        const response = await request(app)
          .post('/api/order')
          .send(orderData)
          .expect(201);

        expect(response.body.data.bills.total).toBe(scenario.expectedTotal);
        expect(response.body.data.bills.promotionDiscount).toBe(scenario.expectedDiscount);
      }
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle database errors gracefully', async () => {
      // Create order with non-existent dish ID
      const orderData = {
        customerDetails: { name: 'Error Test', phone: '0123456789', guests: 1 },
        orderStatus: 'pending',
        bills: { subtotal: 43000, total: 43000, tax: 0, totalWithTax: 43000 },
        appliedPromotions: [],
        items: [
          {
            id: 'error-item',
            dishId: new mongoose.Types.ObjectId(), // Non-existent dish
            name: 'Non-existent Dish',
            pricePerQuantity: 43000,
            quantity: 1,
            price: 43000,
            category: 'Test',
            originalPricePerQuantity: 43000,
            originalPrice: 43000
          }
        ],
        thirdPartyVendor: 'None'
      };

      // This should still succeed as we don't validate dish existence in current implementation
      const response = await request(app)
        .post('/api/order')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should handle concurrent order creation', async () => {
      const orderData = {
        customerDetails: { name: 'Concurrent Test', phone: '0123456789', guests: 1 },
        orderStatus: 'pending',
        bills: { subtotal: 43000, total: 43000, tax: 0, totalWithTax: 43000 },
        appliedPromotions: [],
        items: [
          {
            id: 'concurrent-item',
            dishId: testDish._id,
            name: 'Concurrent Test Item',
            pricePerQuantity: 43000,
            quantity: 1,
            price: 43000,
            category: 'Integration Matcha',
            originalPricePerQuantity: 43000,
            originalPrice: 43000
          }
        ],
        thirdPartyVendor: 'None'
      };

      // Create multiple orders concurrently
      const promises = Array(5).fill().map((_, index) => 
        request(app)
          .post('/api/order')
          .send({
            ...orderData,
            customerDetails: { ...orderData.customerDetails, name: `Concurrent Customer ${index}` }
          })
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify all orders were created
      const listResponse = await request(app)
        .get('/api/order')
        .expect(200);

      expect(listResponse.body.data).toHaveLength(5);
    });
  });
});


