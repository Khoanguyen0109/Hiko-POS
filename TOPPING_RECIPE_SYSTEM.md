# Topping Recipe Management System

## Overview
The Topping Recipe Management System allows you to define ingredient compositions for toppings, track their costs, and automatically deduct ingredients from inventory when orders containing toppings are completed.

---

## Features

### 1. **Topping Recipe Management**
- Define ingredients and quantities for each topping
- Set yield amount and unit (servings, ml, g, etc.)
- Add preparation time and notes
- Calculate ingredient costs automatically
- View cost per serving

### 2. **Automatic Ingredient Export**
- When an order is completed, ingredients are automatically exported based on:
  - Dish recipes (for each dish)
  - Topping recipes (for each topping in the order)
- Stock is validated before export
- Transaction records are created for audit trail

### 3. **Cost Tracking**
- Real-time cost calculation based on ingredient costs
- Weighted average cost (FIFO) for ingredients
- Cost per serving calculation based on yield
- Automatic topping cost updates when recipe changes

---

## Backend Components

### Models

#### ToppingRecipe Model (`pos-backend/models/toppingRecipeModel.js`)
```javascript
{
  toppingId: ObjectId (ref: Topping),
  ingredients: [
    {
      ingredientId: ObjectId (ref: Ingredient),
      quantity: Number,
      unit: String,
      notes: String
    }
  ],
  totalIngredientCost: Number,
  costPerServing: Number,
  yield: {
    amount: Number,
    unit: String
  },
  preparationTime: Number,
  preparationNotes: String,
  isActive: Boolean
}
```

### Routes (`pos-backend/routes/toppingRecipeRoute.js`)
- `POST /api/topping-recipe/` - Create or update topping recipe
- `GET /api/topping-recipe/` - Get all topping recipes
- `GET /api/topping-recipe/topping/:toppingId` - Get recipe for specific topping
- `DELETE /api/topping-recipe/topping/:toppingId` - Delete topping recipe
- `GET /api/topping-recipe/topping/:toppingId/cost` - Calculate cost
- `POST /api/topping-recipe/recalculate-all` - Recalculate all topping costs
- `POST /api/topping-recipe/topping/:toppingId/clone` - Clone recipe

### Controllers (`pos-backend/controllers/toppingRecipeController.js`)
- `createOrUpdateToppingRecipe` - Create/update recipe and calculate cost
- `getAllToppingRecipes` - Get all recipes with filters
- `getToppingRecipeByToppingId` - Get specific recipe
- `deleteToppingRecipe` - Delete recipe
- `calculateToppingRecipeCost` - Calculate and return cost breakdown
- `recalculateAllToppingCosts` - Update costs for all toppings
- `cloneToppingRecipe` - Duplicate recipe to another topping

---

## Frontend Components

### Redux Slice (`pos-frontend/src/redux/slices/toppingRecipeSlice.js`)
**State:**
- `items` - Array of topping recipes
- `currentRecipe` - Currently selected recipe
- `loading` - Loading state
- `error` - Error messages
- `costCalculation` - Cost calculation result

**Actions:**
- `fetchAllToppingRecipes` - Load all recipes
- `fetchToppingRecipeByToppingId` - Load recipe for specific topping
- `saveToppingRecipe` - Create or update recipe
- `removeToppingRecipe` - Delete recipe
- `calculateCostForToppingRecipe` - Get cost breakdown
- `recalculateAllCosts` - Update all costs

### UI Components

#### ToppingRecipeModal (`pos-frontend/src/components/toppings/ToppingRecipeModal.jsx`)
**Features:**
- Select or pre-select topping
- Add/remove ingredients with quantity and unit
- Set yield amount and unit
- Add preparation time and notes
- Real-time cost calculation display
- Active/inactive toggle

**Props:**
- `isOpen` (boolean) - Modal visibility
- `onClose` (function) - Close handler
- `topping` (object, optional) - Pre-selected topping
- `onSuccess` (function, optional) - Success callback

#### Toppings Page Integration (`pos-frontend/src/pages/Toppings.jsx`)
- Recipe button (purple icon) on each topping card
- Opens ToppingRecipeModal with pre-selected topping
- Displays recipe icon (MdMenuBook)

---

## Usage Guide

### Creating a Topping Recipe

#### Example: Whipped Cream Topping

**Ingredients:**
- 100ml Heavy Cream (cost: 15,000 VND/liter = 15 VND/ml)
- 10g Sugar (cost: 20,000 VND/kg = 20 VND/g)
- 2ml Vanilla Extract (cost: 200,000 VND/100ml = 2,000 VND/ml)

**Steps:**
1. Navigate to **Toppings** page
2. Find "Whipped Cream" topping
3. Click the purple **Recipe** button (MdMenuBook icon)
4. In the modal:
   - **Topping**: Whipped Cream (pre-selected)
   - **Add Ingredients**:
     - Heavy Cream: 100 ml
     - Sugar: 10 g
     - Vanilla Extract: 2 ml
   - **Yield**: 1 serving
   - **Preparation Time**: 5 minutes
   - **Preparation Notes**: "Whip until stiff peaks form"
5. View **Cost Breakdown**:
   - Total Ingredient Cost: 5,500 VND
   - Cost per Serving: 5,500 VND
6. Click **Save Recipe**

### Viewing Topping Recipes

From **Dashboard**:
- Click "Add Topping" → Navigate to Toppings page
- Each topping card has a recipe button

From **Toppings Page**:
- Click the purple recipe button on any topping card
- View/Edit existing recipe or create new one

### How Automatic Ingredient Export Works

When an order is **completed** (status changed from any state to "completed"):

1. **System processes each order item:**
   - Exports ingredients for the dish (based on dish recipe)
   - Exports ingredients for each topping (based on topping recipes)

2. **For each topping:**
   - Finds active topping recipe
   - Calculates required quantity: `ingredient_qty × topping_qty × order_qty`
   - Validates stock availability
   - Creates export transaction
   - Updates ingredient inventory
   - Logs transaction for audit

3. **Example:**
   - Order: 2x "Matcha Latte" with 1x "Whipped Cream" topping
   - Matcha Latte recipe: 3g matcha, 200ml milk
   - Whipped Cream recipe: 100ml cream, 10g sugar
   - **Exports:**
     - 6g matcha (3g × 2)
     - 400ml milk (200ml × 2)
     - 200ml cream (100ml × 1 × 2)
     - 20g sugar (10g × 1 × 2)

---

## Integration with Order System

### Order Completion Flow

```javascript
// In orderController.js - updateOrder function
if (orderStatus === 'completed' && currentOrder.orderStatus !== 'completed') {
  for (let item of order.items) {
    // 1. Export dish ingredients
    const dishRecipe = await DishRecipe.findOne({ dishId: item.dishId, isActive: true });
    // ... export dish ingredients
    
    // 2. Export topping ingredients
    if (item.toppings && item.toppings.length > 0) {
      for (let topping of item.toppings) {
        const toppingRecipe = await ToppingRecipe.findOne({ 
          toppingId: topping.toppingId, 
          isActive: true 
        });
        // ... export topping ingredients
      }
    }
  }
}
```

### Transaction Records

Each ingredient export creates a transaction with:
- `type: 'EXPORT'`
- `orderId`: Order reference
- `dishId`: Dish reference
- `dishName`: e.g., "Matcha Latte + Whipped Cream"
- `reason: 'PRODUCTION'`
- `notes`: e.g., "Auto-export for order XXX (topping: Whipped Cream)"

---

## Cost Calculation

### Formula
```
Total Ingredient Cost = Σ(ingredient_quantity × ingredient_average_cost)
Cost Per Serving = Total Ingredient Cost / Yield Amount
```

### Example
**Topping: Chocolate Sauce**
- Ingredients:
  - 50g Cocoa Powder @ 300 VND/g = 15,000 VND
  - 100g Sugar @ 20 VND/g = 2,000 VND
  - 100ml Milk @ 25 VND/ml = 2,500 VND
- **Total Cost:** 19,500 VND
- **Yield:** 1 serving
- **Cost per Serving:** 19,500 VND

When recipe or ingredient costs change:
- Call `/api/topping-recipe/recalculate-all` to update all topping costs
- Individual recipe costs update automatically when saved

---

## Best Practices

### 1. **Recipe Creation**
- Define recipes for all toppings that have ingredient costs
- Use consistent units (g, ml, pieces)
- Set accurate yield amounts
- Add preparation notes for kitchen staff

### 2. **Stock Management**
- Monitor ingredient stock levels via Ingredients page
- Set reorder points for critical ingredients
- Review transaction history regularly

### 3. **Cost Tracking**
- Recalculate all costs when ingredient prices change
- Review cost per serving vs. topping price for profitability
- Use analytics to track ingredient usage vs. sales

### 4. **Order Processing**
- Ensure all toppings have recipes before going live
- Monitor console logs for stock warnings
- Check ingredient transactions after busy periods

---

## API Examples

### Create Topping Recipe
```javascript
POST /api/topping-recipe/
{
  "toppingId": "68cb88005669a99259bcd0fc",
  "ingredients": [
    {
      "ingredientId": "68d1234567890abcdef12345",
      "quantity": 100,
      "unit": "ml",
      "notes": "Fresh cream"
    }
  ],
  "yield": { "amount": 1, "unit": "serving" },
  "preparationTime": 5,
  "preparationNotes": "Whip until stiff peaks",
  "isActive": true
}
```

### Get Topping Recipe
```javascript
GET /api/topping-recipe/topping/68cb88005669a99259bcd0fc

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "toppingId": { ... },
    "ingredients": [ ... ],
    "totalIngredientCost": 5500,
    "costPerServing": 5500,
    "yield": { "amount": 1, "unit": "serving" },
    "preparationTime": 5,
    "preparationNotes": "Whip until stiff peaks",
    "isActive": true
  }
}
```

### Calculate Cost
```javascript
GET /api/topping-recipe/topping/68cb88005669a99259bcd0fc/cost

Response:
{
  "success": true,
  "data": {
    "toppingId": "68cb88005669a99259bcd0fc",
    "totalIngredientCost": 5500,
    "costPerServing": 5500,
    "yield": { "amount": 1, "unit": "serving" },
    "breakdown": [
      {
        "ingredient": "Heavy Cream",
        "quantity": 100,
        "unit": "ml",
        "unitCost": 15,
        "totalCost": 1500
      },
      { ... }
    ]
  }
}
```

---

## Troubleshooting

### Issue: Recipe cost not updating
**Solution:** Call `/api/topping-recipe/recalculate-all` or save the recipe again

### Issue: Ingredients not exported on order completion
**Causes:**
- Topping recipe not created
- Recipe set to `isActive: false`
- Insufficient stock (check console warnings)
- Order not transitioning to "completed" status

**Solution:**
1. Check if topping has an active recipe
2. Verify ingredient stock levels
3. Review server console logs for warnings
4. Check ingredient transaction history

### Issue: Stock warnings on order completion
**Cause:** Insufficient ingredient stock for recipe requirements

**Solution:**
1. Import more ingredients
2. Adjust recipe quantities
3. Review usage patterns vs. stock levels

---

## Integration with Existing Systems

### Dish Recipe System
- Both dish and topping recipes use the same ingredient pool
- Both export ingredients on order completion
- Both use weighted average costing

### Ingredient Management
- Toppings share ingredients with dishes
- Same transaction model (`IngredientTransaction`)
- Same stock tracking and alerts

### Analytics
- Topping ingredient usage tracked separately
- Can analyze topping profitability
- Compare ingredient cost vs. topping price

---

## Summary

The Topping Recipe Management System provides:
✅ Full recipe management for toppings
✅ Automatic ingredient export on order completion
✅ Real-time cost calculation
✅ Stock validation and warnings
✅ Complete transaction audit trail
✅ Seamless integration with existing ingredient and recipe systems

This ensures accurate inventory tracking and cost management for both dishes and toppings in your restaurant POS system.

