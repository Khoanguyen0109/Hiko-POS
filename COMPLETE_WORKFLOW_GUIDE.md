# Complete Workflow: From Ingredients to Dishes

## 📋 **Overview**

This guide shows the complete workflow from setting up ingredients, creating dishes, defining recipes, to automatic inventory management when orders are placed.

---

## 🎯 **Complete System Flow**

```
Step 1: Setup Ingredients
    ↓
Step 2: Import Stock
    ↓
Step 3: Create Dishes
    ↓
Step 4: Create Recipes
    ↓
Step 5: Place Orders
    ↓
Step 6: Complete Orders
    ↓
Step 7: Auto-Export Ingredients
    ↓
Step 8: Inventory Updated
```

---

## 📝 **Step-by-Step Workflow**

### **Step 1: Create Ingredients**

**Goal**: Set up all ingredients you use in your kitchen

**Path**: `Dashboard → Ingredients → Add Ingredient`

**Example: Matcha Latte Ingredients**

#### **Ingredient 1: Matcha Powder**
```
Click "Add Ingredient" button

Basic Info:
├─ Name: Matcha Powder
├─ Code: MATCHA-001
├─ Category: Beverage
└─ Unit: g (gram)

Inventory Settings:
├─ Min Stock: 50g
├─ Reorder Point: 100g
└─ Max Stock: 1000g

Costs:
└─ Standard Cost: 1400 (VND per gram)

Storage:
├─ Location: Dry Storage A
├─ Temperature: DRY
└─ Shelf Life: 180 days

Click "Create"
```

**Result**: ✅ Ingredient created with ID: MATCHA-001

#### **Ingredient 2: Fresh Milk**
```
Click "Add Ingredient" button

Basic Info:
├─ Name: Fresh Milk
├─ Code: MILK-001
├─ Category: Dairy
└─ Unit: ml (milliliter)

Inventory Settings:
├─ Min Stock: 500ml
├─ Reorder Point: 1000ml
└─ Max Stock: 10000ml

Costs:
└─ Standard Cost: 223 (VND per ml)

Storage:
├─ Location: Refrigerator B
├─ Temperature: CHILLED
└─ Shelf Life: 7 days

Click "Create"
```

**Result**: ✅ Ingredient created with ID: MILK-001

---

### **Step 2: Import Stock**

**Goal**: Add physical inventory to the system

**Path**: `Ingredients → Click "Import" button on ingredient`

#### **Import Matcha Powder**
```
Click "Import" button on Matcha Powder card

Transaction Form:
├─ Ingredient: Matcha Powder (MATCHA-001) [auto-selected]
├─ Quantity: 100 (grams)
├─ Unit Cost: 1400 (VND per gram)
├─ Total Cost: 140,000 VND [auto-calculated]
│
├─ Supplier Name: Green Tea Supplier Co.
├─ Batch Number: BATCH-2025-001
└─ Expiry Date: 2025-12-31

Click "Import Stock"
```

**System Actions**:
1. ✅ Transaction created: `IMP-1234567890-ABC`
2. ✅ Stock updated: 0g → 100g
3. ✅ Average cost calculated: 1,400 VND/g
4. ✅ Transaction recorded in history

**Current State**:
```
Matcha Powder:
├─ Current Stock: 100g
├─ Average Cost: 1,400 VND/g
└─ Last Purchase Cost: 1,400 VND/g
```

#### **Import Fresh Milk**
```
Click "Import" button on Fresh Milk card

Transaction Form:
├─ Ingredient: Fresh Milk (MILK-001) [auto-selected]
├─ Quantity: 1000 (milliliters)
├─ Unit Cost: 223 (VND per ml)
├─ Total Cost: 223,000 VND [auto-calculated]
│
├─ Supplier Name: Dairy Farm ABC
├─ Batch Number: BATCH-2025-002
└─ Expiry Date: 2025-11-15

Click "Import Stock"
```

**System Actions**:
1. ✅ Transaction created: `IMP-1234567891-DEF`
2. ✅ Stock updated: 0ml → 1000ml
3. ✅ Average cost calculated: 223 VND/ml
4. ✅ Transaction recorded in history

**Current State**:
```
Fresh Milk:
├─ Current Stock: 1000ml
├─ Average Cost: 223 VND/ml
└─ Last Purchase Cost: 223 VND/ml
```

---

### **Step 3: Create Dishes**

**Goal**: Add menu items that customers can order

**Path**: `Dashboard → Add Dishes` or `Dishes → Add Dishes`

#### **Create Matcha Latte Dish**
```
Click "Add Dishes" button

Basic Information:
├─ Name: Matcha Latte
├─ Category: Beverage
├─ Description: Premium Japanese matcha with fresh milk
└─ Image: [Upload or URL]

Pricing (Size Variants):
├─ Small:  30,000 VND
├─ Medium: 38,000 VND
└─ Large:  43,000 VND

Default Size: Medium ✓

Availability:
└─ Available: Yes ✓

Click "Create Dish"
```

**System Actions**:
1. ✅ Dish created with ID: `68cb88005669a99259bcd0fb`
2. ✅ Size variants created: Small, Medium, Large
3. ✅ Available on menu immediately
4. ✅ Cost: 0 VND (no recipe yet)

**Current State**:
```
Matcha Latte:
├─ ID: 68cb88005669a99259bcd0fb
├─ Category: Beverage
├─ Sizes: Small (30k), Medium (38k), Large (43k)
├─ Cost: 0 VND [No recipe]
└─ Status: Available
```

---

### **Step 4: Create Recipe**

**Goal**: Link ingredients to dishes with exact quantities

**Path**: `Dishes → Click Recipe button` or `Recipes → Add Recipe`

#### **Method A: From Dishes Page**
```
1. Go to Dishes page
2. Find "Matcha Latte" card
3. Click Recipe button (purple book icon 📖)
4. Recipe Modal opens with Matcha Latte pre-selected
```

#### **Method B: From Recipes Page**
```
1. Dashboard → Click "Recipes"
2. Click "Add Recipe" button
3. Select "Matcha Latte" from dropdown
4. Continue with recipe creation
```

#### **Define Recipe for Each Size**

**Medium Size Recipe**:
```
Recipe Modal for Matcha Latte

Size: Medium [shown if dish has variants]

Ingredient 1:
├─ Select: Matcha Powder (MATCHA-001) - 1,400 VND/g
├─ Quantity: 3
├─ Unit: g [auto-filled]
└─ Cost: 4,200 VND [auto-calculated: 3 × 1,400]

Click "Add Ingredient"

Ingredient 2:
├─ Select: Fresh Milk (MILK-001) - 223 VND/ml
├─ Quantity: 10
├─ Unit: ml [auto-filled]
└─ Cost: 2,230 VND [auto-calculated: 10 × 223]

Additional Information:
├─ Servings: 1
├─ Prep Time: 5 minutes
├─ Instructions:
│   1. Mix 3g matcha with 30ml hot water
│   2. Add 10ml milk
│   3. Stir well
│   4. Serve immediately
└─ Notes: Best served immediately

┌─────────────────────────────────────┐
│ Total Ingredient Cost: 6,430 VND    │
│ Cost per serving: 6,430 VND         │
└─────────────────────────────────────┘

Click "Save Recipe"
```

**System Actions**:
1. ✅ Recipe created for Matcha Latte
2. ✅ Recipe linked to dish ID
3. ✅ Cost calculated: 6,430 VND
4. ✅ **Dish cost AUTOMATICALLY updated**
5. ✅ Recipe saved to database

**Large Size Recipe** (if needed):
```
Repeat same process with different quantities:

Ingredient 1: Matcha Powder
├─ Quantity: 5g (instead of 3g)
└─ Cost: 7,000 VND

Ingredient 2: Fresh Milk
├─ Quantity: 15ml (instead of 10ml)
└─ Cost: 3,345 VND

Total Cost: 10,345 VND
```

**Current State After Recipe Creation**:
```
Matcha Latte:
├─ Recipe: ✓ Created
├─ Medium Cost: 6,430 VND [auto-updated]
├─ Large Cost: 10,345 VND [auto-updated]
└─ Profit Margin (Medium): 
    Selling: 38,000 VND
    Cost: 6,430 VND
    Profit: 31,570 VND (83%)
```

---

### **Step 5: Place Order**

**Goal**: Customer orders from menu

**Path**: `Menu → Select items → Add to cart → Place Order`

#### **Customer Order Example**
```
Customer Order:
├─ 2x Matcha Latte (Medium)
└─ Table: 5

Cart Calculation:
├─ Subtotal: 76,000 VND (38,000 × 2)
├─ Tax: 0 VND
└─ Total: 76,000 VND

Click "Place Order"
```

**System Actions**:
1. ✅ Order created: `ORD-2025-001`
2. ✅ Status: "progress" (in-progress)
3. ✅ Items stored with quantities
4. ✅ **No ingredient deduction yet** (order not completed)

**Current State**:
```
Order: ORD-2025-001
├─ Status: progress
├─ Items: 2x Matcha Latte (Medium)
├─ Total: 76,000 VND
└─ Ingredients: NOT exported yet

Inventory (unchanged):
├─ Matcha Powder: 100g
└─ Fresh Milk: 1000ml
```

---

### **Step 6: Complete Order**

**Goal**: Mark order as finished, trigger auto-export

**Path**: `Orders → Click order → Mark as Complete`

#### **Staff Completes Order**
```
1. Kitchen prepares 2x Matcha Latte
2. Staff delivers to customer
3. Staff goes to Orders page
4. Clicks on Order ORD-2025-001
5. Changes status to "completed"
6. Selects payment method: "Cash"
7. Clicks "Update"
```

**System Actions (Automatic)**:
```
✓ Order status updated: progress → completed
✓ Payment method recorded: Cash

⚡ AUTO-EXPORT TRIGGERED:

For Dish 1: Matcha Latte (Medium)
  Recipe found ✓
  Required ingredients:
    - 3g Matcha × 1 qty = 3g needed
    - 10ml Milk × 1 qty = 10ml needed

For Dish 2: Matcha Latte (Medium)
  Recipe found ✓
  Required ingredients:
    - 3g Matcha × 1 qty = 3g needed
    - 10ml Milk × 1 qty = 10ml needed

Total Required:
  - Matcha: 6g (3g × 2 orders)
  - Milk: 20ml (10ml × 2 orders)

Stock Check:
  ✓ Matcha available: 100g > 6g
  ✓ Milk available: 1000ml > 20ml

Creating Transactions...
```

---

### **Step 7: Auto-Export Ingredients**

**Goal**: System automatically deducts ingredients from inventory

**No Manual Action Required - Fully Automatic**

#### **Transaction 1: Export Matcha**
```
Transaction Created:
├─ Number: EXP-1234567892-GHI
├─ Type: EXPORT
├─ Ingredient: Matcha Powder (MATCHA-001)
├─ Quantity: 6g
├─ Unit Cost: 1,400 VND/g
├─ Total Cost: 8,400 VND
├─ Stock Before: 100g
├─ Stock After: 94g
├─ Export Details:
│   ├─ Order ID: ORD-2025-001
│   ├─ Dish: Matcha Latte
│   └─ Reason: PRODUCTION
└─ Notes: Auto-export for order ORD-2025-001 (completed)

✓ Transaction saved
✓ Inventory updated
```

#### **Transaction 2: Export Milk**
```
Transaction Created:
├─ Number: EXP-1234567893-JKL
├─ Type: EXPORT
├─ Ingredient: Fresh Milk (MILK-001)
├─ Quantity: 20ml
├─ Unit Cost: 223 VND/ml
├─ Total Cost: 4,460 VND
├─ Stock Before: 1000ml
├─ Stock After: 980ml
├─ Export Details:
│   ├─ Order ID: ORD-2025-001
│   ├─ Dish: Matcha Latte
│   └─ Reason: PRODUCTION
└─ Notes: Auto-export for order ORD-2025-001 (completed)

✓ Transaction saved
✓ Inventory updated
```

**Console Logs**:
```bash
✓ Exported 6g of Matcha Powder for order ORD-2025-001
✓ Exported 20ml of Fresh Milk for order ORD-2025-001
```

---

### **Step 8: Inventory Updated**

**Goal**: Verify inventory reflects actual usage

**Path**: `Ingredients → View current stock`

#### **Updated Inventory State**
```
Matcha Powder:
├─ Previous: 100g
├─ Used: 6g
├─ Current: 94g ✓
├─ Status: In Stock (above reorder point)
└─ Cost: 1,400 VND/g (unchanged)

Fresh Milk:
├─ Previous: 1000ml
├─ Used: 20ml
├─ Current: 980ml ✓
├─ Status: In Stock (above reorder point)
└─ Cost: 223 VND/ml (unchanged)
```

#### **Transaction History**
```
View in Ingredients → Click History on ingredient

Matcha Powder History:
1. IMP-1234567890-ABC | IMPORT  | +100g | 2025-10-26
2. EXP-1234567892-GHI | EXPORT  | -6g   | 2025-10-26
   └─ Order: ORD-2025-001

Fresh Milk History:
1. IMP-1234567891-DEF | IMPORT  | +1000ml | 2025-10-26
2. EXP-1234567893-JKL | EXPORT  | -20ml   | 2025-10-26
   └─ Order: ORD-2025-001
```

---

## 📊 **Complete Workflow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    1. CREATE INGREDIENTS                     │
├─────────────────────────────────────────────────────────────┤
│ Matcha Powder (1,400 VND/g) | Fresh Milk (223 VND/ml)      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     2. IMPORT STOCK                          │
├─────────────────────────────────────────────────────────────┤
│ Matcha: 100g @ 1,400/g  | Milk: 1000ml @ 223/ml            │
│ Transaction: IMP-xxx    | Transaction: IMP-yyy              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     3. CREATE DISH                           │
├─────────────────────────────────────────────────────────────┤
│ Matcha Latte                                                 │
│ Small: 30k | Medium: 38k | Large: 43k                       │
│ Cost: 0 (no recipe yet)                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     4. CREATE RECIPE                         │
├─────────────────────────────────────────────────────────────┤
│ Medium Size:                                                 │
│ ├─ 3g Matcha  = 4,200 VND                                   │
│ ├─ 10ml Milk  = 2,230 VND                                   │
│ └─ Total Cost = 6,430 VND                                   │
│                                                              │
│ ✓ Recipe saved                                               │
│ ✓ Dish cost updated to 6,430 VND                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     5. PLACE ORDER                           │
├─────────────────────────────────────────────────────────────┤
│ 2x Matcha Latte (Medium) = 76,000 VND                       │
│ Status: progress                                             │
│ Inventory: Not affected yet                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   6. COMPLETE ORDER                          │
├─────────────────────────────────────────────────────────────┤
│ Staff marks order as "completed"                             │
│ Payment: Cash                                                │
│ ⚡ AUTO-EXPORT TRIGGERED                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 7. AUTO-EXPORT INGREDIENTS                   │
├─────────────────────────────────────────────────────────────┤
│ For each dish in order:                                      │
│ ├─ Get recipe                                                │
│ ├─ Calculate required qty (recipe qty × order qty)          │
│ ├─ Check stock                                               │
│ ├─ Create export transaction                                 │
│ └─ Update inventory                                          │
│                                                              │
│ Matcha: 100g → 94g (-6g for 2 drinks)                       │
│ Milk: 1000ml → 980ml (-20ml for 2 drinks)                   │
│                                                              │
│ ✓ Transaction EXP-xxx created                                │
│ ✓ Transaction EXP-yyy created                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  8. INVENTORY UPDATED                        │
├─────────────────────────────────────────────────────────────┤
│ ✓ Stock levels accurate                                      │
│ ✓ Transaction history recorded                               │
│ ✓ Can track usage per order                                  │
│ ✓ Low stock alerts (if below reorder point)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Continuous Operations**

### **Daily Operations Loop**
```
Morning:
├─ Check low stock alerts
├─ Import new ingredients if needed
└─ Verify stock levels

During Service:
├─ Take orders → System creates order
├─ Prepare dishes → Kitchen workflow
└─ Complete orders → Auto-export ingredients

End of Day:
├─ Review transaction history
├─ Check remaining stock
├─ Plan next day's purchases
└─ Verify inventory accuracy
```

---

## 📈 **Advanced Scenarios**

### **Scenario 1: Price Change**
```
New Matcha Shipment at Different Price:

1. Import new stock:
   ├─ Quantity: 200g
   ├─ Unit Cost: 1,600 VND/g (price increased)
   └─ Total: 320,000 VND

2. System calculates new average:
   Old: 94g @ 1,400 VND/g = 131,600 VND
   New: 200g @ 1,600 VND/g = 320,000 VND
   ───────────────────────────────────────
   Total: 294g @ 1,532 VND/g (new average)

3. Recipe cost updates automatically:
   Old: 3g × 1,400 = 4,200 VND
   New: 3g × 1,532 = 4,596 VND
   ───────────────────────────────────────
   New Recipe Cost: 6,826 VND

4. Recalculate all recipes:
   Dashboard → Recipes → "Recalculate Costs"
   ✓ All dishes updated with new costs
```

### **Scenario 2: Low Stock Alert**
```
After Multiple Orders:

Matcha Powder:
├─ Current: 95g
├─ Reorder Point: 100g
└─ Status: ⚠️ LOW STOCK

System Actions:
1. ✓ Shows in "Low Stock" tab
2. ✓ Yellow warning indicator
3. ✓ Notification: "Low Stock - 95g remaining"

Admin Action:
1. Review low stock items
2. Place order with supplier
3. Import new stock when received
4. Stock level returns to normal
```

### **Scenario 3: Insufficient Stock**
```
Order Placed but Not Enough Stock:

Order: 50x Matcha Latte (Medium)
Required: 150g Matcha (50 × 3g)
Available: 94g Matcha

When Order Completed:
⚠️ Console Warning:
"Insufficient stock for Matcha Powder. 
Required: 150g, Available: 94g (Order: ORD-2025-002)"

System Behavior:
├─ Order still marked as completed ✓
├─ Warning logged (non-blocking)
├─ Matcha NOT exported (insufficient)
├─ Milk exported normally (if sufficient)
└─ Admin notified to check inventory
```

---

## 💡 **Best Practices**

### **For Setup Phase**
1. ✅ Create ALL ingredients first
2. ✅ Import initial stock for all ingredients
3. ✅ Create all menu dishes
4. ✅ Define recipes for every dish
5. ✅ Verify recipe costs are reasonable
6. ✅ Test with a few orders

### **For Daily Operations**
1. ✅ Check low stock alerts every morning
2. ✅ Import new stock as needed
3. ✅ Complete orders promptly (triggers auto-export)
4. ✅ Review transaction history weekly
5. ✅ Recalculate costs after price changes
6. ✅ Update recipes when ingredients change

### **For Cost Management**
1. ✅ Set realistic profit margins
2. ✅ Monitor ingredient cost trends
3. ✅ Adjust menu prices when costs increase
4. ✅ Use cost reports for pricing decisions
5. ✅ Track waste and adjust recipes

---

## 🎯 **Key Takeaways**

### **What Happens Automatically**
✅ Cost calculation based on ingredient prices  
✅ Inventory deduction when orders completed  
✅ Transaction recording with order references  
✅ Low stock alerts when below reorder point  
✅ Dish cost updates when recipe saved  

### **What You Need to Do Manually**
📝 Create ingredients and set prices  
📝 Import physical stock into system  
📝 Create dishes with prices  
📝 Define recipes with ingredient quantities  
📝 Mark orders as completed  
📝 Import new stock when running low  

### **Real-Time Tracking**
📊 Know exact inventory at any moment  
📊 See ingredient usage per order  
📊 Track costs over time  
📊 Identify high-usage ingredients  
📊 Plan purchases based on data  

---

## ✅ **Verification Checklist**

After setup, verify:
- [ ] All ingredients created with correct units
- [ ] Stock imported with current prices
- [ ] All dishes created with prices
- [ ] All dishes have recipes defined
- [ ] Recipe costs match expectations
- [ ] Test order places successfully
- [ ] Test order completes successfully
- [ ] Ingredients auto-exported correctly
- [ ] Inventory levels updated
- [ ] Transaction history shows exports

---

## 🎊 **Summary**

The complete workflow is:

```
Ingredients → Stock → Dishes → Recipes → Orders → Auto-Export → Inventory
```

**Time Investment**:
- Setup (one-time): 2-4 hours
- Daily operations: Automatic after order completion
- Weekly review: 30 minutes

**Benefits**:
- ✅ Accurate inventory tracking
- ✅ Real-time cost calculation
- ✅ Automatic ingredient deduction
- ✅ Complete audit trail
- ✅ Data-driven decisions

**Your restaurant now has professional-grade inventory management! 🎉📊👨‍🍳**

