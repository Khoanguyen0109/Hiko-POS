/**
 * Week Number Calculator
 * 
 * This utility helps you understand which dates correspond to which week numbers.
 * 
 * Usage: node week-calculator.js
 */

function getWeekNumber(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return { year, weekNumber, date: d.toISOString().split('T')[0] };
}

function getDateRangeForWeek(year, weekNumber) {
    // Calculate the first day of the year
    const firstDayOfYear = new Date(year, 0, 1);
    const firstWeekDay = firstDayOfYear.getDay();
    
    // Calculate days to add to get to the target week
    const daysToAdd = (weekNumber - 1) * 7 - firstWeekDay;
    
    // Start of week
    const weekStart = new Date(year, 0, 1 + daysToAdd);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
    };
}

console.log('\n📅 Week Number Calculator for 2025\n');
console.log('=' .repeat(60));

// Show some key dates
console.log('\n📆 Sample Dates and Their Week Numbers:\n');

const sampleDates = [
    '2025-01-01',  // Week 1
    '2025-08-12',  // Your date
    '2025-12-08',  // Week 50
    '2025-12-14',  // Week 50
    '2025-12-15',  // Week 51
    '2025-12-31',  // Week 53
];

sampleDates.forEach(date => {
    const info = getWeekNumber(date);
    console.log(`   ${info.date} → Week ${info.weekNumber}`);
});

console.log('\n' + '=' .repeat(60));
console.log('\n📊 Week 50 of 2025:\n');

const week50Range = getDateRangeForWeek(2025, 50);
console.log(`   Start: ${week50Range.start}`);
console.log(`   End:   ${week50Range.end}`);

console.log('\n' + '=' .repeat(60));
console.log('\n🔍 Your Schedule Analysis:\n');

const yourDate = '2025-08-12';
const yourInfo = getWeekNumber(yourDate);
console.log(`   Date you used:       ${yourDate}`);
console.log(`   Calculated week:     ${yourInfo.weekNumber}`);
console.log(`   Week you queried:    50`);
console.log(`   Match:               ${yourInfo.weekNumber === 50 ? '✅ YES' : '❌ NO'}`);

console.log('\n' + '=' .repeat(60));
console.log('\n💡 Solutions:\n');

console.log(`   Option 1: Query the correct week for ${yourDate}`);
console.log(`   → GET /api/schedule/week/2025/${yourInfo.weekNumber}\n`);

console.log(`   Option 2: Create schedule for week 50 dates`);
console.log(`   → Use date between ${week50Range.start} and ${week50Range.end}\n`);

console.log('=' .repeat(60));

// Show all weeks for December 2025
console.log('\n📅 December 2025 Weeks:\n');

for (let day = 1; day <= 31; day++) {
    const date = `2025-12-${day.toString().padStart(2, '0')}`;
    const info = getWeekNumber(date);
    if (day === 1 || day === 8 || day === 15 || day === 22 || day === 29) {
        console.log(`   ${info.date} → Week ${info.weekNumber}`);
    }
}

console.log('\n' + '=' .repeat(60));
console.log('\n✅ Now you know which dates correspond to which weeks!\n');

// Interactive mode
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askForDate() {
    rl.question('\n🔍 Enter a date (YYYY-MM-DD) to check its week number (or "exit" to quit): ', (input) => {
        if (input.toLowerCase() === 'exit' || !input) {
            console.log('\n👋 Goodbye!\n');
            rl.close();
            return;
        }
        
        try {
            const info = getWeekNumber(input);
            console.log(`\n   ✅ ${info.date} is in Week ${info.weekNumber} of ${info.year}`);
            
            const range = getDateRangeForWeek(info.year, info.weekNumber);
            console.log(`   Week ${info.weekNumber} Range: ${range.start} to ${range.end}`);
            
            askForDate();
        } catch (error) {
            console.log(`\n   ❌ Invalid date format. Please use YYYY-MM-DD`);
            askForDate();
        }
    });
}

askForDate();

