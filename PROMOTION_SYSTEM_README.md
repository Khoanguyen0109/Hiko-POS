# 🎯 Promotion Management System

A comprehensive promotion and discount management system for the Restaurant POS System.

## 📋 **Overview**

The Promotion Management System allows restaurant owners to create, manage, and track various types of promotions and discounts to boost sales and customer engagement.

## 🚀 **Features**

### **Promotion Types**
- **Order Percentage Discount** - Apply percentage discount to entire order (e.g., 10% off)
- **Order Fixed Amount** - Apply fixed amount discount to entire order (e.g., $5 off)
- **Item Percentage Discount** - Apply percentage discount to specific items
- **Item Fixed Amount** - Apply fixed amount discount to specific items
- **Happy Hour Specials** - Time-based discounts for specific items/categories

### **Advanced Conditions**
- **Time-based Rules** - Set specific time slots and days of the week
- **Order Amount Thresholds** - Minimum/maximum order requirements
- **Usage Limits** - Total and per-customer usage restrictions
- **Item/Category Targeting** - Apply to specific dishes or categories
- **Priority System** - Control promotion application order

### **Management Features**
- **CRUD Operations** - Create, read, update, delete promotions
- **Bulk Management** - Activate/deactivate multiple promotions
- **Analytics Dashboard** - Track promotion performance
- **Usage Tracking** - Monitor promotion usage and effectiveness
- **Coupon Codes** - Generate and manage promotional codes

## 🛠 **Installation & Setup**

### **Backend Setup**

1. **Database Model** - Already integrated with your MongoDB
2. **API Routes** - Available at `/api/promotion`
3. **Seed Sample Data** (Optional):
   ```bash
   cd pos-backend
   node seeds/promotionSeeds.js
   ```

### **Frontend Setup**

The promotion management interface is accessible at `/promotions` for Admin users.

**Navigation:**
- Header dropdown menu → "Promotions" (Admin only)
- Direct URL: `http://localhost:5173/promotions`

## 📊 **API Endpoints**

### **Promotion Management**
```http
POST   /api/promotion                    # Create promotion
GET    /api/promotion                    # Get all promotions (with filters)
GET    /api/promotion/:id                # Get specific promotion
PUT    /api/promotion/:id                # Update promotion
DELETE /api/promotion/:id                # Delete promotion
PATCH  /api/promotion/:id/toggle-status  # Toggle active/inactive
```

### **Analytics & Validation**
```http
GET    /api/promotion/analytics          # Get promotion analytics
POST   /api/promotion/validate-coupon    # Validate coupon code
```

### **Query Parameters for GET /api/promotion**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `isActive` - Filter by status (true/false)
- `type` - Filter by promotion type
- `search` - Search in name, description, or code

## 💡 **Usage Examples**

### **Example 1: Create 10% Order Discount**

```javascript
const promotion = {
  name: "10% Off All Orders",
  description: "Get 10% discount on your entire order",
  code: "SAVE10",
  type: "order_percentage",
  discount: { percentage: 10 },
  applicableItems: "all_order",
  conditions: { minOrderAmount: 20 },
  isActive: true,
  startDate: "2024-01-01",
  endDate: "2024-12-31"
};
```

### **Example 2: Create Happy Hour Promotion**

```javascript
const happyHour = {
  name: "Happy Hour - 25% Off Beverages",
  description: "25% off all beverages during happy hour",
  code: "HAPPYHOUR",
  type: "happy_hour",
  discount: { percentage: 25 },
  applicableItems: "categories",
  categories: ["beveragesCategoryId"],
  conditions: {
    timeSlots: [
      { start: "15:00", end: "17:00" },
      { start: "20:00", end: "22:00" }
    ],
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"]
  },
  isActive: true,
  startDate: "2024-01-01",
  endDate: "2024-12-31"
};
```

## 🔧 **Integration with Orders**

### **Frontend Integration**

1. **Cart Integration** - Promotions automatically calculated in cart
2. **Coupon Input** - Customers can enter coupon codes
3. **Promotion Display** - Shows applied discounts and savings

### **Order Flow**

1. Customer adds items to cart
2. System calculates applicable promotions
3. Customer optionally enters coupon code
4. Final pricing displayed with discount breakdown
5. Order saved with promotion details

### **Order Schema Enhancement**

```javascript
// Added to existing order schema
appliedPromotions: [{
  promotionId: ObjectId,
  name: String,
  type: String,
  discountAmount: Number,
  code: String,
  appliedToItems: [String]
}],

bills: {
  subtotal: Number,        // Before promotions
  promotionDiscount: Number, // Total discount applied
  total: Number,           // After promotions
  tax: Number,
  totalWithTax: Number
}
```

## 📈 **Analytics & Reporting**

### **Available Metrics**
- Total promotions count
- Active vs inactive promotions
- Total promotion usage
- Average usage per promotion
- Promotion type breakdown
- Top performing promotions
- Usage trends over time

### **Insights**
- Promotion effectiveness analysis
- Customer behavior patterns
- Revenue impact assessment
- ROI calculations

## 🎨 **User Interface**

### **Promotion Manager Page**
- **Dashboard Overview** - Key metrics and statistics
- **Promotion List** - Sortable, filterable table/card view
- **Create/Edit Form** - Comprehensive promotion configuration
- **Analytics View** - Visual charts and performance data

### **Key UI Features**
- **Responsive Design** - Works on desktop and mobile
- **Real-time Updates** - Live promotion status updates
- **Bulk Operations** - Multi-select actions
- **Advanced Filters** - Search and filter capabilities
- **Status Indicators** - Visual promotion status badges

## ⚙️ **Configuration Options**

### **Promotion Types**
```javascript
const PROMOTION_TYPES = {
  ORDER_PERCENTAGE: 'order_percentage',
  ORDER_FIXED: 'order_fixed',
  ITEM_PERCENTAGE: 'item_percentage',
  ITEM_FIXED: 'item_fixed',
  HAPPY_HOUR: 'happy_hour'
};
```

### **Applicable Items**
```javascript
const APPLICABLE_ITEMS = {
  ALL_ORDER: 'all_order',
  SPECIFIC_DISHES: 'specific_dishes',
  CATEGORIES: 'categories'
};
```

### **Days of Week**
```javascript
const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 
  'thursday', 'friday', 'saturday', 'sunday'
];
```

## 🔒 **Security & Permissions**

### **Access Control**
- **Admin Only** - Promotion management restricted to Admin users
- **Authentication Required** - All API endpoints require valid JWT token
- **Input Validation** - Comprehensive server-side validation
- **Rate Limiting** - Protection against abuse

### **Data Validation**
- Promotion dates validation
- Discount amount limits (0-100% for percentages)
- Usage limits enforcement
- Coupon code uniqueness

## 🧪 **Testing**

### **Sample Data**
Use the provided seed script to create sample promotions:

```bash
cd pos-backend
node seeds/promotionSeeds.js
```

### **Test Scenarios**
1. Create different promotion types
2. Test time-based conditions
3. Validate coupon codes
4. Check usage limits
5. Test promotion combinations
6. Verify order integration

## 🚀 **Deployment Notes**

### **Environment Variables**
No additional environment variables required - uses existing POS system configuration.

### **Database Migration**
The promotion system uses new collections and doesn't affect existing data.

### **Performance Considerations**
- Indexes added for efficient queries
- Pagination implemented for large datasets
- Optimized promotion calculation logic

## 📞 **Support**

### **Common Issues**
1. **Promotion not applying** - Check date ranges and conditions
2. **Coupon code invalid** - Verify code exists and is active
3. **Analytics not loading** - Check date range parameters
4. **Permission denied** - Ensure user has Admin role

### **Troubleshooting**
- Check browser console for frontend errors
- Review server logs for API errors
- Verify database connections
- Confirm user permissions

## 🔄 **Future Enhancements**

### **Planned Features**
- **Customer Segmentation** - Target specific customer groups
- **A/B Testing** - Compare promotion effectiveness
- **Loyalty Integration** - Points-based promotions
- **Email Integration** - Automated promotion notifications
- **Advanced Analytics** - Revenue impact analysis
- **Promotion Templates** - Pre-configured promotion types

### **Integration Opportunities**
- **Inventory System** - Stock-based promotions
- **Customer Database** - Personalized offers
- **Marketing Tools** - Campaign management
- **Third-party Services** - External promotion platforms

---

## 🎉 **Getting Started**

1. **Access Promotion Manager**: Login as Admin → Header Menu → "Promotions"
2. **Create First Promotion**: Click "New Promotion" → Fill form → Save
3. **Test Integration**: Add items to cart → Enter coupon code → Verify discount
4. **Monitor Performance**: View Analytics → Track usage and effectiveness

**Happy promoting! 🎯**
