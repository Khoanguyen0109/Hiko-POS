const mongoose = require("mongoose");
const { SpendingCategory, Vendor } = require("../models/spendingModel");
const config = require("../config/config");

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(config.databaseURI);
        console.log("✅ Connected to MongoDB for seeding");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

// Default spending categories for restaurants
const defaultCategories = [
    {
        name: "Food & Ingredients",
        description: "Raw materials, ingredients, and food supplies",
        color: "#10B981"
    },
    {
        name: "Kitchen Equipment",
        description: "Cooking equipment, appliances, and kitchen tools",
        color: "#F59E0B"
    },
    {
        name: "Utilities",
        description: "Electricity, water, gas, internet, and phone bills",
        color: "#3B82F6"
    },
    {
        name: "Rent & Property",
        description: "Rent, property taxes, insurance, and maintenance",
        color: "#8B5CF6"
    },
    {
        name: "Staff & Payroll",
        description: "Salaries, wages, benefits, and staff-related expenses",
        color: "#EF4444"
    },
    {
        name: "Marketing & Advertising",
        description: "Promotional materials, advertising, and marketing campaigns",
        color: "#F97316"
    },
    {
        name: "Cleaning & Supplies",
        description: "Cleaning materials, disposables, and hygiene supplies",
        color: "#06B6D4"
    },
    {
        name: "Professional Services",
        description: "Accounting, legal, consulting, and professional fees",
        color: "#84CC16"
    },
    {
        name: "Transportation",
        description: "Delivery, fuel, vehicle maintenance, and transportation costs",
        color: "#EC4899"
    },
    {
        name: "Technology",
        description: "POS systems, software subscriptions, and IT equipment",
        color: "#6366F1"
    },
    {
        name: "Licenses & Permits",
        description: "Business licenses, health permits, and regulatory fees",
        color: "#14B8A6"
    },
    {
        name: "Maintenance & Repairs",
        description: "Equipment repairs, facility maintenance, and upkeep",
        color: "#F43F5E"
    },
    {
        name: "Office Supplies",
        description: "Stationery, printing, and administrative supplies",
        color: "#64748B"
    },
    {
        name: "Training & Development",
        description: "Staff training, courses, and skill development programs",
        color: "#7C3AED"
    },
    {
        name: "Miscellaneous",
        description: "Other expenses that don't fit into specific categories",
        color: "#6B7280"
    }
];

// Sample vendors for restaurants
const defaultVendors = [
    {
        name: "Fresh Market Suppliers",
        contactPerson: "Nguyen Van A",
        phone: "+84 123 456 789",
        email: "contact@freshmarket.vn",
        address: {
            street: "123 Nguyen Trai Street",
            city: "Ho Chi Minh City",
            state: "Ho Chi Minh",
            zipCode: "700000",
            country: "Vietnam"
        },
        paymentTerms: "net_7",
        notes: "Primary supplier for fresh vegetables and fruits"
    },
    {
        name: "Kitchen Pro Equipment",
        contactPerson: "Tran Thi B",
        phone: "+84 987 654 321",
        email: "sales@kitchenpro.vn",
        address: {
            street: "456 Le Van Sy Street",
            city: "Ho Chi Minh City",
            state: "Ho Chi Minh",
            zipCode: "700000",
            country: "Vietnam"
        },
        paymentTerms: "net_30",
        notes: "Kitchen equipment and appliance supplier"
    },
    {
        name: "Clean & Fresh Supplies",
        contactPerson: "Le Van C",
        phone: "+84 555 123 456",
        email: "orders@cleanfresh.vn",
        address: {
            street: "789 Vo Van Tan Street",
            city: "Ho Chi Minh City",
            state: "Ho Chi Minh",
            zipCode: "700000",
            country: "Vietnam"
        },
        paymentTerms: "immediate",
        notes: "Cleaning supplies and disposables"
    },
    {
        name: "Saigon Meat & Seafood",
        contactPerson: "Pham Van D",
        phone: "+84 333 777 888",
        email: "info@saigonmeat.vn",
        address: {
            street: "321 Hai Ba Trung Street",
            city: "Ho Chi Minh City",
            state: "Ho Chi Minh",
            zipCode: "700000",
            country: "Vietnam"
        },
        paymentTerms: "net_15",
        notes: "Premium meat and seafood supplier"
    },
    {
        name: "Tech Solutions Vietnam",
        contactPerson: "Do Thi E",
        phone: "+84 222 333 444",
        email: "support@techsolutions.vn",
        address: {
            street: "654 Nguyen Hue Street",
            city: "Ho Chi Minh City",
            state: "Ho Chi Minh",
            zipCode: "700000",
            country: "Vietnam"
        },
        paymentTerms: "net_30",
        notes: "POS systems and technology solutions"
    }
];

const seedSpendingData = async () => {
    try {
        console.log("🌱 Starting spending data seeding...");

        // Clear existing data
        await SpendingCategory.deleteMany({});
        await Vendor.deleteMany({});
        console.log("🗑️  Cleared existing spending categories and vendors");

        // Seed categories
        const categories = await SpendingCategory.insertMany(defaultCategories);
        console.log(`✅ Created ${categories.length} spending categories`);

        // Seed vendors
        const vendors = await Vendor.insertMany(defaultVendors);
        console.log(`✅ Created ${vendors.length} vendors`);

        console.log("🎉 Spending data seeding completed successfully!");
        
        // Display created data
        console.log("\n📊 Created Categories:");
        categories.forEach(cat => {
            console.log(`  - ${cat.name} (${cat.color})`);
        });

        console.log("\n🏢 Created Vendors:");
        vendors.forEach(vendor => {
            console.log(`  - ${vendor.name} (${vendor.paymentTerms})`);
        });

    } catch (error) {
        console.error("❌ Error seeding spending data:", error);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Database connection closed");
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    connectDB().then(() => {
        seedSpendingData();
    });
}

module.exports = { seedSpendingData, defaultCategories, defaultVendors };
