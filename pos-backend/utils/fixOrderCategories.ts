// @ts-nocheck
import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Dish from "../models/dishModel.js";
import Category from "../models/categoryModel.js"; // Load Category model
import config from "../config/config.js";
import { isMainModule } from "./isMainModule.js";

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.databaseURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix orders with undefined categories
const fixOrderCategories = async () => {
  try {
    console.log('🔍 Looking for orders with undefined categories...');
    
    // Find orders with items that have undefined or null categories
    const ordersWithUndefinedCategories = await Order.find({
      'items.category': { $in: [null, undefined, 'Unknown'] }
    });

    console.log(`📊 Found ${ordersWithUndefinedCategories.length} orders with undefined categories`);

    if (ordersWithUndefinedCategories.length === 0) {
      console.log('✅ No orders with undefined categories found');
      return;
    }

    let updatedOrdersCount = 0;
    let updatedItemsCount = 0;

    for (const order of ordersWithUndefinedCategories) {
      let orderNeedsUpdate = false;
      
      for (const item of order.items) {
        if (!item.category || item.category === 'Unknown') {
          // Skip items with undefined dishId
          if (!item.dishId) {
            console.warn(`⚠️  Skipping item "${item.name}" - dishId is undefined`);
            continue;
          }

          try {
            // Fetch the dish to get its category
            const dish = await Dish.findById(item.dishId).populate('category', 'name');
            
            if (dish && dish.category && dish.category.name) {
              console.log(`🔄 Updating item "${item.name}" category from "${item.category}" to "${dish.category.name}"`);
              item.category = dish.category.name;
              updatedItemsCount++;
              orderNeedsUpdate = true;
            } else {
              console.warn(`⚠️  Could not find category for dish ID: ${item.dishId} (item: ${item.name})`);
            }
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`❌ Error processing item ${item.name}:`, msg);
          }
        }
      }

      if (orderNeedsUpdate) {
        try {
          await order.save();
          updatedOrdersCount++;
          console.log(`✅ Updated order ${order._id}`);
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error(`❌ Error saving order ${order._id}:`, msg);
        }
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   - Orders processed: ${ordersWithUndefinedCategories.length}`);
    console.log(`   - Orders updated: ${updatedOrdersCount}`);
    console.log(`   - Items updated: ${updatedItemsCount}`);
    console.log('✅ Category fix completed!');

  } catch (error) {
    console.error('❌ Error fixing order categories:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixOrderCategories();
  await mongoose.connection.close();
  console.log('🔌 Disconnected from MongoDB');
  process.exit(0);
};

// Run the script
if (isMainModule(import.meta.url)) {
  main().catch((error) => {
    console.error('❌ Script execution error:', error);
    process.exit(1);
  });
}

export { fixOrderCategories };