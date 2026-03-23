# Ingredient Management System - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Dashboard   │  │ Ingredients  │  │   Modals     │              │
│  │   Button     │→ │     Page     │→ │ - Ingredient │              │
│  └──────────────┘  │              │  │ - Transaction│              │
│                     │  ┌────────┐ │  └──────────────┘              │
│                     │  │All Tab │ │                                 │
│                     │  └────────┘ │                                 │
│                     │  ┌────────┐ │                                 │
│                     │  │Low Tab │ │                                 │
│                     │  └────────┘ │                                 │
│                     └──────────────┘                                 │
│                            │                                         │
│                            ↓                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Redux Store (ingredientSlice)                  │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  State:                                                      │   │
│  │  • items[]           • currentIngredient                    │   │
│  │  • lowStockItems[]   • transactions[]                       │   │
│  │  • loading           • error                                │   │
│  │  • filters           • pagination                           │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Actions (Async Thunks):                                    │   │
│  │  • fetchIngredients()        • createIngredient()          │   │
│  │  • fetchLowStockIngredients()• editIngredient()            │   │
│  │  • createImportTransaction() • createExportTransaction()   │   │
│  │  • fetchTransactions()       • fetchIngredientHistory()    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                            │                                         │
│                            ↓                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              HTTP API Layer (axios)                          │   │
│  │  /src/https/index.js                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 │ HTTP/REST
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│                      BACKEND (Express + MongoDB)                      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    API Routes (app.js)                       │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  /api/ingredient/*                                          │   │
│  │  /api/ingredient-transaction/*                              │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                        │
│                             ↓                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Middleware Layer                            │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  • isVerifiedUser (JWT Auth)                                │   │
│  │  • CORS                                                      │   │
│  │  • Body Parser                                               │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                        │
│                             ↓                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Controllers                               │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  ingredientController.js:                                   │   │
│  │  • addIngredient()      • getIngredients()                  │   │
│  │  • getIngredientById()  • updateIngredient()                │   │
│  │  • deleteIngredient()   • getLowStockIngredients()          │   │
│  │  • getIngredientHistory()                                   │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  ingredientTransactionController.js:                        │   │
│  │  • importIngredient()   • exportIngredient()                │   │
│  │  • adjustIngredient()   • getTransactions()                 │   │
│  │  • getTransactionById()                                     │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                        │
│                             ↓                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Business Logic                            │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  • Weighted Average Cost Calculation                        │   │
│  │  • Stock Validation                                          │   │
│  │  • Transaction Number Generation                             │   │
│  │  • Low Stock Detection                                       │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                        │
│                             ↓                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Models (Mongoose)                         │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  ingredientModel.js:                                        │   │
│  │  • Schema definition                                         │   │
│  │  • Virtuals (stockStatus, needsReorder)                    │   │
│  │  • Indexes                                                   │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  ingredientTransactionModel.js:                             │   │
│  │  • Schema definition                                         │   │
│  │  • Transaction types (IMPORT/EXPORT/ADJUSTMENT)            │   │
│  │  • Import/Export details sub-schemas                        │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                        │
│                             ↓                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    MongoDB Database                          │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Collections:                                                │   │
│  │  • ingredients                                               │   │
│  │  • ingredienttransactions                                   │   │
│  │                                                              │   │
│  │  Indexes:                                                    │   │
│  │  • name, code, category                                     │   │
│  │  • inventory.currentStock                                   │   │
│  │  • ingredientId + transactionDate                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. **Create Ingredient Flow**

```
User Action                    Frontend                  Backend                MongoDB
    │                             │                        │                      │
    ├─► Fill Form                │                        │                      │
    │   (IngredientModal)         │                        │                      │
    │                             │                        │                      │
    ├─► Click "Create"           │                        │                      │
    │                             │                        │                      │
    │                      ┌──────▼──────┐               │                      │
    │                      │   Dispatch   │               │                      │
    │                      │createIngredient              │                      │
    │                      └──────┬──────┘               │                      │
    │                             │                        │                      │
    │                      ┌──────▼──────┐               │                      │
    │                      │   Redux      │               │                      │
    │                      │   Thunk      │               │                      │
    │                      └──────┬──────┘               │                      │
    │                             │                        │                      │
    │                      ┌──────▼──────┐               │                      │
    │                      │   axios      │               │                      │
    │                      │POST /api/    │               │                      │
    │                      │ ingredient   │               │                      │
    │                      └──────┬──────┘               │                      │
    │                             │                        │                      │
    │                             │                ┌───────▼────────┐            │
    │                             │                │  Middleware    │            │
    │                             │                │  (JWT Auth)    │            │
    │                             │                └───────┬────────┘            │
    │                             │                        │                      │
    │                             │                ┌───────▼────────┐            │
    │                             │                │  Controller    │            │
    │                             │                │ addIngredient()│            │
    │                             │                └───────┬────────┘            │
    │                             │                        │                      │
    │                             │                ┌───────▼────────┐            │
    │                             │                │  Validation    │            │
    │                             │                │  (unique check)│            │
    │                             │                └───────┬────────┘            │
    │                             │                        │                      │
    │                             │                ┌───────▼────────┐    ┌───────▼────────┐
    │                             │                │  Create Model  │───►│   Save to DB   │
    │                             │                │  Instance      │    │                │
    │                             │                └───────┬────────┘    └───────┬────────┘
    │                             │                        │                      │
    │                      ┌──────▼──────┐       ┌────────▼────────┐            │
    │                      │   Response   │◄──────┤   Return Data   │◄───────────┘
    │                      │   Success    │       └─────────────────┘
    │                      └──────┬──────┘
    │                             │
    │                      ┌──────▼──────┐
    │                      │Update Redux │
    │                      │   State     │
    │                      │items.unshift│
    │                      └──────┬──────┘
    │                             │
    │◄────── Toast ───────────────┘
    │       "Success!"
    │
    ▼
 Modal Closes
 List Refreshed
```

---

### 2. **Import Stock Flow (with Cost Calculation)**

```
User Action              Frontend               Backend                    Database
    │                       │                      │                          │
    ├─► Select Ingredient  │                      │                          │
    ├─► Enter Quantity     │                      │                          │
    ├─► Enter Unit Cost    │                      │                          │
    │   (displays total)   │                      │                          │
    │                       │                      │                          │
    ├─► Click "Import"    │                      │                          │
    │                       │                      │                          │
    │               ┌───────▼────────┐            │                          │
    │               │   Dispatch      │            │                          │
    │               │createImport     │            │                          │
    │               │Transaction()    │            │                          │
    │               └───────┬────────┘            │                          │
    │                       │                      │                          │
    │               ┌───────▼────────┐            │                          │
    │               │POST /api/       │            │                          │
    │               │ingredient-      │            │                          │
    │               │transaction/     │            │                          │
    │               │import           │            │                          │
    │               └───────┬────────┘            │                          │
    │                       │                      │                          │
    │                       │              ┌───────▼────────┐                │
    │                       │              │  Get Ingredient│                │
    │                       │              │  from DB       │◄───────────────┤
    │                       │              └───────┬────────┘                │
    │                       │                      │                          │
    │                       │              ┌───────▼────────────────┐        │
    │                       │              │  COST CALCULATION:     │        │
    │                       │              │  oldValue = stock *    │        │
    │                       │              │             avgCost    │        │
    │                       │              │  newValue = oldValue + │        │
    │                       │              │  (qty * unitCost)      │        │
    │                       │              │  newAvg = newValue /   │        │
    │                       │              │          (stock + qty) │        │
    │                       │              └───────┬────────────────┘        │
    │                       │                      │                          │
    │                       │              ┌───────▼────────┐                │
    │                       │              │  Create         │                │
    │                       │              │  Transaction    │────────────────►
    │                       │              │  Record         │   Save to DB   │
    │                       │              └───────┬────────┘                │
    │                       │                      │                          │
    │                       │              ┌───────▼────────┐                │
    │                       │              │  Update         │                │
    │                       │              │  Ingredient:    │────────────────►
    │                       │              │  • currentStock │   Update DB    │
    │                       │              │  • averageCost  │                │
    │                       │              │  • lastPurchase │                │
    │                       │              └───────┬────────┘                │
    │                       │                      │                          │
    │               ┌───────▼────────┐    ┌───────▼────────┐                │
    │               │  Response       │◄───┤  Return Data   │                │
    │               │  with updated   │    └────────────────┘                │
    │               │  stock & costs  │                                      │
    │               └───────┬────────┘                                      │
    │                       │                                                │
    │               ┌───────▼────────┐                                      │
    │               │  Update Redux:  │                                      │
    │               │  • transactions │                                      │
    │               │  • items (stock)│                                      │
    │               └───────┬────────┘                                      │
    │                       │                                                │
    │◄──── Toast ───────────┘                                              │
    │      "Imported!"                                                      │
    │                                                                        │
    ▼                                                                        │
 Modal Closes                                                               │
 Stock Updated                                                              │
```

---

### 3. **Low Stock Alert Flow**

```
System                   Backend                    Database
  │                        │                          │
  │                ┌───────▼────────┐                │
  │                │  GET /api/      │                │
  │                │  ingredient/    │                │
  │                │  low-stock      │                │
  │                └───────┬────────┘                │
  │                        │                          │
  │                ┌───────▼────────────────┐        │
  │                │  Query:                │        │
  │                │  $expr: {              │        │
  │                │    $lte: [             │        │
  │                │      "$currentStock",  │        │
  │                │      "$reorderPoint"   │────────►
  │                │    ]                   │   Find │
  │                │  }                     │        │
  │                └───────┬────────────────┘        │
  │                        │                          │
  │                ┌───────▼────────┐        ┌───────▼────────┐
  │                │  Return         │◄───────┤  Matching      │
  │                │  Low Stock      │        │  Records       │
  │                │  Items          │        └────────────────┘
  │                └───────┬────────┘
  │                        │
  │                        │
Frontend                   │
  │                        │
  │                ┌───────▼────────┐
  │                │  Redux updates  │
  │                │  lowStockItems[]│
  │                └───────┬────────┘
  │                        │
  │                ┌───────▼────────┐
  │                │  UI shows:      │
  │                │  • Red badges   │
  │                │  • Low Stock tab│
  │                │  • Alert count  │
  │                └────────────────┘
  │
  ▼
User sees alert
```

---

## Component Hierarchy

```
Dashboard
  └─► [Admin Button: "Ingredients"]
        │
        ↓
      Ingredients Page (/ingredients)
        │
        ├─► Tab: All Ingredients
        │     │
        │     ├─► Ingredient Cards Grid
        │     │     └─► Card Actions:
        │     │           ├─► Edit Button → Opens IngredientModal (edit mode)
        │     │           ├─► Import Button → Opens TransactionModal (import mode)
        │     │           └─► Delete Button (admin only)
        │     │
        │     └─► Pagination Controls
        │
        ├─► Tab: Low Stock
        │     │
        │     └─► Filtered Cards (stock <= reorderPoint)
        │
        ├─► Header Actions:
        │     ├─► Add Ingredient → Opens IngredientModal (create mode)
        │     ├─► Import Stock → Opens TransactionModal (import, no ingredient)
        │     └─► Export Stock → Opens TransactionModal (export, no ingredient)
        │
        ├─► IngredientModal
        │     │
        │     ├─► Basic Info Section
        │     ├─► Inventory Settings Section
        │     ├─► Storage Info Section
        │     └─► Form Actions (Cancel/Submit)
        │
        └─► TransactionModal
              │
              ├─► Ingredient Selector
              ├─► Current Stock Display
              ├─► Quantity Input
              ├─► [Import] Cost & Supplier Fields
              ├─► [Export] Reason Selector
              └─► Form Actions (Cancel/Submit)
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Redux Store Structure                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ingredients: {                                              │
│    items: [                                                  │
│      {                                                       │
│        _id, name, code, category, unit,                     │
│        inventory: { currentStock, reorderPoint, ... },      │
│        costs: { averageCost, ... },                         │
│        storage: { ... }                                      │
│      }                                                       │
│    ],                                                        │
│    currentIngredient: null,                                 │
│    lowStockItems: [ ... ],                                  │
│    transactions: [ ... ],                                   │
│    loading: false,                                          │
│    error: null,                                             │
│    filters: { category, stockStatus, search },             │
│    pagination: { currentPage, totalPages, ... }            │
│  }                                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘

Actions dispatch flow:
  User Action → Component → dispatch(asyncThunk) → API Call → 
  → Backend → Database → Response → Redux State Update → UI Re-render
```

---

## Security & Authentication Flow

```
Client Request
    │
    ├─► Include JWT in Authorization Header
    │   "Bearer eyJhbGc..."
    │
    ▼
Backend Middleware (isVerifiedUser)
    │
    ├─► Verify JWT Token
    │   • Check signature
    │   • Check expiration
    │   • Extract user data
    │
    ├─► Valid? ──► Continue to Controller
    │
    └─► Invalid? ──► Return 401 Unauthorized
```

---

## Error Handling Flow

```
Error Source              Error Handler              User Feedback
    │                         │                          │
    ├─► Validation Error     │                          │
    │   (missing fields)     │                          │
    │                         │                          │
    ├─► Business Logic Error │                          │
    │   (insufficient stock) │                          │
    │                         │                          │
    ├─► Database Error       │                          │
    │   (duplicate key)      │                          │
    │                         │                          │
    └───────────────────────►│                          │
                              │                          │
                     ┌────────▼────────┐                │
                     │  Backend         │                │
                     │  try/catch       │                │
                     │  next(error)     │                │
                     └────────┬────────┘                │
                              │                          │
                     ┌────────▼────────┐                │
                     │  Global Error    │                │
                     │  Handler         │                │
                     │  (middleware)    │                │
                     └────────┬────────┘                │
                              │                          │
                     ┌────────▼────────┐                │
                     │  HTTP Response   │                │
                     │  { success:false,│                │
                     │    message:"..." }                │
                     └────────┬────────┘                │
                              │                          │
                     ┌────────▼────────┐                │
                     │  Redux Thunk     │                │
                     │  .rejected       │                │
                     └────────┬────────┘                │
                              │                          │
                     ┌────────▼────────┐        ┌───────▼────────┐
                     │  Update State    │        │  Toast         │
                     │  error: message  │        │  Notification  │
                     └──────────────────┘        │  (error)       │
                                                  └───────┬────────┘
                                                          │
                                                          ▼
                                                    User sees error
```

---

## Performance Optimization

```
┌───────────────────────────────────────────────────────────┐
│                  Performance Strategies                    │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend:                                                 │
│  • Redux state caching                                     │
│  • Pagination (50 items per page)                         │
│  • Lazy loading of modals                                 │
│  • Debounced search (can be added)                        │
│  • Memoized calculations                                   │
│                                                             │
│  Backend:                                                  │
│  • MongoDB indexes on frequently queried fields           │
│  • Lean queries (skip Mongoose overhead)                  │
│  • Pagination support                                      │
│  • Projection (select specific fields)                    │
│                                                             │
│  Database:                                                 │
│  • Compound indexes                                        │
│  • Index on currentStock for low stock queries           │
│  • Index on transactionDate for history                  │
│                                                             │
└───────────────────────────────────────────────────────────┘
```

---

This architecture provides a scalable, maintainable, and performant ingredient management system that integrates seamlessly with the existing Restaurant POS infrastructure.

