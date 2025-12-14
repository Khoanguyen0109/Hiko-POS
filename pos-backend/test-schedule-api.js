/**
 * Schedule API Test Script
 * 
 * This script tests the schedule API to verify that assigned members are being populated correctly.
 * 
 * Usage:
 * 1. Make sure MongoDB is running
 * 2. Make sure backend server is running (npm run dev)
 * 3. Run: node test-schedule-api.js
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

async function testSchedulePopulation() {
    try {
        console.log('\n🧪 Testing Schedule API Population...\n');

        // Get current week info
        const now = new Date();
        const currentYear = now.getFullYear();
        const firstDayOfYear = new Date(currentYear, 0, 1);
        const pastDaysOfYear = (now - firstDayOfYear) / 86400000;
        const currentWeek = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

        console.log(`📅 Current Year: ${currentYear}, Week: ${currentWeek}\n`);

        // Test 1: Find schedules for current week
        console.log('Test 1: Finding schedules for current week...');
        const schedules = await Schedule.find({
            year: currentYear,
            weekNumber: currentWeek
        })
        .populate('shiftTemplate')
        .populate('assignedMembers.member', '-password')
        .populate('createdBy', 'name email')
        .sort({ date: 1 });

        console.log(`✅ Found ${schedules.length} schedule(s)\n`);

        if (schedules.length === 0) {
            console.log('⚠️  No schedules found for current week.');
            console.log('   Create schedules using the frontend or API first.\n');
            
            // Show available schedules
            const allSchedules = await Schedule.find()
                .sort({ date: -1 })
                .limit(5);
            
            if (allSchedules.length > 0) {
                console.log('📋 Recent schedules in database:');
                allSchedules.forEach((s, i) => {
                    console.log(`   ${i + 1}. Date: ${s.date.toISOString().split('T')[0]}, Year: ${s.year}, Week: ${s.weekNumber}, Members: ${s.assignedMembers.length}`);
                });
                console.log();
            }
        } else {
            // Test 2: Inspect populated data
            console.log('Test 2: Inspecting populated member data...\n');
            
            schedules.forEach((schedule, index) => {
                console.log(`📋 Schedule ${index + 1}:`);
                console.log(`   ID: ${schedule._id}`);
                console.log(`   Date: ${schedule.date.toISOString().split('T')[0]}`);
                console.log(`   Shift: ${schedule.shiftTemplate?.name || 'Unknown'}`);
                console.log(`   Assigned Members: ${schedule.assignedMembers.length}`);
                
                if (schedule.assignedMembers.length > 0) {
                    schedule.assignedMembers.forEach((am, i) => {
                        if (typeof am.member === 'object' && am.member !== null) {
                            console.log(`      ${i + 1}. ✅ ${am.member.name} (${am.member.role}) - Status: ${am.status}`);
                        } else {
                            console.log(`      ${i + 1}. ⚠️  Member not populated (ID: ${am.member}) - Status: ${am.status}`);
                        }
                    });
                } else {
                    console.log('      ⚠️  No members assigned');
                }
                console.log();
            });

            // Test 3: Check member existence
            console.log('Test 3: Verifying member documents exist...');
            const allMembers = await User.find({ role: { $ne: 'Admin' } })
                .select('name email phone role isActive')
                .limit(10);
            
            console.log(`✅ Found ${allMembers.length} member(s) in database\n`);
            
            if (allMembers.length > 0) {
                console.log('👥 Available Members:');
                allMembers.forEach((member, i) => {
                    const activeStatus = member.isActive !== false ? '✓ Active' : '✗ Inactive';
                    console.log(`   ${i + 1}. ${member.name} (${member.role}) - ${activeStatus}`);
                });
                console.log();
            }

            // Test 4: Check for unassigned members
            const allSchedulesData = schedules.map(s => s.toObject());
            const assignedMemberIds = new Set();
            allSchedulesData.forEach(s => {
                s.assignedMembers.forEach(am => {
                    const memberId = am.member?._id || am.member;
                    if (memberId) assignedMemberIds.add(memberId.toString());
                });
            });

            const unassignedMembers = allMembers.filter(m => 
                !assignedMemberIds.has(m._id.toString())
            );

            if (unassignedMembers.length > 0) {
                console.log('📝 Members not assigned to any schedule this week:');
                unassignedMembers.forEach((member, i) => {
                    console.log(`   ${i + 1}. ${member.name} (${member.role})`);
                });
                console.log();
            }
        }

        // Test 5: Check shift templates
        console.log('Test 4: Checking shift templates...');
        const shiftTemplates = await ShiftTemplate.find({ isActive: true });
        console.log(`✅ Found ${shiftTemplates.length} active shift template(s)\n`);
        
        if (shiftTemplates.length > 0) {
            console.log('⏰ Active Shift Templates:');
            shiftTemplates.forEach((st, i) => {
                console.log(`   ${i + 1}. ${st.name} (${st.startTime} - ${st.endTime})`);
            });
            console.log();
        } else {
            console.log('⚠️  No active shift templates found. Create shift templates first.\n');
        }

        // Summary
        console.log('📊 Summary:');
        console.log(`   • Schedules this week: ${schedules.length}`);
        console.log(`   • Total members: ${allMembers.length || 0}`);
        console.log(`   • Active shift templates: ${shiftTemplates.length}`);
        
        let totalAssignments = 0;
        let populatedCount = 0;
        schedules.forEach(s => {
            totalAssignments += s.assignedMembers.length;
            s.assignedMembers.forEach(am => {
                if (typeof am.member === 'object' && am.member !== null) {
                    populatedCount++;
                }
            });
        });
        
        console.log(`   • Total assignments: ${totalAssignments}`);
        console.log(`   • Populated correctly: ${populatedCount}/${totalAssignments}`);
        
        if (totalAssignments > 0 && populatedCount === totalAssignments) {
            console.log('\n✅ All member data is being populated correctly!');
            console.log('   The API should be working. Check frontend console for issues.\n');
        } else if (totalAssignments === 0) {
            console.log('\n⚠️  No member assignments found.');
            console.log('   Assign members to schedules using the frontend.\n');
        } else {
            console.log('\n❌ Some member data is NOT being populated.');
            console.log('   This indicates a database/model issue.\n');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Disconnected from MongoDB\n');
        process.exit(0);
    }
}

// Run the test
testSchedulePopulation();

