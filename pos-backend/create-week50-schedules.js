/**
 * Create Test Schedules for Week 50 (December 8-14, 2025)
 * 
 * This script creates sample schedules with assigned members for Week 50
 * so you can test the /api/schedule/week/2025/50 endpoint
 * 
 * Usage: node create-week50-schedules.js
 */

const mongoose = require('mongoose');
const config = require('./config/config');
const Schedule = require('./models/scheduleModel');
const User = require('./models/userModel');
const ShiftTemplate = require('./models/shiftTemplateModel');

// Connect to MongoDB
mongoose.connect(config.databaseURI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

async function createWeek50Schedules() {
    try {
        console.log('\n🎯 Creating Schedules for Week 50 (December 8-14, 2025)\n');
        console.log('=' .repeat(60));

        // Get admin user (creator)
        const admin = await User.findOne({ role: 'Admin' });
        if (!admin) {
            console.error('❌ No admin user found. Please create an admin first.');
            process.exit(1);
        }
        console.log(`✅ Found admin: ${admin.name}`);

        // Get active shift templates
        const shiftTemplates = await ShiftTemplate.find({ isActive: true }).sort({ startTime: 1 });
        if (shiftTemplates.length === 0) {
            console.error('❌ No active shift templates found. Please create shift templates first.');
            process.exit(1);
        }
        console.log(`✅ Found ${shiftTemplates.length} shift template(s):`);
        shiftTemplates.forEach((st, i) => {
            console.log(`   ${i + 1}. ${st.name} (${st.startTime} - ${st.endTime})`);
        });

        // Get active members (exclude admin)
        const members = await User.find({ 
            role: { $ne: 'Admin' },
            isActive: { $ne: false }
        });
        
        if (members.length === 0) {
            console.error('❌ No active members found. Please create members first.');
            process.exit(1);
        }
        console.log(`✅ Found ${members.length} active member(s):`);
        members.forEach((m, i) => {
            console.log(`   ${i + 1}. ${m.name} (${m.role})`);
        });

        console.log('\n' + '=' .repeat(60));
        console.log('\n📅 Creating Schedules...\n');

        // Week 50 dates: December 8-14, 2025
        const week50Dates = [
            '2025-12-08', // Monday
            '2025-12-09', // Tuesday
            '2025-12-10', // Wednesday
            '2025-12-11', // Thursday
            '2025-12-12', // Friday
            '2025-12-13', // Saturday
            '2025-12-14', // Sunday
        ];

        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        let createdCount = 0;
        let existingCount = 0;

        // Create schedules for each day and each shift
        for (let dayIndex = 0; dayIndex < week50Dates.length; dayIndex++) {
            const date = week50Dates[dayIndex];
            const dayName = dayNames[dayIndex];

            console.log(`📆 ${dayName}, ${date}`);

            for (const shiftTemplate of shiftTemplates) {
                // Check if schedule already exists
                const scheduleDate = new Date(date);
                scheduleDate.setHours(0, 0, 0, 0);

                const existingSchedule = await Schedule.findOne({
                    date: scheduleDate,
                    shiftTemplate: shiftTemplate._id
                });

                if (existingSchedule) {
                    console.log(`   ⏭️  ${shiftTemplate.name} - Already exists (${existingSchedule.assignedMembers.length} members)`);
                    existingCount++;
                    continue;
                }

                // Randomly assign 1-3 members to each shift
                const numberOfMembers = Math.floor(Math.random() * 3) + 1;
                const shuffledMembers = [...members].sort(() => 0.5 - Math.random());
                const selectedMembers = shuffledMembers.slice(0, numberOfMembers);

                const assignedMembers = selectedMembers.map(member => ({
                    member: member._id,
                    status: 'scheduled',
                    notes: ''
                }));

                // Calculate year and week number
                const year = scheduleDate.getFullYear();
                const firstDayOfYear = new Date(scheduleDate.getFullYear(), 0, 1);
                const pastDaysOfYear = (scheduleDate - firstDayOfYear) / 86400000;
                const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

                // Create schedule
                const schedule = new Schedule({
                    date: scheduleDate,
                    shiftTemplate: shiftTemplate._id,
                    assignedMembers,
                    notes: `Week 50 schedule - ${dayName}`,
                    year,
                    weekNumber,
                    createdBy: admin._id
                });

                await schedule.save();

                const memberNames = selectedMembers.map(m => m.name).join(', ');
                console.log(`   ✅ ${shiftTemplate.name} - Created with ${numberOfMembers} member(s): ${memberNames}`);
                createdCount++;
            }
            console.log();
        }

        console.log('=' .repeat(60));
        console.log('\n📊 Summary:\n');
        console.log(`   ✅ Created: ${createdCount} schedule(s)`);
        console.log(`   ⏭️  Skipped (existing): ${existingCount} schedule(s)`);
        console.log(`   📅 Week: 50 of 2025`);
        console.log(`   📆 Date Range: December 8-14, 2025`);

        console.log('\n' + '=' .repeat(60));
        console.log('\n✅ Now test the API:\n');
        console.log('   GET http://localhost:3000/api/schedule/week/2025/50\n');
        console.log('   You should see schedules with assigned members!\n');

        // Verify the created schedules
        const verifySchedules = await Schedule.find({
            year: 2025,
            weekNumber: 50
        })
        .populate('shiftTemplate')
        .populate('assignedMembers.member', 'name role');

        console.log('=' .repeat(60));
        console.log('\n🔍 Verification:\n');
        console.log(`   Found ${verifySchedules.length} schedule(s) in Week 50`);
        
        let totalMembers = 0;
        verifySchedules.forEach(s => {
            totalMembers += s.assignedMembers.length;
        });
        console.log(`   Total member assignments: ${totalMembers}`);

        if (verifySchedules.length > 0) {
            console.log('\n   Sample Schedule:');
            const sample = verifySchedules[0];
            console.log(`   • Date: ${sample.date.toISOString().split('T')[0]}`);
            console.log(`   • Shift: ${sample.shiftTemplate.name}`);
            console.log(`   • Members: ${sample.assignedMembers.length}`);
            if (sample.assignedMembers.length > 0) {
                sample.assignedMembers.forEach((am, i) => {
                    console.log(`     ${i + 1}. ${am.member.name} (${am.member.role})`);
                });
            }
        }

        console.log('\n' + '=' .repeat(60));
        console.log('\n🎉 Done! Week 50 is ready for testing.\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Disconnected from MongoDB\n');
        process.exit(0);
    }
}

// Run the script
createWeek50Schedules();

