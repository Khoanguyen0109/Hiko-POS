# Jest Testing Suite for POS Backend

This directory contains comprehensive Jest tests for the Restaurant POS System backend API.

## 🚀 Quick Start

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- orderController.test.js
npm test -- promotionService.test.js
npm test -- integration.test.js
```

## 📁 Test Structure

```
tests/
├── setup.js                 # Jest setup with in-memory MongoDB
├── orderController.test.js   # Order API endpoint tests
├── promotionService.test.js  # Promotion logic unit tests
├── integration.test.js       # End-to-end integration tests
└── README.md                # This file
```

## 🧪 Test Categories

### 1. **Order Controller Tests** (`orderController.test.js`)
Tests the main order API endpoints:

- ✅ **Create Orders**
  - Without promotions
  - With order-level promotions (10% discount, fixed amount)
  - With item-level promotions (Happy Hour)
  - Multiple items with promotions
  
- ✅ **Validation Tests**
  - Invalid bill totals
  - Missing required fields
  - Invalid dish IDs
  
- ✅ **CRUD Operations**
  - Get order by ID
  - Update order status
  - Update payment method

### 2. **Promotion Service Tests** (`promotionService.test.js`)
Tests the promotion logic:

- ✅ **Time Validation**
  - Time slot validation
  - Day of week validation
  - Timezone handling
  - Midnight crossing scenarios
  
- ✅ **Item Eligibility**
  - Category-based promotions
  - Specific dish promotions
  - All-order promotions
  
- ✅ **Discount Calculations**
  - Uniform pricing
  - Percentage discounts
  - Fixed amount discounts
  
- ✅ **Happy Hour Logic**
  - Finding active promotions
  - Applying promotions to eligible items

### 3. **Integration Tests** (`integration.test.js`)
Tests complete workflows:

- ✅ **Order Lifecycle**
  - Create → Retrieve → Update → List
  - Multiple orders with different promotions
  - Promotion math validation
  
- ✅ **Error Handling**
  - Database errors
  - Concurrent operations
  - Edge cases

## 🗄️ Test Database

Tests use **MongoDB Memory Server** for isolated testing:

- ✅ **Isolated**: Each test runs with a clean database
- ✅ **Fast**: In-memory database for quick test execution
- ✅ **No Dependencies**: No need for external MongoDB instance
- ✅ **Automatic Cleanup**: Database is cleaned after each test

## 📊 Test Coverage

Run coverage reports to see how much of your code is tested:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI/CD
- Terminal output shows coverage summary

## 🎯 Test Examples

### Testing Order Creation
```javascript
test('should create order with 10% promotion', async () => {
  const orderData = {
    bills: {
      subtotal: 38000,
      promotionDiscount: 3800,
      total: 34200
    },
    appliedPromotions: [{
      name: '10% OFF',
      type: 'order_percentage',
      discountAmount: 3800
    }],
    // ... rest of order data
  };

  const response = await request(app)
    .post('/api/order')
    .send(orderData)
    .expect(201);

  expect(response.body.data.bills.total).toBe(34200);
});
```

### Testing Promotion Logic
```javascript
test('should calculate uniform price discount', () => {
  const item = { pricePerQuantity: 43000, quantity: 1 };
  const promotion = { 
    discountType: 'uniform_price',
    discount: { uniformPrice: 35000 }
  };

  const discount = PromotionService.calculateItemHappyHourDiscount(item, promotion);
  expect(discount).toBe(8000); // 43000 - 35000
});
```

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
- **Test Environment**: Node.js
- **Setup**: Automatic MongoDB Memory Server
- **Timeout**: 30 seconds for database operations
- **Coverage**: Controllers, services, models, utils
- **Cleanup**: Automatic mock and database cleanup

### Package.json Scripts
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

## 🐛 Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="should create order with 10% promotion"
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Verbose Output
```bash
npm test -- --verbose
```

### Watch Mode for Development
```bash
npm run test:watch
```

## 📝 Writing New Tests

### Test Structure
```javascript
describe('Feature Name', () => {
  beforeEach(async () => {
    // Setup test data
  });

  describe('Specific functionality', () => {
    test('should do something specific', async () => {
      // Arrange
      const testData = {};
      
      // Act
      const result = await someFunction(testData);
      
      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Best Practices
1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Isolated Tests**: Each test should be independent
4. **Clean Data**: Use fresh test data for each test
5. **Mock External Dependencies**: Mock services, APIs, etc.

## 🚨 Common Issues

### MongoDB Connection Issues
```bash
# If tests hang, check for open handles
npm test -- --detectOpenHandles
```

### Timeout Issues
```bash
# Increase timeout for slow operations
jest.setTimeout(60000); // 60 seconds
```

### Memory Issues
```bash
# Run tests with more memory
node --max-old-space-size=4096 node_modules/.bin/jest
```

## 📈 CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: npm test
  
- name: Upload Coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./coverage/lcov.info
```

### Test Reports
- **JUnit**: Add `--reporters=jest-junit` for XML reports
- **Coverage**: LCOV format compatible with most CI/CD systems
- **Badges**: Use coverage badges in README

## 🎉 Benefits

✅ **Confidence**: Catch bugs before deployment  
✅ **Documentation**: Tests serve as living documentation  
✅ **Refactoring**: Safe code changes with test coverage  
✅ **Quality**: Enforce code quality and business logic  
✅ **Debugging**: Isolate and reproduce issues easily  

Happy testing! 🧪


