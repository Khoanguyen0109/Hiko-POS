const mongoose = require('mongoose');
const Promotion = require('../models/promotionModel');
const { getCurrentVietnamTime } = require('../utils/dateUtils');

// Sample promotion data for testing
const samplePromotions = [
  {
    name: "10% Off All Orders",
    description: "Get 10% discount on your entire order",
    code: "SAVE10",
    type: "order_percentage",
    discount: {
      percentage: 10
    },
    applicableItems: "all_order",
    conditions: {
      minOrderAmount: 20
    },
    isActive: true,
    startDate: getCurrentVietnamTime(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    priority: 1
  },
  {
    name: "Happy Hour - 25% Off Beverages",
    description: "25% off all beverages during happy hour",
    code: "HAPPYHOUR",
    type: "happy_hour",
    discount: {
      percentage: 25
    },
    applicableItems: "categories",
    conditions: {
      timeSlots: [
        { start: "15:00", end: "17:00" }, // 3 PM - 5 PM
        { start: "20:00", end: "22:00" }  // 8 PM - 10 PM
      ],
      daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    },
    isActive: true,
    startDate: getCurrentVietnamTime(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    priority: 2
  },
  {
    name: "Weekend Special - $5 Off",
    description: "Fixed $5 discount on weekend orders",
    code: "WEEKEND5",
    type: "order_fixed",
    discount: {
      fixedAmount: 5
    },
    applicableItems: "all_order",
    conditions: {
      minOrderAmount: 25,
      daysOfWeek: ["saturday", "sunday"]
    },
    isActive: true,
    startDate: getCurrentVietnamTime(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    priority: 3
  },
  {
    name: "New Customer Welcome",
    description: "20% off for new customers",
    code: "WELCOME20",
    type: "order_percentage",
    discount: {
      percentage: 20
    },
    applicableItems: "all_order",
    conditions: {
      minOrderAmount: 15,
      usageLimit: 100,
      perCustomerLimit: 1
    },
    isActive: true,
    startDate: getCurrentVietnamTime(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    priority: 5
  }
];

// Function to seed promotions
const seedPromotions = async () => {
  try {
    console.log('🌱 Seeding promotions...');
    
    // Clear existing promotions (optional)
    // await Promotion.deleteMany({});
    // console.log('Cleared existing promotions');
    
    // Insert sample promotions
    const createdPromotions = await Promotion.insertMany(samplePromotions);
    console.log(`✅ Created ${createdPromotions.length} sample promotions`);
    
    // Display created promotions
    createdPromotions.forEach(promotion => {
      console.log(`- ${promotion.name} (${promotion.code})`);
    });
    
    return createdPromotions;
  } catch (error) {
    console.error('❌ Error seeding promotions:', error);
    throw error;
  }
};

// Export for use in other files
module.exports = {
  seedPromotions,
  samplePromotions
};

// Run directly if this file is executed
if (require.main === module) {
  const connectDB = require('../config/database');
  
  const runSeed = async () => {
    try {
      await connectDB();
      await seedPromotions();
      console.log('🎉 Promotion seeding completed!');
      process.exit(0);
    } catch (error) {
      console.error('Failed to seed promotions:', error);
      process.exit(1);
    }
  };
  
  runSeed();
}

