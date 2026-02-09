# Storage Management System Design Document

## Overview
A storage management system that allows tracking of inventory imports and exports. Imports automatically create spending records, and the system supports CRUD operations for import/export items.

## System Architecture

### Core Concepts
1. **Storage Items**: Master list of items that can be imported/exported (managed by Admin)
2. **Suppliers**: Master list of suppliers/vendors (managed by Admin, viewable by Members)
3. **Import Records**: Records of items being brought into storage (creates Spending record)
4. **Export Records**: Records of items being taken out of storage
5. **Integration**: Imports automatically create Spending records with "Ingredient" category

---

## Database Schema

### 1. StorageItem Model
Master list of items available for import/export.

```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  code: String (required, unique, uppercase),
  description: String,
  category: String (default: "Ingredient"),
  unit: String (required, enum: ['kg', 'g', 'liter', 'ml', 'piece', 'pack', 'box', 'bag']),
  currentStock: Number (default: 0, min: 0),
  minStock: Number (default: 0, min: 0),
  maxStock: Number (default: 1000, min: 0),
  averageCost: Number (default: 0, min: 0), // Weighted average cost
  lastPurchaseCost: Number (default: 0, min: 0),
  isActive: Boolean (default: true),
  createdBy: {
    userId: ObjectId (ref: 'User'),
    userName: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `name`: unique
- `code`: unique
- `category`: for filtering

### 2. Supplier Model
Master list of suppliers/vendors for imports.

```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  code: String (optional, unique, uppercase), // Optional supplier code
  email: String,
  phone: String,
  address: String,
  taxId: String, // Tax identification number
  notes: String,
  isActive: Boolean (default: true),
  createdBy: {
    userId: ObjectId (ref: 'User'),
    userName: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `name`: unique
- `code`: unique (if provided)
- `isActive`: for filtering active suppliers

**Note:** This is separate from the existing Vendor model in Spending system. Suppliers are specifically for storage imports, while Vendors can be used for general spending. They can be linked if needed in the future.

### 3. StorageImport Model
Records of items imported into storage.

```javascript
{
  _id: ObjectId,
  importNumber: String (required, unique), // Format: IMP-YYYYMMDD-XXXXX
  storageItemId: ObjectId (required, ref: 'StorageItem'),
  quantity: Number (required, min: 0),
  unit: String (required), // Should match StorageItem unit
  unitCost: Number (required, min: 0),
  totalCost: Number (required, min: 0), // quantity * unitCost (auto-calculated)
  supplierId: ObjectId (ref: 'Supplier'), // Reference to Supplier model
  supplierName: String, // Denormalized for quick access
  supplierInvoice: String,
  notes: String,
  spendingId: ObjectId (ref: 'Spending'), // Auto-created spending record
  status: String (enum: ['pending', 'completed', 'cancelled'], default: 'pending'),
  importedBy: {
    userId: ObjectId (ref: 'User'),
    userName: String
  },
  importDate: Date (default: Date.now),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `importNumber`: unique
- `storageItemId`: for filtering by item
- `supplierId`: for filtering by supplier
- `importDate`: for date range queries
- `status`: for filtering

### 4. StorageExport Model
Records of items exported from storage.

```javascript
{
  _id: ObjectId,
  exportNumber: String (required, unique), // Format: EXP-YYYYMMDD-XXXXX
  storageItemId: ObjectId (required, ref: 'StorageItem'),
  quantity: Number (required, min: 0),
  unit: String (required), // Should match StorageItem unit
  reason: String (enum: ['production', 'waste', 'damage', 'theft', 'transfer', 'other']),
  notes: String,
  status: String (enum: ['pending', 'completed', 'cancelled'], default: 'pending'),
  exportedBy: {
    userId: ObjectId (ref: 'User'),
    userName: String
  },
  exportDate: Date (default: Date.now),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `exportNumber`: unique
- `storageItemId`: for filtering by item
- `exportDate`: for date range queries
- `status`: for filtering
- `reason`: for filtering by reason

---

## API Endpoints

### Storage Items (Admin Only)

#### Create Storage Item
```
POST /api/storage/item
Headers: Authorization: Bearer <token>
Body: {
  name: String (required),
  code: String (required),
  description: String,
  category: String,
  unit: String (required),
  minStock: Number,
  maxStock: Number,
  averageCost: Number
}
Response: { success: true, data: StorageItem }
```

#### Get All Storage Items
```
GET /api/storage/item
Headers: Authorization: Bearer <token>
Query Params:
  - category: String (filter by category)
  - isActive: Boolean (filter by active status)
  - search: String (search by name or code)
  - page: Number (default: 1)
  - limit: Number (default: 50)
  - sortBy: String (default: 'name')
  - sortOrder: String ('asc' | 'desc')
Response: { success: true, data: [StorageItem], pagination: {...} }
```

#### Get Storage Item by ID
```
GET /api/storage/item/:id
Headers: Authorization: Bearer <token>
Response: { success: true, data: StorageItem }
```

#### Update Storage Item
```
PUT /api/storage/item/:id
Headers: Authorization: Bearer <token>
Body: {
  name: String,
  code: String,
  description: String,
  category: String,
  unit: String,
  minStock: Number,
  maxStock: Number,
  averageCost: Number,
  isActive: Boolean
}
Response: { success: true, data: StorageItem }
```

#### Delete Storage Item (Soft Delete)
```
DELETE /api/storage/item/:id
Headers: Authorization: Bearer <token>
Response: { success: true, message: "Storage item deleted successfully" }
Note: Sets isActive to false, doesn't actually delete
```

#### Get Low Stock Items
```
GET /api/storage/item/low-stock
Headers: Authorization: Bearer <token>
Response: { success: true, data: [StorageItem] }
Note: Returns items where currentStock <= minStock
```

### Supplier Management (Admin Only)

#### Create Supplier
```
POST /api/storage/supplier
Headers: Authorization: Bearer <token>
Body: {
  name: String (required),
  code: String (optional, unique if provided),
  email: String,
  phone: String,
  address: String,
  taxId: String,
  notes: String
}
Response: { success: true, data: Supplier }
```

#### Get All Suppliers
```
GET /api/storage/supplier
Headers: Authorization: Bearer <token>
Query Params:
  - isActive: Boolean (filter by active status)
  - search: String (search by name or code)
  - page: Number (default: 1)
  - limit: Number (default: 50)
  - sortBy: String (default: 'name')
  - sortOrder: String ('asc' | 'desc')
Response: { success: true, data: [Supplier], pagination: {...} }
Note: Members can access this endpoint (read-only)
```

#### Get Active Suppliers Only (For Import Dropdown)
```
GET /api/storage/supplier/active
Headers: Authorization: Bearer <token>
Response: { success: true, data: [Supplier] }
Note: Returns only active suppliers, simplified list for dropdowns
      Accessible by Members + Admin
```

#### Get Supplier by ID
```
GET /api/storage/supplier/:id
Headers: Authorization: Bearer <token>
Response: { success: true, data: Supplier }
Note: Members can access this endpoint (read-only)
```

#### Update Supplier
```
PUT /api/storage/supplier/:id
Headers: Authorization: Bearer <token>
Body: {
  name: String,
  code: String,
  email: String,
  phone: String,
  address: String,
  taxId: String,
  notes: String,
  isActive: Boolean
}
Response: { success: true, data: Supplier }
```

#### Delete Supplier (Soft Delete)
```
DELETE /api/storage/supplier/:id
Headers: Authorization: Bearer <token>
Response: { success: true, message: "Supplier deleted successfully" }
Note: Sets isActive to false, doesn't actually delete
      Cannot delete if supplier has active imports
```

### Storage Imports (Members + Admin)

#### Create Import Record
```
POST /api/storage/import
Headers: Authorization: Bearer <token>
Body: {
  storageItemId: ObjectId (required),
  quantity: Number (required, min: 0),
  unitCost: Number (required, min: 0),
  supplierId: ObjectId (optional, ref: 'Supplier'),
  supplierInvoice: String,
  notes: String
}
Note: totalCost is auto-calculated on backend (quantity * unitCost)
Response: { success: true, data: StorageImport, spending: Spending }
Note: 
  - Auto-generates importNumber
  - Calculates totalCost (quantity * unitCost)
  - If supplierId provided, populates supplierName from Supplier model
  - Creates Spending record with category "Ingredient"
  - Updates StorageItem.currentStock and averageCost
```

#### Get All Import Records
```
GET /api/storage/import
Headers: Authorization: Bearer <token>
Query Params:
  - storageItemId: ObjectId (filter by item)
  - status: String (filter by status)
  - startDate: Date (ISO string)
  - endDate: Date (ISO string)
  - page: Number (default: 1)
  - limit: Number (default: 50)
Response: { success: true, data: [StorageImport], pagination: {...} }
Note: Populates storageItemId, supplierId, and importedBy
```

#### Get Import Record by ID
```
GET /api/storage/import/:id
Headers: Authorization: Bearer <token>
Response: { success: true, data: StorageImport }
Note: Populates storageItemId, supplierId, importedBy, spendingId
```

#### Update Import Record
```
PUT /api/storage/import/:id
Headers: Authorization: Bearer <token>
Body: {
  quantity: Number,
  unitCost: Number,
  supplierId: ObjectId,
  supplierInvoice: String,
  notes: String,
  status: String
}
Note: totalCost is auto-calculated on backend if quantity or unitCost changes
Response: { success: true, data: StorageImport }
Note: 
  - If quantity or unitCost changes, updates totalCost
  - If status changes to 'completed', updates stock
  - Updates Spending record if linked
```

#### Cancel Import Record
```
PATCH /api/storage/import/:id/cancel
Headers: Authorization: Bearer <token>
Response: { success: true, data: StorageImport }
Note: Sets status to 'cancelled', reverses stock changes if completed
```

### Storage Exports (Members + Admin)

#### Create Export Record
```
POST /api/storage/export
Headers: Authorization: Bearer <token>
Body: {
  storageItemId: ObjectId (required),
  quantity: Number (required, min: 0),
  reason: String (required, enum: ['production', 'waste', 'damage', 'theft', 'transfer', 'other']),
  notes: String
}
Response: { success: true, data: StorageExport }
Note: 
  - Auto-generates exportNumber
  - Validates sufficient stock available
  - Updates StorageItem.currentStock when status is 'completed'
```

#### Get All Export Records
```
GET /api/storage/export
Headers: Authorization: Bearer <token>
Query Params:
  - storageItemId: ObjectId (filter by item)
  - status: String (filter by status)
  - reason: String (filter by reason)
  - startDate: Date (ISO string)
  - endDate: Date (ISO string)
  - page: Number (default: 1)
  - limit: Number (default: 50)
Response: { success: true, data: [StorageExport], pagination: {...} }
Note: Populates storageItemId and exportedBy
```

#### Get Export Record by ID
```
GET /api/storage/export/:id
Headers: Authorization: Bearer <token>
Response: { success: true, data: StorageExport }
Note: Populates storageItemId and exportedBy
```

#### Update Export Record
```
PUT /api/storage/export/:id
Headers: Authorization: Bearer <token>
Body: {
  quantity: Number,
  reason: String,
  notes: String,
  status: String
}
Response: { success: true, data: StorageExport }
Note: 
  - Validates stock availability if quantity changes
  - Updates stock when status changes to 'completed'
```

#### Cancel Export Record
```
PATCH /api/storage/export/:id/cancel
Headers: Authorization: Bearer <token>
Response: { success: true, data: StorageExport }
Note: Sets status to 'cancelled', reverses stock changes if completed
```

### Storage Dashboard/Statistics (Admin Only)

#### Get Storage Summary
```
GET /api/storage/summary
Headers: Authorization: Bearer <token>
Query Params:
  - startDate: Date (ISO string)
  - endDate: Date (ISO string)
Response: {
  success: true,
  data: {
    totalItems: Number,
    lowStockItems: Number,
    totalImports: Number,
    totalExports: Number,
    totalImportValue: Number,
    totalExportValue: Number,
    recentImports: [StorageImport],
    recentExports: [StorageExport]
  }
}
```

---

## Frontend Structure

### Redux Slices

#### 1. supplierSlice.js
```javascript
// State structure
{
  suppliers: [],
  activeSuppliers: [], // Simplified list for dropdowns
  selectedSupplier: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0
  },
  filters: {
    isActive: true,
    search: ''
  }
}

// Actions:
- fetchSuppliers(params) // Admin: full list, Members: read-only
- fetchActiveSuppliers() // Simplified list for dropdowns (Members + Admin)
- fetchSupplierById(id)
- createSupplier(data) // Admin only
- updateSupplier({ id, data }) // Admin only
- deleteSupplier(id) // Admin only
- clearError()
```

#### 2. storageItemSlice.js
```javascript
// State structure
{
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0
  },
  filters: {
    category: '',
    isActive: true,
    search: ''
  }
}

// Actions:
- fetchStorageItems(params)
- fetchStorageItemById(id)
- createStorageItem(data)
- updateStorageItem({ id, data })
- deleteStorageItem(id)
- fetchLowStockItems()
- clearError()
```

#### 3. storageImportSlice.js
```javascript
// State structure
{
  imports: [],
  selectedImport: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0
  },
  filters: {
    storageItemId: '',
    status: '',
    startDate: '',
    endDate: ''
  }
}

// Actions:
- fetchImports(params)
- fetchImportById(id)
- createImport(data)
- updateImport({ id, data })
- cancelImport(id)
- clearError()
```

#### 4. storageExportSlice.js
```javascript
// State structure
{
  exports: [],
  selectedExport: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0
  },
  filters: {
    storageItemId: '',
    status: '',
    reason: '',
    startDate: '',
    endDate: ''
  }
}

// Actions:
- fetchExports(params)
- fetchExportById(id)
- createExport(data)
- updateExport({ id, data })
- cancelExport(id)
- clearError()
```

### API Functions (src/https/storageApi.js)

```javascript
// Suppliers
export const getSuppliers = (params) => axiosWrapper.get("/api/storage/supplier", { params });
export const getActiveSuppliers = () => axiosWrapper.get("/api/storage/supplier/active");
export const getSupplierById = (id) => axiosWrapper.get(`/api/storage/supplier/${id}`);
export const createSupplier = (data) => axiosWrapper.post("/api/storage/supplier", data);
export const updateSupplier = ({ id, ...data }) => axiosWrapper.put(`/api/storage/supplier/${id}`, data);
export const deleteSupplier = (id) => axiosWrapper.delete(`/api/storage/supplier/${id}`);

// Storage Items
export const getStorageItems = (params) => axiosWrapper.get("/api/storage/item", { params });
export const getStorageItemById = (id) => axiosWrapper.get(`/api/storage/item/${id}`);
export const createStorageItem = (data) => axiosWrapper.post("/api/storage/item", data);
export const updateStorageItem = ({ id, ...data }) => axiosWrapper.put(`/api/storage/item/${id}`, data);
export const deleteStorageItem = (id) => axiosWrapper.delete(`/api/storage/item/${id}`);
export const getLowStockItems = () => axiosWrapper.get("/api/storage/item/low-stock");

// Storage Imports
export const getStorageImports = (params) => axiosWrapper.get("/api/storage/import", { params });
export const getStorageImportById = (id) => axiosWrapper.get(`/api/storage/import/${id}`);
export const createStorageImport = (data) => axiosWrapper.post("/api/storage/import", data);
export const updateStorageImport = ({ id, ...data }) => axiosWrapper.put(`/api/storage/import/${id}`, data);
export const cancelStorageImport = (id) => axiosWrapper.patch(`/api/storage/import/${id}/cancel");

// Storage Exports
export const getStorageExports = (params) => axiosWrapper.get("/api/storage/export", { params });
export const getStorageExportById = (id) => axiosWrapper.get(`/api/storage/export/${id}`);
export const createStorageExport = (data) => axiosWrapper.post("/api/storage/export", data);
export const updateStorageExport = ({ id, ...data }) => axiosWrapper.put(`/api/storage/export/${id}`, data);
export const cancelStorageExport = (id) => axiosWrapper.patch(`/api/storage/export/${id}/cancel`);

// Storage Summary (Admin only)
export const getStorageSummary = (params) => axiosWrapper.get("/api/storage/summary", { params });
```

### Pages

#### 1. Suppliers.jsx (Admin Only)
- Location: `src/pages/Suppliers.jsx`
- Access: Admin only
- Features:
  - CRUD operations for suppliers
  - List view with filters (active status, search)
  - Supplier details view
  - Can view contact information, address, etc.

#### 2. Storage.jsx (Main Page)
- Location: `src/pages/Storage.jsx`
- Access: Members + Admin
- Features:
  - Tab navigation: "Imports", "Exports"
  - Filter and search functionality
  - List view of imports/exports
  - Action buttons: "New Import", "New Export"
  - Admin-only: "Manage Items" button

#### 3. StorageItems.jsx (Admin Only)
- Location: `src/pages/StorageItems.jsx`
- Access: Admin only
- Features:
  - CRUD operations for storage items
  - List view with filters (category, active status, search)
  - Low stock indicator
  - Stock level management

### Components

#### 1. SupplierModal.jsx
- Location: `src/components/storage/SupplierModal.jsx`
- Props:
  - `isOpen: Boolean`
  - `onClose: Function`
  - `onSuccess: Function`
  - `editingSupplier: Supplier | null` (for edit mode)
- Features:
  - Name, code fields
  - Contact information (email, phone)
  - Address field
  - Tax ID field
  - Notes field
  - Active status toggle (admin only)
  - Form validation

#### 2. ImportModal.jsx
- Location: `src/components/storage/ImportModal.jsx`
- Props:
  - `isOpen: Boolean`
  - `onClose: Function`
  - `onSuccess: Function`
  - `editingImport: StorageImport | null` (for edit mode)
- Features:
  - Storage item selection dropdown (populated from storage items)
  - Quantity input
  - Unit cost input
  - **Total cost display** (auto-calculated: quantity × unitCost, updates in real-time)
  - **Supplier selection dropdown** (populated from active suppliers list)
  - Supplier invoice number field
  - Notes field
  - Creates one import record per submission
  - Shows supplier details when supplier is selected
  - Real-time total cost calculation as user types

#### 3. ExportModal.jsx
- Location: `src/components/storage/ExportModal.jsx`
- Props:
  - `isOpen: Boolean`
  - `onClose: Function`
  - `onSuccess: Function`
  - `editingExport: StorageExport | null` (for edit mode)
- Features:
  - Storage item selection dropdown (populated from storage items)
  - Shows current stock for selected item
  - Quantity input (validates against available stock)
  - Reason dropdown (production, waste, damage, theft, transfer, other)
  - Notes field
  - Creates one export record per submission

#### 4. StorageItemModal.jsx
- Location: `src/components/storage/StorageItemModal.jsx`
- Props:
  - `isOpen: Boolean`
  - `onClose: Function`
  - `onSuccess: Function`
  - `editingItem: StorageItem | null` (for edit mode)
- Features:
  - Name, code, description fields
  - Category selection
  - Unit selection
  - Stock levels (min, max, current)
  - Cost fields (average cost, last purchase cost)
  - Active status toggle

#### 5. ImportList.jsx
- Location: `src/components/storage/ImportList.jsx`
- Features:
  - Table/list view of imports
  - Filters (item, supplier, status, date range)
  - Pagination
  - Actions: View, Edit, Cancel
  - Shows import number, item name, supplier name, quantity, cost, date, status
  - Clickable supplier name to view supplier details

#### 6. ExportList.jsx
- Location: `src/components/storage/ExportList.jsx`
- Features:
  - Table/list view of exports
  - Filters (item, status, reason, date range)
  - Pagination
  - Actions: View, Edit, Cancel
  - Shows export number, item name, quantity, reason, date, status

### Routes

#### Add to constants/index.js
```javascript
export const ROUTES = {
  // ... existing routes
  STORAGE: "/storage",
  STORAGE_ITEMS: "/storage/items",
  SUPPLIERS: "/storage/suppliers"
};

export const PROTECTED_ROUTES = [
  // ... existing routes
  {
    path: ROUTES.STORAGE,
    componentName: "Storage"
  },
  {
    path: ROUTES.STORAGE_ITEMS,
    componentName: "StorageItems",
    adminOnly: true
  },
  {
    path: ROUTES.SUPPLIERS,
    componentName: "Suppliers",
    adminOnly: true
  }
];
```

### Navigation Updates

#### Dashboard.jsx
- Add "Storage" button for Members + Admin
- Add "Storage Items" button for Admin only (in admin section)
- Add "Suppliers" button for Admin only (in admin section)

#### Header/BottomNav
- Add Storage link/icon for Members + Admin

---

## Business Logic

### Import Process Flow

1. **User creates import record:**
   - Selects storage item from dropdown
   - Enters quantity and unit cost
   - **UI auto-calculates and displays total cost** (quantity × unitCost) in real-time
   - **Selects supplier from dropdown** (populated from active suppliers)
   - Optionally adds supplier invoice number
   - Adds notes if needed
   - Submits form

2. **Backend processes import:**
   - Generates unique import number (IMP-YYYYMMDD-XXXXX)
   - Calculates total cost (quantity × unitCost)
   - If supplierId provided:
     - Fetches supplier details
     - Populates supplierName field
   - Creates StorageImport record with status 'pending'
   - Creates Spending record:
     - Category: "Ingredient" (default)
     - Amount: totalCost
     - Vendor: Links to Supplier if supplierId provided (or uses supplierName)
     - Vendor Name: supplierName from Supplier model
     - Payment status: "paid" (assumes immediate payment)
     - Links spendingId to StorageImport
   - Updates StorageItem:
     - currentStock += quantity
     - Recalculates averageCost (weighted average)
     - Updates lastPurchaseCost
   - Sets import status to 'completed'

3. **Response:**
   - Returns StorageImport with populated fields (including supplier details)
   - Returns created Spending record

### Export Process Flow

1. **User creates export record:**
   - Selects storage item from dropdown
   - System shows current stock
   - Enters quantity (validated against available stock)
   - Selects reason from dropdown
   - Adds notes if needed
   - Submits form

2. **Backend processes export:**
   - Generates unique export number (EXP-YYYYMMDD-XXXXX)
   - Validates sufficient stock available
   - Creates StorageExport record with status 'pending'
   - Updates StorageItem:
     - currentStock -= quantity
   - Sets export status to 'completed'

3. **Response:**
   - Returns StorageExport with populated fields

### Stock Management

- **Current Stock Calculation:**
  - Initial: Set manually or via first import
  - Updates: Automatically updated on import/export completion
  - Formula: `currentStock = previousStock + importQuantity - exportQuantity`

- **Average Cost Calculation (Weighted Average):**
  ```
  newAverageCost = (
    (currentStock × currentAverageCost) + (importQuantity × importUnitCost)
  ) / (currentStock + importQuantity)
  ```

- **Low Stock Alert:**
  - Triggered when `currentStock <= minStock`
  - Available via API endpoint
  - Can be displayed in UI with warning indicators

---

## Integration Points

### With Spending System

1. **Automatic Spending Creation:**
   - Every import creates a Spending record
   - Spending category defaults to "Ingredient"
   - Spending amount = import totalCost
   - Spending vendor = Links to Supplier model if supplierId provided
   - Spending vendorName = supplierName from Supplier model
   - Spending payment status = "paid"
   - Spending payment method = "Cash" (default, can be updated)
   - Spending date = import date

2. **Spending Record Fields:**
   - `title`: "Import: {StorageItem.name}"
   - `amount`: Import totalCost
   - `category`: "Ingredient" (ObjectId reference to SpendingCategory)
   - `vendor`: ObjectId reference to Supplier model (if supplierId provided)
   - `vendorName`: Supplier name (denormalized for quick access)
   - `paymentStatus`: "paid"
   - `paymentMethod`: "Cash"
   - `paymentDate`: Import date
   - `notes`: Import notes + import number reference

---

## Permissions & Access Control

### Admin Access
- Full CRUD on Suppliers
- Full CRUD on Storage Items
- Full CRUD on Imports
- Full CRUD on Exports
- Access to Storage Summary/Dashboard
- Can cancel any import/export
- Can view all imports/exports

### Member Access
- View Suppliers (read-only, for dropdown selection)
- View Storage Items (read-only)
- Create Import records (can select from supplier list)
- Create Export records
- View own imports/exports
- Update own pending imports/exports
- Cancel own pending imports/exports

### Middleware Requirements
- `isVerifiedUser`: Required for all storage endpoints
- `isAdmin`: Required for Storage Items CRUD and Summary endpoints
- Members can access import/export endpoints

---

## Validation Rules

### Storage Item
- Name: Required, unique, min 2 characters
- Code: Required, unique, uppercase, alphanumeric
- Unit: Required, must be valid enum value
- Min/Max Stock: Must be >= 0, maxStock >= minStock
- Average Cost: Must be >= 0

### Import
- Storage Item: Required, must exist and be active
- Quantity: Required, must be > 0
- Unit Cost: Required, must be >= 0
- Supplier: Optional, if provided must exist and be active
- Total Cost: Auto-calculated, must match quantity × unitCost
- Import Date: Defaults to current date, cannot be future date

### Supplier
- Name: Required, unique, min 2 characters
- Code: Optional, if provided must be unique, uppercase, alphanumeric
- Email: Optional, must be valid email format if provided
- Phone: Optional, must be valid phone format if provided
- Tax ID: Optional, must be unique if provided

### Export
- Storage Item: Required, must exist and be active
- Quantity: Required, must be > 0, must not exceed currentStock
- Reason: Required, must be valid enum value
- Export Date: Defaults to current date, cannot be future date

---

## Error Handling

### Common Error Scenarios

1. **Insufficient Stock (Export):**
   - Error: "Insufficient stock available. Current stock: {currentStock}, Required: {quantity}"
   - HTTP Status: 400

2. **Duplicate Item Code:**
   - Error: "Storage item with this code already exists"
   - HTTP Status: 400

3. **Item Not Found:**
   - Error: "Storage item not found"
   - HTTP Status: 404

4. **Invalid Status Transition:**
   - Error: "Cannot change status from {currentStatus} to {newStatus}"
   - HTTP Status: 400

5. **Unauthorized Access:**
   - Error: "Access denied. Admin privileges required"
   - HTTP Status: 403

6. **Supplier Has Active Imports:**
   - Error: "Cannot delete supplier. Supplier has {count} import record(s). Please deactivate instead."
   - HTTP Status: 400
   - Note: When deleting supplier, check if it has any imports. If yes, prevent deletion and suggest setting isActive to false instead.

---

## UI/UX Considerations

### Import/Export Modal Design
- Clean, single-column form layout
- Storage item dropdown with search/filter capability
- Real-time validation feedback
- Auto-calculation display (total cost for imports)
- Stock availability indicator (for exports)
- Clear action buttons (Save, Cancel)

### List Views
- Sortable columns
- Filterable by multiple criteria
- Pagination for large datasets
- Status badges (pending, completed, cancelled)
- Quick actions (view, edit, cancel)
- Export to CSV functionality (future)

### Mobile Responsiveness
- Touch-friendly form inputs
- Collapsible filters
- Swipe actions for list items
- Bottom sheet modals on mobile

---

## Future Enhancements

1. **Barcode Scanning**: Support for barcode scanning for items
2. **Batch Management**: Track batches with expiry dates
3. **Transfer Between Locations**: Multi-location inventory management
4. **Reports & Analytics**: 
   - Import/export trends
   - Cost analysis
   - Stock movement reports
5. **Notifications**: Low stock alerts
6. **Bulk Operations**: Import/export multiple items at once
7. **Integration with Suppliers**: Enhanced supplier performance tracking and analytics
8. **Inventory Valuation**: FIFO, LIFO costing methods

---

## Implementation Checklist

### Backend
- [ ] Create Supplier model
- [ ] Create StorageItem model
- [ ] Create StorageImport model
- [ ] Create StorageExport model
- [ ] Create supplier controller
- [ ] Create storage item controller
- [ ] Create storage import controller
- [ ] Create storage export controller
- [ ] Create storage routes (including supplier routes)
- [ ] Register routes in app.js
- [ ] Add middleware for permissions
- [ ] Implement spending integration
- [ ] Add validation logic
- [ ] Add stock calculation logic
- [ ] Add average cost calculation
- [ ] Link imports to suppliers
- [ ] Write unit tests

### Frontend
- [ ] Create supplierSlice
- [ ] Create storageItemSlice
- [ ] Create storageImportSlice
- [ ] Create storageExportSlice
- [ ] Create storageApi.js (including supplier APIs)
- [ ] Create Suppliers.jsx page (admin)
- [ ] Create Storage.jsx page
- [ ] Create StorageItems.jsx page (admin)
- [ ] Create SupplierModal component
- [ ] Create ImportModal component (with supplier dropdown)
- [ ] Create ExportModal component
- [ ] Create StorageItemModal component
- [ ] Create ImportList component
- [ ] Create ExportList component
- [ ] Add routes to constants
- [ ] Update navigation
- [ ] Add to Redux store
- [ ] Style components
- [ ] Add error handling
- [ ] Add loading states
- [ ] Implement supplier dropdown in ImportModal

### Integration
- [ ] Test supplier CRUD operations
- [ ] Test supplier dropdown in import modal
- [ ] Test import → spending creation with supplier
- [ ] Test stock updates
- [ ] Test average cost calculation
- [ ] Test permissions (admin vs member)
- [ ] Test validation rules
- [ ] Test error scenarios
- [ ] Test supplier deletion (should prevent if has imports)

---

## Notes

- All monetary values stored as Numbers (not strings)
- Dates stored as ISO Date objects
- Stock quantities can be decimal (for items like liters, kg)
- Import/Export numbers are auto-generated and unique
- Spending category "Ingredient" should exist in SpendingCategory collection
- Consider adding indexes for performance on frequently queried fields
- **Supplier Management:**
  - Suppliers are separate from the existing Vendor model in Spending system
  - Suppliers are specifically for storage imports
  - Can be linked to Vendor model in the future if needed
  - Members can view suppliers in dropdown but cannot modify them
  - Admin has full CRUD access to suppliers
  - Supplier deletion is prevented if supplier has import records (soft delete by setting isActive to false instead)

---

**Document Version:** 1.2  
**Created:** January 2025  
**Last Updated:** January 2025  
**Changes in v1.2:** 
- Simplified Supplier model (removed paymentTerms, country, city, contactPerson)
- Simplified Import model (removed batchNumber, expiryDate)
- Simplified Export model (removed destination, orderId)
- Added real-time totalCost calculation in ImportModal UI
- Added Storage Analytics tab in Dashboard
- Added Storage Analytics API endpoints
