# Model Relationships Summary

## Quick Reference Guide

### Core Models (17 Total)

1. **User** - Staff/Employee management
2. **Customer** - Customer information
3. **Category** - Menu categories
4. **Dish** - Menu items
5. **Topping** - Additional items for dishes
6. **Order** - Customer orders
7. **Table** - Restaurant tables
8. **Payment** - Payment records
9. **Promotion** - Discounts and promotions
10. **Ingredient** - Inventory items
11. **DishRecipe** - Recipes for dishes
12. **ToppingRecipe** - Recipes for toppings
13. **IngredientTransaction** - Inventory movements
14. **Spending** - Expenses
15. **SpendingCategory** - Expense categories
16. **Vendor** - Suppliers
17. **Schedule** - Employee schedules
18. **ShiftTemplate** - Shift definitions
19. **ExtraWork** - Overtime/additional work

---

## Relationship Matrix

### User (Central Entity)
```
User
├── Creates → Order (createdBy)
├── Creates → Promotion (createdBy)
├── Creates → Schedule (createdBy, lastModifiedBy)
├── Assigned → Schedule (assignedMembers.member)
├── Has → ExtraWork (member)
├── Creates → Spending (createdBy)
├── Approves → Spending (approvedBy)
├── Creates → DishRecipe (createdBy, lastModifiedBy)
├── Creates → ToppingRecipe (createdBy)
├── Creates → Ingredient (createdBy, lastModifiedBy)
└── Approves → IngredientTransaction (adjustmentDetails.approvedBy)
```

### Order Flow
```
Customer → Order → OrderItem → Dish
                ↓
            Promotion (applied)
                ↓
            Table (assigned)
                ↓
            Payment (processed)
```

### Menu Structure
```
Category
  └── Dish
      ├── DishRecipe → Ingredient[]
      └── Compatible Toppings → Topping[]
          └── ToppingRecipe → Ingredient[]
```

### Inventory Flow
```
Vendor → Ingredient → IngredientTransaction
                      ↓
                  DishRecipe / ToppingRecipe
                      ↓
                  Order (when dish is ordered)
```

### Promotion System
```
Promotion
├── Applies to → Order (order-level)
├── Applies to → OrderItem (item-level)
├── Targets → Dish[] (specificDishes)
└── Targets → Category[] (categories)
```

### Scheduling System
```
ShiftTemplate
    └── Schedule
        └── User[] (assignedMembers)
            └── ExtraWork
```

### Financial Management
```
SpendingCategory
    └── Spending
        ├── Vendor (supplier)
        └── User (approvedBy)
```

---

## Relationship Types

### One-to-Many (1:N)
- Category → Dish
- Dish → OrderItem (embedded)
- Order → OrderItem (embedded)
- User → Order
- User → Promotion
- User → Schedule
- User → ExtraWork
- User → Spending
- ShiftTemplate → Schedule
- SpendingCategory → Spending
- Vendor → Spending
- Ingredient → IngredientTransaction
- Dish → DishRecipe
- Topping → ToppingRecipe

### Many-to-Many (M:N)
- Dish ↔ Topping (via compatibleToppings)
- Order ↔ Promotion (via appliedPromotions)
- OrderItem ↔ Promotion (via promotionsApplied)
- OrderItem ↔ Topping (via toppings array)
- Schedule ↔ User (via assignedMembers array)
- Ingredient ↔ Vendor (via suppliers array)
- Ingredient ↔ DishRecipe (via ingredients array)
- Ingredient ↔ ToppingRecipe (via ingredients array)

### One-to-One (1:1)
- Dish → DishRecipe
- Topping → ToppingRecipe
- Order → Payment (can be null)

### Embedded Documents
- **OrderItem** - Embedded in Order.items[]
- **Size Variants** - Embedded in Dish.sizeVariants[]
- **Recipe Ingredients** - Embedded in DishRecipe.ingredients[]
- **Recipe Ingredients** - Embedded in ToppingRecipe.ingredients[]
- **Assigned Members** - Embedded in Schedule.assignedMembers[]

---

## Key Foreign Key References

| Model | References | Field Name |
|-------|-----------|------------|
| Dish | Category | `category` |
| Dish | Topping[] | `compatibleToppings` |
| Order | User | `createdBy.userId` |
| Order | Table | `currentOrder` (reverse) |
| Order | Promotion[] | `appliedPromotions[].promotionId` |
| OrderItem | Dish | `dishId` |
| OrderItem | Topping[] | `toppings[].toppingId` |
| OrderItem | Promotion[] | `promotionsApplied[].promotionId` |
| Promotion | Dish[] | `specificDishes[]` |
| Promotion | Category[] | `categories[]` |
| Promotion | User | `createdBy.userId` |
| DishRecipe | Dish | `dishId` |
| DishRecipe | Ingredient[] | `ingredients[].ingredientId` |
| DishRecipe | User | `createdBy.userId` |
| ToppingRecipe | Topping | `toppingId` |
| ToppingRecipe | Ingredient[] | `ingredients[].ingredientId` |
| IngredientTransaction | Ingredient | `ingredientId` |
| IngredientTransaction | Order | `exportDetails.orderId` |
| IngredientTransaction | Dish | `exportDetails.dishId` |
| IngredientTransaction | Vendor | `importDetails.supplierId` |
| IngredientTransaction | User | `createdBy.userId` |
| Spending | SpendingCategory | `category` |
| Spending | Vendor | `vendor` |
| Spending | User | `createdBy.userId`, `approvedBy.userId` |
| Schedule | ShiftTemplate | `shiftTemplate` |
| Schedule | User[] | `assignedMembers[].member` |
| Schedule | User | `createdBy`, `lastModifiedBy` |
| ExtraWork | User | `member`, `createdBy`, `lastModifiedBy`, `approvedBy` |
| Table | Order | `currentOrder` |

---

## Data Integrity Rules

### Required Relationships
- Dish **must** have a Category
- OrderItem **must** reference a Dish
- Order **must** have at least one OrderItem
- Schedule **must** have a ShiftTemplate
- Schedule **must** have at least one assignedMember
- Spending **must** have a SpendingCategory

### Optional Relationships
- Order can exist without a Table
- Order can exist without a Payment
- Dish can exist without a DishRecipe
- Topping can exist without a ToppingRecipe
- OrderItem can exist without Toppings
- Order can exist without Promotions

### Unique Constraints
- User.phone (unique)
- Customer.phone (unique)
- Category.name (unique)
- Table.tableNo (unique)
- Promotion.code (unique, sparse)
- Ingredient.name (unique)
- Ingredient.code (unique)
- IngredientTransaction.transactionNumber (unique)
- DishRecipe.dishId (unique)
- ToppingRecipe.toppingId (unique)
- ShiftTemplate.name (unique)

---

## Common Query Patterns

### Get Order with Full Details
```javascript
Order.findById(orderId)
  .populate('createdBy.userId', 'name role')
  .populate('items.dishId', 'name price image')
  .populate('items.toppings.toppingId', 'name price')
  .populate('appliedPromotions.promotionId', 'name type discount')
```

### Get Dish with Recipe and Ingredients
```javascript
Dish.findById(dishId)
  .populate('category', 'name color')
  .populate('compatibleToppings', 'name price')
  
DishRecipe.findOne({ dishId })
  .populate('ingredients.ingredientId', 'name code unit costs')
```

### Get Schedule with Users
```javascript
Schedule.find({ date: targetDate })
  .populate('shiftTemplate', 'name startTime endTime')
  .populate('assignedMembers.member', 'name role phone')
```

### Get Spending with Category and Vendor
```javascript
Spending.find({ paymentStatus: 'pending' })
  .populate('category', 'name color')
  .populate('vendor', 'name phone')
  .populate('approvedBy.userId', 'name')
```

---

## Model Dependencies

### High-Level Dependencies
```
User (foundation)
  ├── Order
  ├── Promotion
  ├── Schedule
  ├── ExtraWork
  ├── Spending
  ├── DishRecipe
  └── Ingredient

Category (foundation)
  └── Dish

Dish (core)
  ├── OrderItem
  ├── DishRecipe
  └── Promotion (target)

Ingredient (foundation)
  ├── DishRecipe
  ├── ToppingRecipe
  └── IngredientTransaction
```

### Circular Dependencies
- **Order ↔ Promotion**: Orders can have Promotions, Promotions can target Orders
- **Dish ↔ Topping**: Dishes can have compatible Toppings, Toppings can be added to Dishes
- **Schedule ↔ User**: Schedules assign Users, Users are in Schedules

---

## Notes

1. **Embedded vs Referenced**: OrderItems are embedded for performance, but still reference Dish for population
2. **Soft Deletes**: Most models use `isActive` flag instead of hard deletes
3. **Audit Trail**: Most models track `createdBy` and `lastModifiedBy` with User references
4. **Timestamps**: All models have automatic `createdAt` and `updatedAt` timestamps
5. **Virtual Fields**: Many models have virtual fields for computed values (e.g., `totalItems`, `stockStatus`)
