# Recipe Management UI - User Guide

## ✅ **COMPLETE & READY TO USE**

The Recipe Management UI provides a comprehensive interface for managing dish recipes, integrated with ingredient inventory and automatic cost calculations.

---

## 🎯 **Access Points**

### **1. From Dashboard** (Primary Entry)
```
Login → Dashboard → Click "Recipes" button

Location: Dashboard top section (admin only)
Button: Yellow/Gold "Recipes" with book icon 📖
```

### **2. From Dishes Page** (Individual Recipe)
```
Login → Dishes → Click Recipe button on any dish card

Location: Each dish card
Button: Purple "Recipe" button with book icon 📖
```

### **3. Direct URL**
```
http://localhost:5173/recipes
```

---

## 📖 **Recipe Management Page**

### **Header Section**
- **Title**: "Recipe Management"
- **Subtitle**: "Manage dish recipes and ingredient requirements"
- **Actions**:
  - 🔄 **Recalculate Costs**: Updates all recipe costs based on current ingredient prices
  - ➕ **Add Recipe**: Create new recipe for any dish

### **Search Bar**
- Real-time search by dish name
- Filters recipes in the list below
- Example: Type "Matcha" to find all matcha-related recipes

### **Statistics Dashboard**
Three stat cards showing:
1. **Total Recipes**: Number of recipes created
2. **Dishes with Recipes**: X/Y ratio of dishes that have recipes
3. **Dishes Without Recipes**: Count of dishes needing recipes

### **Recipes List**

#### **Desktop View** (Table)
Columns:
- **Dish**: Image, name, and category
- **Ingredients**: Count of ingredients in recipe
- **Recipe Cost**: Total ingredient cost (in VND)
- **Servings**: Number of servings
- **Prep Time**: Time in minutes
- **Actions**: Edit and Delete buttons

#### **Mobile View** (Cards)
Each card shows:
- Dish image and name
- Recipe cost
- Ingredient count
- Servings
- Prep time
- Edit and Delete buttons

---

## ➕ **Creating a Recipe**

### **Method 1: From Recipes Page**

1. Click **"Add Recipe"** button
2. **Select a Dish** from dropdown
   - Shows all available dishes
   - Format: "Dish Name - Category"
3. Recipe form loads
4. Continue to "Adding Ingredients" section below

### **Method 2: From Dishes Page**

1. Find the dish card
2. Click **Recipe button** (purple book icon)
3. Recipe Modal opens with dish pre-selected
4. Continue to "Adding Ingredients" section below

---

## 📝 **Recipe Form**

### **Dish Selection** (if not pre-selected)
```
Select Dish: [Dropdown]
  - Matcha Latte - Beverage
  - Grilled Chicken - Main Course
  - ...
```

### **Size Variants Handling**

**If dish has NO size variants** (e.g., single size):
- Single ingredient list
- One set of quantities

**If dish HAS size variants** (e.g., Small/Medium/Large):
- Separate ingredient lists for each size
- Different quantities per size
- Example:
  ```
  Medium Size:
    - Matcha: 3g
    - Milk: 10ml
  
  Large Size:
    - Matcha: 5g
    - Milk: 15ml
  ```

### **Adding Ingredients**

For each ingredient:

1. **Select Ingredient** from dropdown
   - Shows: Name (Code) - Cost/Unit
   - Example: "Matcha Powder (MATCHA-001) - 1,400 VND/g"
   
2. **Enter Quantity**
   - Supports decimals: 3, 3.5, 10.25
   - Required field
   
3. **Unit** (auto-filled)
   - Automatically filled based on ingredient's unit
   - Read-only field
   
4. **Cost** (auto-calculated)
   - Shows: Quantity × Unit Cost
   - Updates in real-time
   - Format: VND currency

5. Click **"Add Ingredient"** to add more

### **Additional Fields**

**Servings**:
- Number of servings this recipe makes
- Default: 1
- Used to calculate cost per serving

**Prep Time**:
- Time in minutes
- Optional field

**Instructions**:
- Step-by-step cooking instructions
- Multi-line text field
- Example:
  ```
  1. Mix 3g matcha with 30ml hot water
  2. Add 10ml milk
  3. Stir well and serve
  ```

**Notes**:
- Additional information
- Allergen warnings
- Storage instructions
- etc.

### **Total Cost Summary**

Bottom of form shows:
```
┌─────────────────────────────────────┐
│ 🧮 Total Ingredient Cost: 6,430 VND │
│ Cost per serving: 3,215 VND (if >1) │
└─────────────────────────────────────┘
```

### **Form Actions**

- **Cancel**: Close modal without saving
- **Recalculate**: Refresh cost calculations
- **Save Recipe**: Save and update dish cost

---

## ✏️ **Editing a Recipe**

### **From Recipes Page**
1. Click **Edit button** (blue pencil icon) on recipe row
2. Recipe Modal opens with existing data
3. Modify as needed
4. Click **"Save Recipe"**

### **From Dishes Page**
1. Click **Recipe button** on dish card
2. Existing recipe loads automatically
3. Modify as needed
4. Click **"Save Recipe"**

---

## 🗑️ **Deleting a Recipe**

1. Click **Delete button** (red trash icon)
2. Confirm deletion prompt
3. Recipe removed from database
4. ⚠️ **Note**: Dish cost resets to 0 or previous value

---

## 🔄 **Recalculating Costs**

### **What it does:**
- Updates ALL recipe costs based on current ingredient prices
- Useful when ingredient prices change
- Updates dish costs automatically

### **How to use:**
1. Go to Recipes page
2. Click **"Recalculate Costs"** button
3. Confirm action
4. Wait for completion
5. Success message shows count of updated recipes

### **When to use:**
- After importing ingredients at new prices
- After bulk price updates
- Monthly cost review
- Before updating menu prices

---

## 💡 **Real-World Example**

### **Creating Matcha Latte Recipe (Medium Size)**

**Step 1: Access**
```
Dashboard → Click "Recipes" → Click "Add Recipe"
```

**Step 2: Select Dish**
```
Select Dish: "Matcha Latte - Beverage"
```

**Step 3: Add Ingredients**

Ingredient 1:
```
Select: Matcha Powder (MATCHA-001) - 1,400 VND/g
Quantity: 3
Unit: g (auto-filled)
Cost: 4,200 VND (auto-calculated)
```

Ingredient 2:
```
Select: Fresh Milk (MILK-001) - 223 VND/ml
Quantity: 10
Unit: ml (auto-filled)
Cost: 2,230 VND (auto-calculated)
```

**Step 4: Additional Info**
```
Servings: 1
Prep Time: 5 minutes
Instructions:
  1. Mix 3g matcha with 30ml hot water
  2. Add 10ml milk
  3. Stir well
  4. Serve immediately
```

**Step 5: Review Total**
```
Total Ingredient Cost: 6,430 VND
```

**Step 6: Save**
```
Click "Save Recipe"
✅ Recipe saved
✅ Dish cost updated to 6,430 VND
```

**Result:**
- Recipe stored in database
- Dish cost automatically updated
- When orders are completed, ingredients auto-exported:
  - 3g Matcha Powder
  - 10ml Fresh Milk
- Inventory updated in real-time

---

## 📊 **Understanding Costs**

### **Cost Display Format**

**Recipe Cost**:
- Shows total cost of all ingredients
- Format: `6,430 VND`
- Color: Gold (#f6b100)

**Cost Per Serving**:
- Shown only if servings > 1
- Calculation: Total Cost ÷ Servings
- Example: 12,860 VND ÷ 2 servings = 6,430 VND/serving

### **Profit Margin Calculation**

```
Selling Price: 38,000 VND (Medium Matcha Latte)
Recipe Cost: 6,430 VND
─────────────────────────────────────
Profit: 31,570 VND
Margin: 83% ((31,570 ÷ 38,000) × 100)
```

---

## 🔍 **Searching Recipes**

### **Search Box Usage**
1. Type dish name in search box
2. Results filter automatically
3. Works with partial names
4. Case-insensitive

### **Examples**
```
Search: "matcha"
Results: Matcha Latte, Matcha Ice Cream, etc.

Search: "chicken"
Results: Grilled Chicken, Chicken Curry, etc.
```

---

## 📱 **Responsive Design**

### **Desktop** (>768px)
- Table view with all columns
- Side-by-side actions
- Full information visible
- Hover effects on rows

### **Mobile** (<768px)
- Card view with vertical layout
- Stacked information
- Full-width buttons
- Touch-friendly spacing

---

## ⚠️ **Important Notes**

### **Before Creating Recipe**
- ✅ Dish must exist
- ✅ Ingredients must be created
- ✅ Ingredients must have stock/cost data

### **Size Variants**
- Define recipes for EACH size separately
- Different sizes can use different quantities
- Each size gets its own cost calculation

### **Cost Updates**
- Recipe costs update when ingredient prices change
- Use "Recalculate All" to refresh
- Dish costs update automatically when recipe saved

### **Auto-Export**
- Happens when order status → 'completed'
- Only works if recipe exists
- Logs warnings for insufficient stock
- Non-blocking (order still completes)

---

## 🎨 **UI Components**

### **Color Coding**

| Element | Color | Meaning |
|---------|-------|---------|
| Gold/Yellow | #f6b100 | Primary actions, costs |
| Blue | Blue-900/30 | Edit actions |
| Red | Red-900/30 | Delete actions |
| Purple | Purple-900/30 | Recipe-related |
| Green | Green-500 | Success, available |
| Gray | #262626 | Background cards |

### **Icons**

| Icon | Meaning |
|------|---------|
| 📖 | Recipe/Book |
| ✏️ | Edit |
| 🗑️ | Delete |
| ➕ | Add |
| 🔄 | Recalculate/Refresh |
| 🔍 | Search |
| 🧮 | Calculate |

---

## 🚀 **Quick Actions Reference**

| Task | Quick Path |
|------|------------|
| Create new recipe | Dashboard → Recipes → Add Recipe |
| Edit recipe | Recipes page → Click Edit on row |
| Delete recipe | Recipes page → Click Delete on row |
| Search recipes | Recipes page → Use search box |
| Recalculate costs | Recipes page → Recalculate Costs button |
| View recipe from dish | Dishes page → Click Recipe button |

---

## ✅ **Feature Checklist**

- ✅ Create recipes with multiple ingredients
- ✅ Support for size variants (S/M/L)
- ✅ Real-time cost calculation
- ✅ Ingredient search and selection
- ✅ Decimal quantity support
- ✅ Cooking instructions
- ✅ Prep time tracking
- ✅ Edit existing recipes
- ✅ Delete recipes
- ✅ Search and filter
- ✅ Responsive design
- ✅ Desktop table view
- ✅ Mobile card view
- ✅ Pagination support
- ✅ Statistics dashboard
- ✅ Batch cost recalculation
- ✅ Auto-save to database
- ✅ Redux state management
- ✅ Toast notifications
- ✅ Form validation
- ✅ Error handling

---

## 🎓 **Training Tips**

### **For New Users**
1. Start with simple dishes (single size, 2-3 ingredients)
2. Practice searching and filtering
3. Understand cost display
4. Learn edit vs. delete

### **For Admins**
1. Run "Recalculate All" after price updates
2. Review profit margins regularly
3. Ensure all dishes have recipes
4. Monitor "Dishes Without Recipes" stat

### **Best Practices**
- ✅ Create recipes for all menu items
- ✅ Keep instructions clear and concise
- ✅ Update recipes when ingredients change
- ✅ Review costs monthly
- ✅ Recalculate after price changes

---

## 📞 **Troubleshooting**

### **Recipe not saving?**
- Check: Dish selected
- Check: At least one ingredient added
- Check: Quantities > 0
- Check: Internet connection

### **Cost not calculating?**
- Check: Ingredients have prices set
- Try: Click "Recalculate" button
- Verify: Quantities are numbers, not text

### **Can't find dish in dropdown?**
- Check: Dish exists in Dishes page
- Check: Dish is active
- Try: Create dish first

### **Ingredients auto-export not working?**
- Check: Recipe exists for dish
- Check: Order marked as 'completed'
- Check: Sufficient ingredient stock
- Review: Console logs for errors

---

## 🎉 **Conclusion**

The Recipe Management UI is fully integrated and ready to use! It provides:

- **Easy recipe creation** with intuitive forms
- **Real-time cost tracking** based on ingredient prices
- **Automatic inventory management** via auto-export
- **Beautiful, responsive design** for desktop and mobile
- **Complete Redux integration** with backend APIs

**Start creating recipes today and take control of your kitchen costs! 👨‍🍳📊**

