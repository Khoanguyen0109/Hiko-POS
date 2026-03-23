# Ingredient Management System

## Overview
A comprehensive ingredient inventory and cost tracking system integrated into the Restaurant POS. This system enables real-time stock management, cost calculation, and transaction tracking.

---

## Features

### 1. **Ingredient Management**
- ✅ Create, Read, Update, Delete (CRUD) ingredients
- ✅ Track inventory levels (current stock, min stock, max stock, reorder point)
- ✅ Multiple units of measurement (kg, g, liter, ml, piece, pack, box, bag)
- ✅ Category-based organization (Protein, Vegetable, Fruit, Dairy, Grain, Spice, Oil, Sauce, Beverage, Other)
- ✅ Storage information (location, temperature, shelf life)
- ✅ Cost tracking (average cost, last purchase cost, standard cost)
- ✅ Low stock alerts

### 2. **Transaction Management**
- ✅ **Import Transactions**: Add stock with supplier info, batch numbers, expiry dates
- ✅ **Export Transactions**: Remove stock for production, waste, damage, etc.
- ✅ **Adjustment Transactions**: Manual stock corrections
- ✅ Automatic stock level updates
- ✅ Cost calculations using weighted average method
- ✅ Transaction history per ingredient

### 3. **UI Components**
- ✅ Modern, responsive ingredient management page
- ✅ Grid view with stock status indicators
- ✅ Quick actions (Edit, Import, Delete)
- ✅ Modal-based forms for creating/editing
- ✅ Transaction modal for imports/exports
- ✅ Low stock tab for quick monitoring
- ✅ Pagination support
- ✅ Dashboard integration

---

## Backend Structure

### **Models**

#### `ingredientModel.js`
```javascript
{
  name: String,              // Ingredient name
  code: String,              // Unique code (e.g., CHKN-001)
  category: Enum,            // Protein, Vegetable, etc.
  unit: Enum,                // kg, g, liter, ml, etc.
  inventory: {
    currentStock: Number,
    minStock: Number,
    maxStock: Number,
    reorderPoint: Number
  },
  costs: {
    averageCost: Number,     // Weighted average
    lastPurchaseCost: Number,
    standardCost: Number
  },
  storage: {
    location: String,
    temperature: Enum,       // FROZEN, CHILLED, AMBIENT, DRY
    shelfLife: Number        // in days
  },
  isActive: Boolean
}
```

#### `ingredientTransactionModel.js`
```javascript
{
  transactionNumber: String, // Auto-generated (IMP-xxx, EXP-xxx, ADJ-xxx)
  type: Enum,                // IMPORT, EXPORT, ADJUSTMENT, WASTE
  ingredientId: ObjectId,
  quantity: Number,
  unitCost: Number,
  totalCost: Number,
  stockBefore: Number,
  stockAfter: Number,
  importDetails: {
    supplierId: ObjectId,
    supplierName: String,
    batchNumber: String,
    expiryDate: Date,
    qualityGrade: Enum       // A, B, C
  },
  exportDetails: {
    orderId: ObjectId,
    dishId: ObjectId,
    dishName: String,
    reason: Enum             // PRODUCTION, WASTE, DAMAGE, THEFT, OTHER
  },
  status: Enum               // PENDING, COMPLETED, CANCELLED
}
```

### **API Endpoints**

#### Ingredient Endpoints
- `POST /api/ingredient/` - Create ingredient
- `GET /api/ingredient/` - Get all ingredients (with filters)
- `GET /api/ingredient/:id` - Get ingredient by ID
- `PUT /api/ingredient/:id` - Update ingredient
- `DELETE /api/ingredient/:id` - Soft delete (mark inactive)
- `GET /api/ingredient/low-stock` - Get low stock ingredients
- `GET /api/ingredient/:id/history` - Get transaction history

#### Transaction Endpoints
- `POST /api/ingredient-transaction/import` - Import stock
- `POST /api/ingredient-transaction/export` - Export stock
- `POST /api/ingredient-transaction/adjust` - Adjust stock
- `GET /api/ingredient-transaction/` - Get all transactions
- `GET /api/ingredient-transaction/:id` - Get transaction by ID

### **Query Parameters**

#### Ingredients
```javascript
{
  category: "Protein" | "Vegetable" | ... | "all",
  isActive: true | false,
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "all",
  search: "chicken",        // Search by name or code
  page: 1,
  limit: 50,
  sortBy: "name",
  sortOrder: "asc" | "desc"
}
```

#### Transactions
```javascript
{
  ingredientId: "xxx",
  type: "IMPORT" | "EXPORT" | "ADJUSTMENT" | "all",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  page: 1,
  limit: 50,
  sortOrder: "asc" | "desc"
}
```

---

## Frontend Structure

### **Redux Slice** (`ingredientSlice.js`)

#### State
```javascript
{
  items: [],                 // All ingredients
  currentIngredient: null,   // Selected ingredient
  lowStockItems: [],         // Low stock alerts
  transactions: [],          // Transaction list
  loading: false,
  error: null,
  filters: {
    category: "all",
    stockStatus: "all",
    isActive: true,
    search: ""
  },
  pagination: { ... }
}
```

#### Async Thunks
- `fetchIngredients(params)` - Load ingredients
- `fetchIngredientById(id)` - Load single ingredient
- `createIngredient(data)` - Create new ingredient
- `editIngredient({ ingredientId, ...data })` - Update ingredient
- `removeIngredient(id)` - Delete ingredient
- `fetchLowStockIngredients()` - Load low stock items
- `fetchIngredientHistory({ id, params })` - Load transaction history
- `createImportTransaction(data)` - Import stock
- `createExportTransaction(data)` - Export stock
- `createAdjustmentTransaction(data)` - Adjust stock
- `fetchTransactions(params)` - Load transactions

### **Pages**

#### `Ingredients.jsx`
Main ingredient management page featuring:
- Tab navigation (All Ingredients / Low Stock)
- Ingredient grid with cards
- Quick action buttons
- Stock status indicators
- Pagination
- Modal integration

#### **Components**

##### `IngredientModal.jsx`
Form for creating/editing ingredients with sections:
- Basic Info (name, code, category, unit)
- Inventory Settings (min/max stock, reorder point)
- Cost Information (standard cost)
- Storage Details (location, temperature, shelf life)
- Notes

##### `TransactionModal.jsx`
Form for stock transactions:
- **Import Mode**: quantity, unit cost, supplier info, batch, expiry
- **Export Mode**: quantity, reason (production/waste/etc.)
- **Adjustment Mode**: quantity adjustment with reason
- Real-time cost calculation
- Current stock display

### **Dashboard Integration**
- New "Ingredients" button in Dashboard (admin only)
- Navigates to `/ingredients` route
- Placed alongside Spending button

---

## Cost Calculation Logic

### **Import (Weighted Average)**
```javascript
oldTotalValue = stockBefore * averageCost
newTotalValue = oldTotalValue + (quantity * unitCost)
newAverageCost = newTotalValue / (stockBefore + quantity)
```

**Example:**
- Current: 10 kg @ 50,000 VND/kg = 500,000 VND
- Import: 5 kg @ 60,000 VND/kg = 300,000 VND
- New average: 800,000 VND / 15 kg = 53,333 VND/kg

### **Export**
- Uses current `averageCost` for cost tracking
- No recalculation of average cost

---

## Access Control
- **Admin Only**: Create, Edit, Delete ingredients
- **All Users**: View ingredients, Import/Export stock (if given access)
- Role-based UI rendering

---

## Stock Status Logic

| Status | Condition |
|--------|-----------|
| **Out of Stock** | currentStock ≤ 0 |
| **Low Stock** | 0 < currentStock ≤ reorderPoint |
| **In Stock** | currentStock > reorderPoint |

---

## Usage Examples

### **Creating an Ingredient**
```javascript
dispatch(createIngredient({
  name: "Chicken Breast",
  code: "CHKN-001",
  category: "Protein",
  unit: "kg",
  inventory: {
    minStock: 5,
    reorderPoint: 10,
    maxStock: 50
  },
  costs: {
    standardCost: 50000
  },
  storage: {
    location: "Freezer A1",
    temperature: "FROZEN",
    shelfLife: 30
  }
}));
```

### **Importing Stock**
```javascript
dispatch(createImportTransaction({
  ingredientId: "xxx",
  quantity: 20,
  unitCost: 55000,
  supplierName: "Fresh Meats Co.",
  batchNumber: "BATCH-2025-001",
  expiryDate: "2025-12-31",
  notes: "Premium quality"
}));
```

### **Exporting Stock (Production)**
```javascript
dispatch(createExportTransaction({
  ingredientId: "xxx",
  quantity: 2,
  reason: "PRODUCTION",
  dishName: "Grilled Chicken",
  notes: "For order #12345"
}));
```

---

## Future Enhancements (Not Implemented)

### **Dish Recipes** (DishRecipeModel)
- Link ingredients to dishes
- Auto-calculate dish costs based on ingredient costs
- Auto-export ingredients when orders are completed
- Recipe costing per serving/size

### **Analytics**
- Ingredient usage vs. sales comparison
- Waste tracking and analysis
- Cost trend reports
- Inventory valuation
- Profitability by dish

### **Advanced Features**
- Barcode scanning for quick updates
- Batch tracking for food safety compliance
- Automatic reorder suggestions
- Vendor price comparison
- Multi-location inventory

---

## Testing the System

### **Backend Tests**
```bash
cd pos-backend
npm run dev
```

Test with tools like Postman or curl:
```bash
# Create ingredient
curl -X POST http://localhost:3000/api/ingredient \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Tomato","code":"TOM-001","category":"Vegetable","unit":"kg"}'

# Import stock
curl -X POST http://localhost:3000/api/ingredient-transaction/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"ingredientId":"xxx","quantity":10,"unitCost":5000}'
```

### **Frontend Tests**
```bash
cd pos-frontend
npm run dev
```

1. Login as Admin
2. Navigate to Dashboard
3. Click "Ingredients" button
4. Create a new ingredient
5. Import stock
6. Check low stock tab
7. Export stock and verify calculations

---

## Technical Notes

### **Database Indexes**
- `name`, `code`, `category` for fast lookups
- `inventory.currentStock` for stock queries
- `transactionDate`, `ingredientId` for history queries

### **Validation**
- Unique `name` and `code` per ingredient
- Non-negative stock quantities
- Min ≤ Reorder ≤ Max constraints
- Required fields enforced

### **Error Handling**
- Insufficient stock prevention
- Duplicate ingredient detection
- Invalid transaction types
- Missing required fields
- Network error recovery

---

## File Structure

```
pos-backend/
├── models/
│   ├── ingredientModel.js
│   └── ingredientTransactionModel.js
├── controllers/
│   ├── ingredientController.js
│   └── ingredientTransactionController.js
└── routes/
    ├── ingredientRoute.js
    └── ingredientTransactionRoute.js

pos-frontend/
├── src/
│   ├── pages/
│   │   └── Ingredients.jsx
│   ├── components/
│   │   └── ingredients/
│   │       ├── IngredientModal.jsx
│   │       └── TransactionModal.jsx
│   ├── redux/
│   │   └── slices/
│   │       └── ingredientSlice.js
│   └── https/
│       └── index.js (API functions)
```

---

## Support & Troubleshooting

### **Common Issues**

1. **"Insufficient stock" error**
   - Check current stock level
   - Verify export quantity

2. **Average cost not updating**
   - Ensure imports include unitCost
   - Check transaction completion

3. **Low stock not showing**
   - Verify reorderPoint is set
   - Check currentStock value

4. **Modal not opening**
   - Check Redux state
   - Verify user permissions

---

## Conclusion

The Ingredient Management System provides a robust foundation for inventory and cost control in restaurant operations. It integrates seamlessly with the existing POS system and is ready for future enhancements like recipe management and advanced analytics.

**Status**: ✅ **Fully Implemented and Ready to Use**

