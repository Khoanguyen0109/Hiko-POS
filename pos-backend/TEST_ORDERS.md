# Order API Testing Guide

This guide helps you test the order API with various promotion scenarios.

## Quick Start

1. **Start the backend server:**
   ```bash
   cd pos-backend
   npm run dev
   ```

2. **Run the test script:**
   ```bash
   node manual-test-orders.js
   ```

## Test Scenarios Covered

### ✅ **Test 1: No Promotions**
- Simple order with original pricing
- Validates basic order creation

### ✅ **Test 2: 10% Order Discount**
- Order-level percentage promotion
- Tests `order_percentage` promotion type
- Example: 38,000 → 34,200 (10% off)

### ✅ **Test 3: Fixed Amount Discount**
- Order-level fixed amount promotion
- Tests `order_fixed` promotion type
- Example: 43,000 → 38,000 (5K off)

### ✅ **Test 4: Multiple Items with Promotion**
- Multiple items in cart
- Order-level discount applied to total
- Example: 119,000 → 107,100 (10% off)

### ❌ **Test 5: Invalid Promotion (Should Fail)**
- Incorrect math in promotion calculation
- Tests validation logic
- Should return error message

## Manual Testing with Postman/Insomnia

### Endpoint
```
POST http://localhost:3000/api/order
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Sample Payloads

#### 1. No Promotion Order
```json
{
  "customerDetails": {
    "name": "Test Customer",
    "phone": "0123456789",
    "guests": 1
  },
  "orderStatus": "pending",
  "bills": {
    "subtotal": 43000,
    "promotionDiscount": 0,
    "total": 43000,
    "tax": 0,
    "totalWithTax": 43000
  },
  "appliedPromotions": [],
  "items": [
    {
      "id": "test-1",
      "dishId": "68cb88005669a99259bcd0fb",
      "name": "Matcha Latte Large",
      "pricePerQuantity": 43000,
      "quantity": 1,
      "price": 43000,
      "category": "Matcha",
      "originalPricePerQuantity": 43000,
      "originalPrice": 43000,
      "variant": {
        "size": "Large",
        "price": 43000,
        "cost": 15500
      }
    }
  ],
  "thirdPartyVendor": "None"
}
```

#### 2. 10% Discount Order
```json
{
  "customerDetails": {
    "name": "Discount Customer",
    "phone": "0987654321",
    "guests": 2
  },
  "orderStatus": "pending",
  "bills": {
    "subtotal": 38000,
    "promotionDiscount": 3800,
    "total": 34200,
    "tax": 0,
    "totalWithTax": 34200
  },
  "appliedPromotions": [
    {
      "promotionId": "promo-10-percent",
      "name": "10% OFF",
      "type": "order_percentage",
      "discountAmount": 3800,
      "code": "DISCOUNT10"
    }
  ],
  "items": [
    {
      "id": "test-2",
      "dishId": "68cb88005669a99259bcd0fb",
      "name": "Matcha Latte Medium",
      "pricePerQuantity": 38000,
      "quantity": 1,
      "price": 38000,
      "category": "Matcha",
      "originalPricePerQuantity": 38000,
      "originalPrice": 38000,
      "variant": {
        "size": "Medium",
        "price": 38000,
        "cost": 14000
      }
    }
  ],
  "thirdPartyVendor": "None"
}
```

## Expected Results

### ✅ Successful Response
```json
{
  "success": true,
  "message": "Order created successfully!",
  "data": {
    "_id": "order-id-here",
    "bills": {
      "subtotal": 38000,
      "promotionDiscount": 3800,
      "total": 34200,
      "tax": 0,
      "totalWithTax": 34200
    },
    "appliedPromotions": [...],
    "items": [...],
    "createdAt": "2025-09-27T..."
  }
}
```

### ❌ Error Response
```json
{
  "success": false,
  "message": "Bill total (30000) does not match calculated total (34200)",
  "statusCode": 400
}
```

## Backend Console Logs

When testing, check the backend console for detailed calculation logs:

```
Backend calculation debug: {
  hasOrderLevelPromotions: true,
  hasItemLevelPromotions: false,
  promotions: [
    { name: '10% OFF', type: 'order_percentage', discountAmount: 3800 }
  ],
  calculatedSubtotal: 38000,
  calculatedTotal: 34200,
  billsSubtotal: 38000,
  billsTotal: 34200
}
```

## Troubleshooting

### Common Issues

1. **"Bill total does not match calculated total"**
   - Check that your promotion math is correct
   - Ensure `discountAmount` matches the actual discount
   - Verify `bills.total = bills.subtotal - bills.promotionDiscount`

2. **"Connection refused"**
   - Make sure backend server is running on port 3000
   - Check if MongoDB is connected

3. **"Invalid dishId"**
   - Use valid ObjectId format for `dishId`
   - Or update the test with actual dish IDs from your database

### Debug Tips

1. **Check Backend Logs**: The console shows detailed calculation breakdowns
2. **Verify Math**: Manually calculate subtotal - discount = total
3. **Test Incrementally**: Start with no promotions, then add complexity
4. **Use Real Data**: Replace test IDs with actual data from your database

## Customization

To test with your actual data:

1. **Update Dish IDs**: Replace `"68cb88005669a99259bcd0fb"` with real dish IDs
2. **Update Promotion IDs**: Use actual promotion IDs from your database
3. **Modify Prices**: Use your actual menu prices
4. **Add Authentication**: Include JWT tokens if your API requires auth

## Next Steps

After successful testing:

1. **Frontend Integration**: Use these payloads as reference for frontend implementation
2. **Error Handling**: Implement proper error handling in your frontend
3. **User Experience**: Show clear promotion information to users
4. **Analytics**: Track promotion usage and effectiveness


