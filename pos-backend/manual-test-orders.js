#!/usr/bin/env node

/**
 * Manual Test Script for Order API with Promotions
 * 
 * Usage:
 * 1. Start your backend server: npm run dev
 * 2. Run this script: node manual-test-orders.js
 * 
 * This script will test various order scenarios with and without promotions
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/order';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testOrder(testName, payload, shouldSucceed = true) {
  log('cyan', `\n${'='.repeat(50)}`);
  log('bright', `🧪 TEST: ${testName}`);
  log('cyan', '='.repeat(50));
  
  console.log('📤 Request Payload:');
  console.log(JSON.stringify(payload, null, 2));
  
  try {
    const response = await axios.post(BASE_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    if (shouldSucceed) {
      log('green', '✅ SUCCESS: Order created successfully!');
      log('blue', `📋 Order ID: ${response.data.data._id}`);
      log('blue', `💰 Final Total: ${response.data.data.bills.total}`);
      
      if (response.data.data.appliedPromotions?.length > 0) {
        log('magenta', '🎯 Applied Promotions:');
        response.data.data.appliedPromotions.forEach(promo => {
          console.log(`   - ${promo.name} (${promo.type}): -${promo.discountAmount}`);
        });
      }
      
      log('blue', `📊 Bills Summary:`);
      console.log(`   Subtotal: ${response.data.data.bills.subtotal}`);
      console.log(`   Discount: ${response.data.data.bills.promotionDiscount}`);
      console.log(`   Total: ${response.data.data.bills.total}`);
      
    } else {
      log('red', '❌ UNEXPECTED SUCCESS: Expected this test to fail!');
    }
    
  } catch (error) {
    if (!shouldSucceed) {
      log('green', '✅ EXPECTED FAILURE: Test failed as expected');
      log('yellow', `📝 Error: ${error.response?.data?.message || error.message}`);
    } else {
      log('red', '❌ UNEXPECTED FAILURE: Test should have succeeded');
      log('red', `📝 Error: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.data) {
        console.log('📋 Full error response:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

async function runTests() {
  log('bright', '🚀 Starting Manual Order Tests');
  log('bright', `🌐 Testing against: ${BASE_URL}`);
  
  // Test 1: Simple order without promotions
  await testOrder(
    'Simple Order - No Promotions',
    {
      customerDetails: {
        name: "Test Customer",
        phone: "0123456789",
        guests: 1
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
          id: "test-1",
          dishId: "68cb88005669a99259bcd0fb",
          name: "Matcha Latte Large",
          pricePerQuantity: 43000,
          quantity: 1,
          price: 43000,
          category: "Matcha",
          originalPricePerQuantity: 43000,
          originalPrice: 43000,
          variant: { size: "Large", price: 43000, cost: 15500 },
          toppings: null,
          note: null
        }
      ],
      thirdPartyVendor: "None"
    }
  );

  // Test 2: Order with 10% discount
  await testOrder(
    'Order with 10% Discount',
    {
      customerDetails: {
        name: "Discount Customer",
        phone: "0987654321",
        guests: 2
      },
      orderStatus: "pending",
      bills: {
        subtotal: 38000,
        promotionDiscount: 3800,
        total: 34200,
        tax: 0,
        totalWithTax: 34200
      },
      appliedPromotions: [
        {
          promotionId: "promo-10-percent",
          name: "10% OFF",
          type: "order_percentage",
          discountAmount: 3800,
          code: "DISCOUNT10"
        }
      ],
      items: [
        {
          id: "test-2",
          dishId: "68cb88005669a99259bcd0fb",
          name: "Matcha Latte Medium",
          pricePerQuantity: 38000,
          quantity: 1,
          price: 38000,
          category: "Matcha",
          originalPricePerQuantity: 38000,
          originalPrice: 38000,
          variant: { size: "Medium", price: 38000, cost: 14000 },
          toppings: null,
          note: null
        }
      ],
      thirdPartyVendor: "None"
    }
  );

  // Test 3: Order with fixed discount
  await testOrder(
    'Order with Fixed 5K Discount',
    {
      customerDetails: {
        name: "Fixed Discount Customer",
        phone: "0555666777",
        guests: 1
      },
      orderStatus: "pending",
      bills: {
        subtotal: 43000,
        promotionDiscount: 5000,
        total: 38000,
        tax: 0,
        totalWithTax: 38000
      },
      appliedPromotions: [
        {
          promotionId: "promo-5k-off",
          name: "5K OFF",
          type: "order_fixed",
          discountAmount: 5000,
          code: "SAVE5K"
        }
      ],
      items: [
        {
          id: "test-3",
          dishId: "68cb88005669a99259bcd0fb",
          name: "Matcha Latte Large",
          pricePerQuantity: 43000,
          quantity: 1,
          price: 43000,
          category: "Matcha",
          originalPricePerQuantity: 43000,
          originalPrice: 43000,
          variant: { size: "Large", price: 43000, cost: 15500 },
          toppings: null,
          note: null
        }
      ],
      thirdPartyVendor: "None"
    }
  );

  // Test 4: Multiple items with promotion
  await testOrder(
    'Multiple Items with 10% Discount',
    {
      customerDetails: {
        name: "Multi Item Customer",
        phone: "0111222333",
        guests: 3
      },
      orderStatus: "pending",
      bills: {
        subtotal: 119000, // 43000 + 38000 + 38000
        promotionDiscount: 11900, // 10% of 119000
        total: 107100,
        tax: 0,
        totalWithTax: 107100
      },
      appliedPromotions: [
        {
          promotionId: "promo-10-percent",
          name: "10% OFF",
          type: "order_percentage",
          discountAmount: 11900,
          code: "DISCOUNT10"
        }
      ],
      items: [
        {
          id: "test-4a",
          dishId: "68cb88005669a99259bcd0fb",
          name: "Matcha Latte Large",
          pricePerQuantity: 43000,
          quantity: 1,
          price: 43000,
          category: "Matcha",
          originalPricePerQuantity: 43000,
          originalPrice: 43000,
          variant: { size: "Large", price: 43000, cost: 15500 }
        },
        {
          id: "test-4b",
          dishId: "another-dish-id",
          name: "Matcha Latte Medium",
          pricePerQuantity: 38000,
          quantity: 2,
          price: 76000,
          category: "Matcha",
          originalPricePerQuantity: 38000,
          originalPrice: 76000,
          variant: { size: "Medium", price: 38000, cost: 14000 }
        }
      ],
      thirdPartyVendor: "None"
    }
  );

  // Test 5: Invalid promotion (should fail)
  await testOrder(
    'Invalid Promotion Math (Should Fail)',
    {
      customerDetails: {
        name: "Invalid Test",
        phone: "0000000000",
        guests: 1
      },
      orderStatus: "pending",
      bills: {
        subtotal: 38000,
        promotionDiscount: 3800, // Says 10% discount
        total: 30000, // But total is wrong (should be 34200)
        tax: 0,
        totalWithTax: 30000
      },
      appliedPromotions: [
        {
          promotionId: "promo-10-percent",
          name: "10% OFF",
          type: "order_percentage",
          discountAmount: 3800,
          code: "DISCOUNT10"
        }
      ],
      items: [
        {
          id: "test-5",
          dishId: "68cb88005669a99259bcd0fb",
          name: "Matcha Latte Medium",
          pricePerQuantity: 38000,
          quantity: 1,
          price: 38000,
          category: "Matcha",
          originalPricePerQuantity: 38000,
          originalPrice: 38000,
          variant: { size: "Medium", price: 38000, cost: 14000 }
        }
      ],
      thirdPartyVendor: "None"
    },
    false // Should fail
  );

  log('bright', '\n🏁 All tests completed!');
  log('yellow', '\n💡 Tips:');
  console.log('   - Check the backend console for detailed calculation logs');
  console.log('   - Successful orders will be saved to your database');
  console.log('   - Failed tests help verify validation is working correctly');
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    log('red', '💥 Test runner failed:');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runTests, testOrder };


