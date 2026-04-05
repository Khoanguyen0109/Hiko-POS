/**
 * Test Week 50 API Endpoint
 * 
 * This script tests the GET /api/schedule/week/2025/50 endpoint
 * and shows you the assigned members
 * 
 * Usage: node test-week50-api.js
 */

import mongoose from "mongoose";
import config from "./config/config.js";
import Schedule from "./models/scheduleModel.js";

// Connect to MongoDB
mongoose.connect(config.databaseURI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

async function testWeek50API() {
    try {
        console.log('\n🧪 Testing Week 50 API Endpoint\n');
        console.log('=' .repeat(60));
        console.log('\n📞 Simulating: GET /api/schedule/week/2025/50\n');

        // This is exactly what the API does
        const schedules = await Schedule.find({
            year: 2025,
            weekNumber: 50
        })
        .populate('shiftTemplate')
        .populate('assignedMembers.member', '-password')
        .populate('createdBy', 'name email')
        .sort({ date: 1 });

        console.log('=' .repeat(60));
        console.log(`\n📊 Response: Found ${schedules.length} schedule(s)\n`);

        if (schedules.length === 0) {
            console.log('⚠️  No schedules found for Week 50!\n');
            console.log('💡 Run this command to create test data:');
            console.log('   node create-week50-schedules.js\n');
            return;
        }

        // Group by date
        const schedulesByDate = {};
        schedules.forEach(schedule => {
            const dateStr = schedule.date.toISOString().split('T')[0];
            if (!schedulesByDate[dateStr]) {
                schedulesByDate[dateStr] = [];
            }
            schedulesByDate[dateStr].push(schedule);
        });

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Display schedules by date
        Object.keys(schedulesByDate).sort().forEach(dateStr => {
            const date = new Date(dateStr);
            const dayName = dayNames[date.getUTCDay()];
            
            console.log(`📅 ${dayName}, ${dateStr}`);
            console.log('─'.repeat(60));

            const daySchedules = schedulesByDate[dateStr];
            daySchedules.forEach(schedule => {
                const shift = schedule.shiftTemplate;
                const members = schedule.assignedMembers;

                console.log(`\n   ⏰ ${shift.name} (${shift.startTime} - ${shift.endTime})`);
                
                if (members.length === 0) {
                    console.log('      👤 No members assigned');
                } else {
                    console.log(`      👥 Assigned Members: ${members.length}`);
                    members.forEach((am, index) => {
                        const member = am.member;
                        if (member && typeof member === 'object') {
                            const statusIcon = {
                                'scheduled': '📋',
                                'confirmed': '✅',
                                'completed': '🎯',
                                'absent': '❌',
                                'cancelled': '🚫'
                            }[am.status] || '📋';
                            
                            console.log(`         ${index + 1}. ${statusIcon} ${member.name} (${member.role}) - ${am.status}`);
                        } else {
                            console.log(`         ${index + 1}. ⚠️  Member not populated: ${am.member}`);
                        }
                    });
                }
            });
            console.log();
        });

        console.log('=' .repeat(60));
        console.log('\n📈 Statistics:\n');
        
        let totalAssignments = 0;
        let populatedCount = 0;
        let schedulesByShift = {};

        schedules.forEach(schedule => {
            const shiftName = schedule.shiftTemplate?.name || 'Unknown';
            if (!schedulesByShift[shiftName]) {
                schedulesByShift[shiftName] = 0;
            }
            schedulesByShift[shiftName]++;

            schedule.assignedMembers.forEach(am => {
                totalAssignments++;
                if (am.member && typeof am.member === 'object') {
                    populatedCount++;
                }
            });
        });

        console.log(`   Total Schedules: ${schedules.length}`);
        console.log(`   Total Assignments: ${totalAssignments}`);
        console.log(`   Populated Correctly: ${populatedCount}/${totalAssignments}`);
        
        console.log('\n   Schedules by Shift:');
        Object.entries(schedulesByShift).forEach(([shift, count]) => {
            console.log(`      • ${shift}: ${count}`);
        });

        console.log('\n' + '=' .repeat(60));
        
        if (populatedCount === totalAssignments && totalAssignments > 0) {
            console.log('\n✅ SUCCESS! All member data is populated correctly.\n');
            console.log('   The API endpoint is working perfectly!\n');
            console.log('   💡 Test in browser:');
            console.log('   1. Navigate to Weekly Schedule page');
            console.log('   2. Use week navigator to go to Week 50');
            console.log('   3. You should see all assigned members!\n');
        } else if (totalAssignments === 0) {
            console.log('\n⚠️  Schedules exist but no members are assigned.\n');
            console.log('   💡 Assign members using the frontend or run:');
            console.log('   node create-week50-schedules.js\n');
        } else {
            console.log('\n⚠️  Some member data is not populated.\n');
            console.log('   This may indicate a database issue.\n');
        }

        // Show sample JSON response
        if (schedules.length > 0) {
            console.log('=' .repeat(60));
            console.log('\n📄 Sample JSON Response (first schedule):\n');
            
            const sample = schedules[0].toObject();
            const sampleOutput = {
                _id: sample._id,
                date: sample.date,
                shiftTemplate: {
                    _id: sample.shiftTemplate._id,
                    name: sample.shiftTemplate.name,
                    startTime: sample.shiftTemplate.startTime,
                    endTime: sample.shiftTemplate.endTime,
                    color: sample.shiftTemplate.color
                },
                assignedMembers: sample.assignedMembers.map(am => ({
                    member: am.member ? {
                        _id: am.member._id,
                        name: am.member.name,
                        role: am.member.role
                    } : am.member,
                    status: am.status,
                    notes: am.notes
                })),
                year: sample.year,
                weekNumber: sample.weekNumber,
                notes: sample.notes
            };

            console.log(JSON.stringify(sampleOutput, null, 2));
            console.log();
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB\n');
        process.exit(0);
    }
}

// Run the test
testWeek50API();

