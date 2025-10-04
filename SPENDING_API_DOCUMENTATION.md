# Spending Management API Documentation

## Overview

The Spending Management API provides comprehensive expense tracking, vendor management, and financial analytics for your Restaurant POS System. It includes features for categorizing expenses, managing vendors, tracking payments, and generating detailed financial reports.

## Base URL
```
http://localhost:3000/api/spending
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📊 Spending Records

### Create Spending Record
**POST** `/api/spending`

Create a new spending record with comprehensive tracking capabilities.

#### Request Body
```json
{
  "title": "Office Supplies Purchase",
  "description": "Monthly office supplies for restaurant",
  "amount": 150000,
  "currency": "VND",
  "category": "64f8a1b2c3d4e5f6789012ab",
  "subcategory": "Stationery",
  "vendor": "64f8a1b2c3d4e5f6789012cd",
  "vendorName": "Office Mart",
  "spendingDate": "2024-01-15T10:30:00Z",
  "dueDate": "2024-01-30T23:59:59Z",
  "paymentStatus": "pending",
  "paymentMethod": "bank_transfer",
  "receiptNumber": "RCP-2024-001",
  "invoiceNumber": "INV-2024-001",
  "taxAmount": 15000,
  "taxRate": 10,
  "isDeductible": true,
  "isRecurring": false,
  "approvalStatus": "approved",
  "tags": ["office", "monthly", "supplies"],
  "notes": "Regular monthly purchase"
}
```

#### Response
```json
{
  "success": true,
  "message": "Spending record created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6789012ef",
    "title": "Office Supplies Purchase",
    "amount": 150000,
    "totalAmount": 165000,
    "category": {
      "_id": "64f8a1b2c3d4e5f6789012ab",
      "name": "Office Supplies",
      "color": "#64748B"
    },
    "vendor": {
      "_id": "64f8a1b2c3d4e5f6789012cd",
      "name": "Office Mart",
      "phone": "+84 123 456 789"
    },
    "paymentStatus": "pending",
    "daysUntilDue": 15,
    "isOverdue": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get All Spending Records
**GET** `/api/spending`

Retrieve spending records with advanced filtering and pagination.

#### Query Parameters
- `startDate` (string): Filter by start date (YYYY-MM-DD)
- `endDate` (string): Filter by end date (YYYY-MM-DD)
- `category` (string): Filter by category ID
- `vendor` (string): Filter by vendor ID
- `paymentStatus` (string): Filter by payment status (pending, paid, overdue, cancelled)
- `approvalStatus` (string): Filter by approval status (draft, pending_approval, approved, rejected)
- `status` (string): Filter by record status (active, cancelled, refunded)
- `tags` (string): Comma-separated tags to filter by
- `isRecurring` (boolean): Filter recurring expenses
- `page` (number): Page number (default: 1)
- `limit` (number): Records per page (default: 50)
- `sortBy` (string): Sort field (default: spendingDate)
- `sortOrder` (string): Sort order (asc/desc, default: desc)

#### Example Request
```
GET /api/spending?startDate=2024-01-01&endDate=2024-01-31&category=all&paymentStatus=pending&page=1&limit=20
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6789012ef",
      "title": "Office Supplies Purchase",
      "amount": 150000,
      "totalAmount": 165000,
      "category": {
        "name": "Office Supplies",
        "color": "#64748B"
      },
      "vendor": {
        "name": "Office Mart"
      },
      "paymentStatus": "pending",
      "spendingDate": "2024-01-15T10:30:00Z",
      "daysUntilDue": 15,
      "isOverdue": false
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 95,
    "hasNextPage": true,
    "hasPrevPage": false,
    "limit": 20
  },
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "category": "all",
    "paymentStatus": "pending"
  }
}
```

### Get Spending Record by ID
**GET** `/api/spending/:id`

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6789012ef",
    "title": "Office Supplies Purchase",
    "description": "Monthly office supplies for restaurant",
    "amount": 150000,
    "totalAmount": 165000,
    "category": {
      "_id": "64f8a1b2c3d4e5f6789012ab",
      "name": "Office Supplies",
      "description": "Stationery, printing, and administrative supplies",
      "color": "#64748B"
    },
    "vendor": {
      "_id": "64f8a1b2c3d4e5f6789012cd",
      "name": "Office Mart",
      "contactPerson": "John Doe",
      "phone": "+84 123 456 789",
      "email": "contact@officemart.vn"
    },
    "spendingDate": "2024-01-15T10:30:00Z",
    "dueDate": "2024-01-30T23:59:59Z",
    "paymentStatus": "pending",
    "daysUntilDue": 15,
    "isOverdue": false,
    "tags": ["office", "monthly", "supplies"],
    "attachments": [],
    "createdBy": {
      "userName": "Admin User"
    }
  }
}
```

### Update Spending Record
**PUT** `/api/spending/:id`

#### Request Body
```json
{
  "paymentStatus": "paid",
  "paymentDate": "2024-01-20T14:30:00Z",
  "paymentReference": "TXN-2024-001",
  "notes": "Payment completed via bank transfer"
}
```

### Delete Spending Record
**DELETE** `/api/spending/:id`

---

## 🏷️ Categories

### Create Spending Category
**POST** `/api/spending/categories`

#### Request Body
```json
{
  "name": "Marketing & Advertising",
  "description": "Promotional materials, advertising, and marketing campaigns",
  "color": "#F97316"
}
```

### Get All Categories
**GET** `/api/spending/categories`

#### Query Parameters
- `isActive` (boolean): Filter by active status

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6789012ab",
      "name": "Food & Ingredients",
      "description": "Raw materials, ingredients, and food supplies",
      "color": "#10B981",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Update Category
**PUT** `/api/spending/categories/:id`

### Delete Category
**DELETE** `/api/spending/categories/:id`

---

## 🏢 Vendors

### Create Vendor
**POST** `/api/spending/vendors`

#### Request Body
```json
{
  "name": "Fresh Market Suppliers",
  "contactPerson": "Nguyen Van A",
  "phone": "+84 123 456 789",
  "email": "contact@freshmarket.vn",
  "address": {
    "street": "123 Nguyen Trai Street",
    "city": "Ho Chi Minh City",
    "state": "Ho Chi Minh",
    "zipCode": "700000",
    "country": "Vietnam"
  },
  "taxId": "0123456789",
  "paymentTerms": "net_7",
  "notes": "Primary supplier for fresh vegetables and fruits"
}
```

### Get All Vendors
**GET** `/api/spending/vendors`

#### Query Parameters
- `isActive` (boolean): Filter by active status
- `search` (string): Search by name, contact person, or email

### Get Vendor by ID
**GET** `/api/spending/vendors/:id`

### Update Vendor
**PUT** `/api/spending/vendors/:id`

### Delete Vendor
**DELETE** `/api/spending/vendors/:id`

---

## 📈 Analytics & Reports

### Get Spending Dashboard
**GET** `/api/spending/analytics/dashboard`

Provides key metrics and recent data for dashboard display.

#### Response
```json
{
  "success": true,
  "data": {
    "monthlyStats": {
      "totalAmount": 5000000,
      "totalTax": 500000,
      "count": 45,
      "paidAmount": 3000000,
      "pendingAmount": 2000000
    },
    "yearlyStats": {
      "totalAmount": 50000000,
      "totalTax": 5000000,
      "count": 450
    },
    "recentSpending": [
      {
        "_id": "64f8a1b2c3d4e5f6789012ef",
        "title": "Office Supplies Purchase",
        "amount": 150000,
        "category": {
          "name": "Office Supplies",
          "color": "#64748B"
        },
        "vendor": {
          "name": "Office Mart"
        },
        "spendingDate": "2024-01-15T10:30:00Z"
      }
    ],
    "upcomingPayments": [
      {
        "_id": "64f8a1b2c3d4e5f6789012ef",
        "title": "Rent Payment",
        "amount": 2000000,
        "dueDate": "2024-01-31T23:59:59Z",
        "vendor": {
          "name": "Property Management"
        }
      }
    ],
    "topCategories": [
      {
        "_id": "64f8a1b2c3d4e5f6789012ab",
        "categoryName": "Food & Ingredients",
        "totalAmount": 2000000,
        "count": 15
      }
    ],
    "topVendors": [
      {
        "_id": "64f8a1b2c3d4e5f6789012cd",
        "vendorName": "Fresh Market Suppliers",
        "totalAmount": 1500000,
        "count": 12
      }
    ]
  }
}
```

### Get Detailed Analytics
**GET** `/api/spending/analytics/reports`

#### Query Parameters
- `startDate` (string): Start date for analysis
- `endDate` (string): End date for analysis
- `period` (string): Analysis period (month, quarter, year)

#### Response
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalAmount": 5000000,
      "totalTax": 500000,
      "totalWithTax": 5500000,
      "count": 45,
      "avgAmount": 111111
    },
    "spendingByCategory": [
      {
        "_id": "64f8a1b2c3d4e5f6789012ab",
        "categoryName": "Food & Ingredients",
        "totalAmount": 2000000,
        "totalTax": 200000,
        "count": 15,
        "avgAmount": 133333
      }
    ],
    "spendingByVendor": [
      {
        "_id": "64f8a1b2c3d4e5f6789012cd",
        "vendorName": "Fresh Market Suppliers",
        "totalAmount": 1500000,
        "totalTax": 150000,
        "count": 12,
        "avgAmount": 125000
      }
    ],
    "monthlyTrend": [
      {
        "_id": {
          "year": 2024,
          "month": 1
        },
        "totalAmount": 5000000,
        "totalTax": 500000,
        "count": 45
      }
    ],
    "paymentStatusBreakdown": [
      {
        "_id": "paid",
        "totalAmount": 3000000,
        "count": 25
      },
      {
        "_id": "pending",
        "totalAmount": 2000000,
        "count": 20
      }
    ],
    "overdueSpending": [
      {
        "_id": "64f8a1b2c3d4e5f6789012ef",
        "title": "Overdue Invoice",
        "amount": 500000,
        "dueDate": "2024-01-10T23:59:59Z",
        "vendor": {
          "name": "Supplier ABC"
        }
      }
    ]
  }
}
```

---

## 🔧 Setup Instructions

### 1. Seed Initial Data
Run the seeding script to populate categories and vendors:

```bash
cd pos-backend
node seeds/spendingSeeds.js
```

### 2. Environment Variables
Ensure your `.env` file includes:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 3. Test the API
You can test the endpoints using tools like Postman or curl:

```bash
# Get all categories
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/spending/categories

# Create a spending record
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Expense","amount":100000,"category":"CATEGORY_ID"}' \
     http://localhost:3000/api/spending
```

---

## 📋 Data Models

### Spending Record Schema
```javascript
{
  title: String (required),
  description: String,
  amount: Number (required),
  currency: String (default: 'VND'),
  category: ObjectId (required, ref: 'SpendingCategory'),
  subcategory: String,
  vendor: ObjectId (ref: 'Vendor'),
  vendorName: String,
  spendingDate: Date (default: now),
  dueDate: Date,
  paymentStatus: String (enum: pending, paid, overdue, cancelled),
  paymentMethod: String (enum: cash, bank_transfer, credit_card, etc.),
  paymentDate: Date,
  paymentReference: String,
  receiptNumber: String,
  invoiceNumber: String,
  taxAmount: Number (default: 0),
  taxRate: Number (default: 0),
  isDeductible: Boolean (default: true),
  isRecurring: Boolean (default: false),
  recurringPattern: Object,
  approvalStatus: String (enum: draft, pending_approval, approved, rejected),
  attachments: Array,
  tags: Array,
  status: String (enum: active, cancelled, refunded),
  notes: String,
  createdBy: Object,
  lastModifiedBy: Object
}
```

### Category Schema
```javascript
{
  name: String (required, unique),
  description: String,
  color: String (default: '#3B82F6'),
  isActive: Boolean (default: true)
}
```

### Vendor Schema
```javascript
{
  name: String (required),
  contactPerson: String,
  phone: String,
  email: String,
  address: Object,
  taxId: String,
  paymentTerms: String (enum: immediate, net_7, net_15, net_30, net_60, custom),
  customPaymentTerms: String,
  isActive: Boolean (default: true),
  notes: String
}
```

---

## 🚀 Features

### ✅ Core Features
- ✅ Complete CRUD operations for spending records
- ✅ Category management with color coding
- ✅ Vendor management with contact details
- ✅ Payment status tracking
- ✅ Due date monitoring with overdue detection
- ✅ Tax calculation and tracking
- ✅ Recurring expense support
- ✅ Approval workflow
- ✅ File attachment support
- ✅ Tag-based organization
- ✅ Advanced filtering and search
- ✅ Pagination for large datasets
- ✅ Comprehensive analytics and reporting
- ✅ Dashboard with key metrics
- ✅ Audit trail for changes

### 🔮 Future Enhancements
- 📧 Email notifications for due payments
- 📱 Mobile app integration
- 🔄 Automated recurring expense creation
- 📊 Advanced reporting with charts
- 💰 Budget planning and tracking
- 🔗 Integration with accounting software
- 📋 Expense approval workflows
- 🏦 Bank account reconciliation

---

## 🆘 Support

For questions or issues with the Spending Management API, please refer to the main project documentation or create an issue in the project repository.
