const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Dish = require('../models/dishModel');
const Category = require('../models/categoryModel');
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
app.put('/api/order/:id', orderController.updateOrder);

describe('Order Controller', () => {
  let testCategory;
  let testDish;

  beforeEach(async () => {
    // Create test category
    testCategory = new Category({
      name: 'Test Matcha',
      description: 'Test category for matcha drinks'
    });
    await testCategory.save();

    // Create test dish
    testDish = new Dish({
      name: 'Test Matcha Latte',
      description: 'Test matcha latte drink',
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
  });

  describe('POST /api/order - Create Order', () => {
    describe('Orders without promotions', () => {
      test('should create order successfully without promotions', async () => {
        const orderData = {
          customerDetails: {
            name: 'John Doe',
            phone: '0123456789',
            guests: 2
          },
          orderStatus: 'pending',
          bills: {
            subtotal: 43000,
            promotionDiscount: 0,
            total: 43000,
            tax: 0,
            totalWithTax: 43000
          },
          appliedPromotions: [],
          items: [
            {
              id: 'test-item-1',
              dishId: testDish._id,
              name: 'Test Matcha Latte (Large)',
              pricePerQuantity: 43000,
              quantity: 1,
              price: 43000,
              category: 'Test Matcha',
              originalPricePerQuantity: 43000,
              originalPrice: 43000,
              variant: {
                size: 'Large',
                price: 43000,
                cost: 15500
              },
              toppings: null,
              note: null
            }
          ],
          thirdPartyVendor: 'None'
        };

        const response = await request(app)
          .post('/api/order')
          .send(orderData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Order created successfully!');
        expect(response.body.data.bills.total).toBe(43000);
        expect(response.body.data.bills.promotionDiscount).toBe(0);
        expect(response.body.data.appliedPromotions).toHaveLength(0);
        expect(response.body.data.items).toHaveLength(1);
        expect(response.body.data.items[0].name).toBe('Test Matcha Latte (Large)');
      });

      test('should create order with multiple items without promotions', async () => {
        const orderData = {
          customerDetails: {
            name: 'Jane Smith',
            phone: '0987654321',
            guests: 3
          },
          orderStatus: 'pending',
          bills: {
            subtotal: 119000, // 43000 + 38000 + 38000
            promotionDiscount: 0,
            total: 119000,
            tax: 0,
            totalWithTax: 119000
          },
          appliedPromotions: [],
          items: [
            {
              id: 'test-item-1',
              dishId: testDish._id,
              name: 'Test Matcha Latte (Large)',
              pricePerQuantity: 43000,
              quantity: 1,
              price: 43000,
              category: 'Test Matcha',
              originalPricePerQuantity: 43000,
              originalPrice: 43000,
              variant: { size: 'Large', price: 43000, cost: 15500 }
            },
            {
              id: 'test-item-2',
              dishId: testDish._id,
              name: 'Test Matcha Latte (Medium)',
              pricePerQuantity: 38000,
              quantity: 2,
              price: 76000,
              category: 'Test Matcha',
              originalPricePerQuantity: 38000,
              originalPrice: 76000,
              variant: { size: 'Medium', price: 38000, cost: 14000 }
            }
          ],
          thirdPartyVendor: 'None'
        };

        const response = await request(app)
          .post('/api/order')
          .send(orderData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bills.total).toBe(119000);
        expect(response.body.data.items).toHaveLength(2);
      });
    });

    describe('Orders with order-level promotions', () => {
      test('should create order with 10% percentage promotion', async () => {
        const orderData = {
          customerDetails: {
            name: 'Discount Customer',
            phone: '0555666777',
            guests: 1
          },
          orderStatus: 'pending',
          bills: {
            subtotal: 38000,
            promotionDiscount: 3800,
            total: 34200,
            tax: 0,
            totalWithTax: 34200
          },
          appliedPromotions: [
            {
              promotionId: new mongoose.Types.ObjectId(),
              name: '10% OFF',
              type: 'order_percentage',
              discountAmount: 3800,
              code: 'DISCOUNT10'
            }
          ],
          items: [
            {
              id: 'test-item-1',
              dishId: testDish._id,
              name: 'Test Matcha Latte (Medium)',
              pricePerQuantity: 38000,
              quantity: 1,
              price: 38000,
              category: 'Test Matcha',
              originalPricePerQuantity: 38000,
              originalPrice: 38000,
              variant: { size: 'Medium', price: 38000, cost: 14000 }
            }
          ],
          thirdPartyVendor: 'None'
        };

        const response = await request(app)
          .post('/api/order')
          .send(orderData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bills.subtotal).toBe(38000);
        expect(response.body.data.bills.promotionDiscount).toBe(3800);
        expect(response.body.data.bills.total).toBe(34200);
        expect(response.body.data.appliedPromotions).toHaveLength(1);
        expect(response.body.data.appliedPromotions[0].name).toBe('10% OFF');
        expect(response.body.data.appliedPromotions[0].type).toBe('order_percentage');
      });

      test('should create order with fixed amount promotion', async () => {
        const orderData = {
          customerDetails: {
            name: 'Fixed Discount Customer',
            phone: '0444555666',
            guests: 1
          },
          orderStatus: 'pending',
          bills: {
            subtotal: 43000,
            promotionDiscount: 5000,
            total: 38000,
            tax: 0,
            totalWithTax: 38000
          },
          appliedPromotions: [
            {
              promotionId: new mongoose.Types.ObjectId(),
              name: '5K OFF',
              type: 'order_fixed',
              discountAmount: 5000,
              code: 'SAVE5K'
            }
          ],
          items: [
            {
              id: 'test-item-1',
              dishId: testDish._id,
              name: 'Test Matcha Latte (Large)',
              pricePerQuantity: 43000,
              quantity: 1,
              price: 43000,
              category: 'Test Matcha',
              originalPricePerQuantity: 43000,
              originalPrice: 43000,
              variant: { size: 'Large', price: 43000, cost: 15500 }
            }
          ],
          thirdPartyVendor: 'None'
        };

        const response = await request(app)
          .post('/api/order')
          .send(orderData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bills.subtotal).toBe(43000);
        expect(response.body.data.bills.promotionDiscount).toBe(5000);
        expect(response.body.data.bills.total).toBe(38000);
        expect(response.body.data.appliedPromotions[0].type).toBe('order_fixed');
      });

      test('should create order with multiple items and percentage promotion', async () => {
        const orderData = {
          customerDetails: {
            name: 'Multi Item Customer',
            phone: '0111222333',
            guests: 4
          },
          orderStatus: 'pending',
          bills: {
            subtotal: 119000, // 43000 + 76000
            promotionDiscount: 11900, // 10% of 119000
            total: 107100,
            tax: 0,
            totalWithTax: 107100
          },
          appliedPromotions: [
            {
              promotionId: new mongoose.Types.ObjectId(),
              name: '10% OFF',
              type: 'order_percentage',
              discountAmount: 11900,
              code: 'DISCOUNT10'
            }
          ],
          items: [
            {
              id: 'test-item-1',
              dishId: testDish._id,
              name: 'Test Matcha Latte (Large)',
              pricePerQuantity: 43000,
              quantity: 1,
              price: 43000,
              category: 'Test Matcha',
              originalPricePerQuantity: 43000,
              originalPrice: 43000,
              variant: { size: 'Large', price: 43000, cost: 15500 }
            },
            {
              id: 'test-item-2',
              dishId: testDish._id,
              name: 'Test Matcha Latte (Medium)',
              pricePerQuantity: 38000,
              quantity: 2,
              price: 76000,
              category: 'Test Matcha',
              originalPricePerQuantity: 38000,
              originalPrice: 76000,
              variant: { size: 'Medium', price: 38000, cost: 14000 }
            }
          ],
          thirdPartyVendor: 'None'
        };

        const response = await request(app)
          .post('/api/order')
          .send(orderData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bills.total).toBe(107100);
        expect(response.body.data.appliedPromotions[0].discountAmount).toBe(11900);
      });
    });

    describe('Orders with item-level promotions', () => {
      test('should create order with Happy Hour promotion', async () => {
        const orderData = {
          customerDetails: {
            name: 'Happy Hour Customer',
            phone: '0777888999',
            guests: 1
          },
          orderStatus: 'pending',
          bills: {
            subtotal: 43000,
            promotionDiscount: 8000,
            total: 35000,
            tax: 0,
            totalWithTax: 35000
          },
          appliedPromotions: [
            {
              promotionId: new mongoose.Types.ObjectId(),
              name: 'Happy Hour',
              type: 'happy_hour',
              discountAmount: 8000,
              code: 'HAPPYHOUR'
            }
          ],
          items: [
            {
              id: 'test-item-1',
              dishId: testDish._id,
              name: 'Test Matcha Latte (Large)',
              pricePerQuantity: 35000, // Discounted price
              quantity: 1,
              price: 35000,
              category: 'Test Matcha',
              originalPricePerQuantity: 43000,
              originalPrice: 43000,
              isHappyHourItem: true,
              happyHourDiscount: 8000,
              variant: { size: 'Large', price: 43000, cost: 15500 },
              promotionsApplied: [
                {
                  promotionId: new mongoose.Types.ObjectId(),
                  promotionName: 'Happy Hour',
                  promotionType: 'happy_hour',
                  discountAmount: 8000,
                  appliedAt: new Date()
                }
              ]
            }
          ],
          thirdPartyVendor: 'None'
        };

        const response = await request(app)
          .post('/api/order')
          .send(orderData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bills.total).toBe(35000);
        expect(response.body.data.items[0].isHappyHourItem).toBe(true);
        expect(response.body.data.items[0].happyHourDiscount).toBe(8000);
      });
    });

    describe('Validation errors', () => {
      test('should fail with invalid bill total', async () => {
        const orderData = {
          customerDetails: {
            name: 'Invalid Customer',
            phone: '0000000000',
            guests: 1
          },
          orderStatus: 'pending',
          bills: {
            subtotal: 38000,
            promotionDiscount: 3800,
            total: 30000, // Wrong total (should be 34200)
            tax: 0,
            totalWithTax: 30000
          },
          appliedPromotions: [
            {
              promotionId: new mongoose.Types.ObjectId(),
              name: '10% OFF',
              type: 'order_percentage',
              discountAmount: 3800,
              code: 'DISCOUNT10'
            }
          ],
          items: [
            {
              id: 'test-item-1',
              dishId: testDish._id,
              name: 'Test Matcha Latte (Medium)',
              pricePerQuantity: 38000,
              quantity: 1,
              price: 38000,
              category: 'Test Matcha',
              originalPricePerQuantity: 38000,
              originalPrice: 38000,
              variant: { size: 'Medium', price: 38000, cost: 14000 }
            }
          ],
          thirdPartyVendor: 'None'
        };

        const response = await request(app)
          .post('/api/order')
          .send(orderData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Bill total');
        expect(response.body.message).toContain('does not match calculated total');
      });

      test('should fail with missing required fields', async () => {
        const orderData = {
          customerDetails: {
            name: 'Test Customer'
          },
          bills: {
            total: 43000
          },
          items: [] // Empty items array
        };

        const response = await request(app)
          .post('/api/order')
          .send(orderData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Order must contain at least one item');
      });

      test('should fail with invalid dish ID', async () => {
        const orderData = {
          customerDetails: {
            name: 'Test Customer',
            phone: '0123456789',
            guests: 1
          },
          orderStatus: 'pending',
          bills: {
            subtotal: 43000,
            promotionDiscount: 0,
            total: 43000,
            tax: 0,
            totalWithTax: 43000
          },
          appliedPromotions: [],
          items: [
            {
              id: 'test-item-1',
              dishId: 'invalid-dish-id', // Invalid ObjectId
              name: 'Test Matcha Latte',
              pricePerQuantity: 43000,
              quantity: 1,
              price: 43000,
              category: 'Test Matcha'
            }
          ],
          thirdPartyVendor: 'None'
        };

        const response = await request(app)
          .post('/api/order')
          .send(orderData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid dishId');
      });
    });
  });

  describe('GET /api/order/:id - Get Order by ID', () => {
    test('should get order by ID successfully', async () => {
      // First create an order
      const order = new Order({
        customerDetails: {
          name: 'Test Customer',
          phone: '0123456789',
          guests: 1
        },
        orderStatus: 'pending',
        bills: {
          subtotal: 43000,
          promotionDiscount: 0,
          total: 43000,
          tax: 0,
          totalWithTax: 43000
        },
        appliedPromotions: [],
        items: [
          {
            dishId: testDish._id,
            name: 'Test Matcha Latte',
            pricePerQuantity: 43000,
            quantity: 1,
            price: 43000,
            originalPricePerQuantity: 43000,
            originalPrice: 43000,
            category: 'Test Matcha'
          }
        ],
        thirdPartyVendor: 'None'
      });
      await order.save();

      const response = await request(app)
        .get(`/api/order/${order._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(order._id.toString());
      expect(response.body.data.customerDetails.name).toBe('Test Customer');
    });

    test('should return 404 for non-existent order', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/order/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order not found!');
    });
  });

  describe('PUT /api/order/:id - Update Order', () => {
    test('should update order status successfully', async () => {
      // Create an order first
      const order = new Order({
        customerDetails: { name: 'Test Customer' },
        orderStatus: 'pending',
        bills: { subtotal: 43000, total: 43000, totalWithTax: 43000 },
        items: [{
          dishId: testDish._id,
          name: 'Test Matcha Latte',
          pricePerQuantity: 43000,
          quantity: 1,
          price: 43000,
          originalPricePerQuantity: 43000,
          originalPrice: 43000,
          category: 'Test Matcha'
        }],
        thirdPartyVendor: 'None'
      });
      await order.save();

      const response = await request(app)
        .put(`/api/order/${order._id}`)
        .send({ orderStatus: 'progress' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orderStatus).toBe('progress');
    });

    test('should update payment method successfully', async () => {
      const order = new Order({
        customerDetails: { name: 'Test Customer' },
        orderStatus: 'pending',
        bills: { subtotal: 43000, total: 43000, totalWithTax: 43000 },
        items: [{
          dishId: testDish._id,
          name: 'Test Matcha Latte',
          pricePerQuantity: 43000,
          quantity: 1,
          price: 43000,
          originalPricePerQuantity: 43000,
          originalPrice: 43000,
          category: 'Test Matcha'
        }],
        thirdPartyVendor: 'None'
      });
      await order.save();

      const response = await request(app)
        .put(`/api/order/${order._id}`)
        .send({ paymentMethod: 'Card' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentMethod).toBe('Card');
    });
  });
});


