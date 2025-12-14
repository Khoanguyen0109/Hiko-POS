const ShiftTemplate = require("../models/shiftTemplateModel");
const connectDB = require("../config/database");

const defaultTemplates = [
    {
        name: "Morning Shift",
        shortName: "MORNING",
        startTime: "07:00",
        endTime: "12:30",
        color: "#FF6B6B",
        description: "Early morning operations and breakfast service",
        isActive: true
    },
    {
        name: "Afternoon Shift",
        shortName: "AFTERNOON",
        startTime: "12:30",
        endTime: "17:30",
        color: "#4ECDC4",
        description: "Lunch and afternoon service",
        isActive: true
    },
    {
        name: "Evening Shift",
        shortName: "EVENING",
        startTime: "17:30",
        endTime: "22:30",
        color: "#95E1D3",
        description: "Dinner service and closing operations",
        isActive: true
    }
];

const seedShiftTemplates = async () => {
    try {
        console.log("🔄 Connecting to database...");
        await connectDB();
        
        console.log("🗑️  Clearing existing shift templates...");
        await ShiftTemplate.deleteMany({});
        
        console.log("📥 Inserting default shift templates...");
        const templates = await ShiftTemplate.insertMany(defaultTemplates);
        
        console.log("✅ Shift templates seeded successfully!");
        console.log(`✅ Created ${templates.length} templates:`);
        templates.forEach(template => {
            console.log(`   - ${template.name} (${template.startTime} - ${template.endTime}) - ${template.durationHours} hours`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding shift templates:", error);
        process.exit(1);
    }
};

seedShiftTemplates();

