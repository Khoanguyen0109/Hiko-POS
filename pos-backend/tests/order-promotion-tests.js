const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const ORDER_ENDPOINT = `${BASE_URL}/order`;

// Test helper function
async function testOrderCreation(testName, payload, expectedResult = 'success') {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log('📤 Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await axios.post(ORDER_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if needed
        // 'Authorization': 'Bearer your-jwt-token'
      }
    });
    
    if (expectedResult === 'success') {
      console.log('✅ SUCCESS:', response.data.message);
      console.log('📊 Order ID:', response.data.data._id);
      console.log('💰 Final Total:', response.data.data.bills.total);
      if (response.data.data.appliedPromotions?.length > 0) {
        console.log('🎯 Applied Promotions:', response.data.data.appliedPromotions.map(p => p.name));
      }
    } else {
      console.log('❌ UNEXPECTED SUCCESS - Expected failure but got success');
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    if (expectedResult === 'error') {
      console.log('✅ EXPECTED ERROR:', error.response?.data?.message || error.message);
    } else {
      console.log('❌ UNEXPECTED ERROR:', error.response?.data?.message || error.message);
    }
    
    return { success: false, error: error.response?.data || error.message };
  }
}

// Test Cases
async function runAllTests() {
  console.log('🚀 Starting Order Promotion Test Suite');
  console.log('=' .repeat(60));

  // Test Case 1: Order without any promotions
  await testOrderCreation(
    'Order without promotions',
    {
      customerDetails: {
        name: "John Doe",
        phone: "0123456789",
        guests: 2
      },
      orderStatus: "pending",
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
          id: "test-item-1",
          dishId: "68cb88005669a99259bcd0fb",
          name: "Matcha latte Dâu (Large)",
          pricePerQuantity: 43000,
          quantity: 1,
          price: 43000,
          category: "Matcha",
          image: "https://example.com/image.jpg",
          variant: {
            size: "Large",
            price: 43000,
            cost: 15500
          },
          toppings: null,
          note: null,
          originalPricePerQuantity: 43000,
          originalPrice: 43000,
          isHappyHourItem: false,
          happyHourDiscount: 0,
          promotionsApplied: []
        }
      ],
      thirdPartyVendor: "None"
    }
  );

  // Test Case 2: Order with 10% order-level promotion
  await testOrderCreation(
    'Order with 10% order-level promotion',
    {
      customerDetails: {
        name: "Jane Smith",
        phone: "0987654321",
        guests: 1
      },
      orderStatus: "progress",
      bills: {
        subtotal: 38000,
        promotionDiscount: 3800,
        total: 34200,
        tax: 0,
        totalWithTax: 34200
      },
      appliedPromotions: [
        {
          promotionId: "68d6724720a80274cda4ae6f",
          name: "DISCOUNT 10%",
          type: "order_percentage",
          discountAmount: 3800,
          code: "DISCOUNT10",
          appliedToItems: []
        }
      ],
      items: [
        {
          id: "test-item-2",
          dishId: "68cb88005669a99259bcd0fb",
          name: "Matcha latte Dâu (Medium)",
          pricePerQuantity: 38000,
          quantity: 1,
          price: 38000,
          category: "Matcha",
          image: "https://example.com/image.jpg",
          variant: {
            size: "Medium",
            price: 38000,
            cost: 14000
          },
          toppings: null,
          note: null,
          originalPricePerQuantity: 38000,
          originalPrice: 38000,
          isHappyHourItem: false,
          happyHourDiscount: 0,
          promotionsApplied: []
        }
      ],
      thirdPartyVendor: "None"
    }
  );

  // Test Case 3: Order with fixed amount promotion
  await testOrderCreation(
    'Order with fixed amount promotion',
    {
      customerDetails: {
        name: "Bob Wilson",
        phone: "0555666777",
        guests: 3
      },
      orderStatus: "pending",
      bills: {
        subtotal: 86000,
        promotionDiscount: 10000,
        total: 76000,
        tax: 0,
        totalWithTax: 76000
      },
      appliedPromotions: [
        {
          promotionId: "test-fixed-promo-id",
          name: "10K OFF",
          type: "order_fixed",
          discountAmount: 10000,
          code: "SAVE10K",
          appliedToItems: []
        }
      ],
      items: [
        {
          id: "test-item-3",
          dishId: "68cb88005669a99259bcd0fb",
          name: "Matcha latte Dâu (Large)",
          pricePerQuantity: 43000,
          quantity: 2,
          price: 86000,
          category: "Matcha",
          image: "https://example.com/image.jpg",
          variant: {
            size: "Large",
            price: 43000,
            cost: 15500
          },
          toppings: null,
          note: null,
          originalPricePerQuantity: 43000,
          originalPrice: 86000,
          isHappyHourItem: false,
          happyHourDiscount: 0,
          promotionsApplied: []
        }
      ],
      thirdPartyVendor: "None"
    }
  );

  // Test Case 4: Order with Happy Hour (item-level promotion)
  await testOrderCreation(
    'Order with Happy Hour item-level promotion',
    {
      customerDetails: {
        name: "Alice Brown",
        phone: "0111222333",
        guests: 1
      },
      orderStatus: "pending",
      bills: {
        subtotal: 43000,
        promotionDiscount: 8000,
        total: 35000,
        tax: 0,
        totalWithTax: 35000
      },
      appliedPromotions: [
        {
          promotionId: "68d67426e449d734a608f4d3",
          name: "Happy Hour",
          type: "happy_hour",
          discountAmount: 8000,
          code: "HAPPYHOUR",
          appliedToItems: ["test-item-4"]
        }
      ],
      items: [
        {
          id: "test-item-4",
          dishId: "68cb88005669a99259bcd0fb",
          name: "Matcha latte Dâu (Large)",
          pricePerQuantity: 35000,
          quantity: 1,
          price: 35000,
          category: "Matcha",
          image: "https://example.com/image.jpg",
          variant: {
            size: "Large",
            price: 43000,
            cost: 15500
          },
          toppings: null,
          note: null,
          originalPricePerQuantity: 43000,
          originalPrice: 43000,
          isHappyHourItem: true,
          happyHourDiscount: 8000,
          promotionsApplied: [
            {
              promotionId: "68d67426e449d734a608f4d3",
              promotionName: "Happy Hour",
              promotionType: "happy_hour",
              discountAmount: 8000,
              appliedAt: new Date().toISOString()
            }
          ]
        }
      ],
      thirdPartyVendor: "None"
    }
  );

  // Test Case 5: Multiple items with mixed promotions
  await testOrderCreation(
    'Order with multiple items and mixed promotions',
    {
      customerDetails: {
        name: "Charlie Davis",
        phone: "0444555666",
        guests: 4
      },
      orderStatus: "pending",
      bills: {
        subtotal: 119000,
        promotionDiscount: 19900, // 8000 (Happy Hour) + 11900 (10% on remaining)
        total: 99100,
        tax: 0,
        totalWithTax: 99100
      },
      appliedPromotions: [
        {
          promotionId: "68d67426e449d734a608f4d3",
          name: "Happy Hour",
          type: "happy_hour",
          discountAmount: 8000,
          code: "HAPPYHOUR",
          appliedToItems: ["test-item-5a"]
        },
        {
          promotionId: "68d6724720a80274cda4ae6f",
          name: "DISCOUNT 10%",
          type: "order_percentage",
          discountAmount: 11900,
          code: "DISCOUNT10",
          appliedToItems: []
        }
      ],
      items: [
        {
          id: "test-item-5a",
          dishId: "68cb88005669a99259bcd0fb",
          name: "Matcha latte Dâu (Large) - Happy Hour",
          pricePerQuantity: 35000,
          quantity: 1,
          price: 35000,
          category: "Matcha",
          image: "https://example.com/image.jpg",
          variant: {
            size: "Large",
            price: 43000,
            cost: 15500
          },
          toppings: null,
          note: null,
          originalPricePerQuantity: 43000,
          originalPrice: 43000,
          isHappyHourItem: true,
          happyHourDiscount: 8000,
          promotionsApplied: [
            {
              promotionId: "68d67426e449d734a608f4d3",
              promotionName: "Happy Hour",
              promotionType: "happy_hour",
              discountAmount: 8000,
              appliedAt: new Date().toISOString()
            }
          ]
        },
        {
          id: "test-item-5b",
          dishId: "another-dish-id",
          name: "Regular Coffee",
          pricePerQuantity: 38000,
          quantity: 2,
          price: 76000,
          category: "Coffee",
          image: "https://example.com/coffee.jpg",
          variant: {
            size: "Medium",
            price: 38000,
            cost: 12000
          },
          toppings: null,
          note: null,
          originalPricePerQuantity: 38000,
          originalPrice: 76000,
          isHappyHourItem: false,
          happyHourDiscount: 0,
          promotionsApplied: []
        }
      ],
      thirdPartyVendor: "None"
    }
  );

  // Test Case 6: Invalid promotion (should fail)
  await testOrderCreation(
    'Order with invalid promotion discount (should fail)',
    {
      customerDetails: {
        name: "Invalid Test",
        phone: "0000000000",
        guests: 1
      },
      orderStatus: "pending",
      bills: {
        subtotal: 38000,
        promotionDiscount: 5000, // Wrong discount amount
        total: 33000,
        tax: 0,
        totalWithTax: 33000
      },
      appliedPromotions: [
        {
          promotionId: "68d6724720a80274cda4ae6f",
          name: "DISCOUNT 10%",
          type: "order_percentage",
          discountAmount: 3800, // Correct discount is 3800, but total shows 33000
          code: "DISCOUNT10",
          appliedToItems: []
        }
      ],
      items: [
        {
          id: "test-item-6",
          dishId: "68cb88005669a99259bcd0fb",
          name: "Matcha latte Dâu (Medium)",
          pricePerQuantity: 38000,
          quantity: 1,
          price: 38000,
          category: "Matcha",
          image: "https://example.com/image.jpg",
          variant: {
            size: "Medium",
            price: 38000,
            cost: 14000
          },
          toppings: null,
          note: null,
          originalPricePerQuantity: 38000,
          originalPrice: 38000,
          isHappyHourItem: false,
          happyHourDiscount: 0,
          promotionsApplied: []
        }
      ],
      thirdPartyVendor: "None"
    },
    'error' // Expected to fail
  );

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test Suite Completed');
}

// Export for use in other files or run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testOrderCreation,
  runAllTests
};


