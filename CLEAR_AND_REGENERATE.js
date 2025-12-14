// ===================================================================
// CLEAR ALL SCHEDULES AND REGENERATE WEEK 50
// ===================================================================
// Copy and paste this entire script into your browser console
// (Press F12 → Console tab while logged in as admin)
// ===================================================================

(async function clearAndRegenerateSchedules() {
    console.log('🚀 Starting Schedule Clear & Regenerate...\n');
    
    // Get auth token
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.error('❌ No auth token found! Please login first.');
        alert('Please login first, then run this script again.');
        return;
    }
    
    console.log('✅ Auth token found\n');
    
    // ==================== STEP 1: DELETE ALL SCHEDULES ====================
    console.log('📋 STEP 1: Fetching all schedules...');
    
    try {
        // Get all schedules for Week 50
        const getResponse = await fetch('http://localhost:3000/api/schedule/week/2025/50', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const scheduleData = await getResponse.json();
        const schedules = scheduleData.data || [];
        
        console.log(`Found ${schedules.length} schedules in Week 50`);
        
        if (schedules.length > 0) {
            console.log('🗑️  Deleting all Week 50 schedules...\n');
            
            let deleted = 0;
            for (const schedule of schedules) {
                try {
                    const deleteResponse = await fetch(`http://localhost:3000/api/schedule/${schedule._id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (deleteResponse.ok) {
                        deleted++;
                        console.log(`✅ Deleted: ${schedule._id}`);
                    } else {
                        console.warn(`⚠️  Failed to delete: ${schedule._id}`);
                    }
                } catch (err) {
                    console.error(`❌ Error deleting ${schedule._id}:`, err.message);
                }
                
                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log(`\n✅ Deleted ${deleted} out of ${schedules.length} schedules\n`);
        }
        
        // ==================== STEP 2: REGENERATE SCHEDULES ====================
        console.log('📋 STEP 2: Regenerating Week 50 schedules...\n');
        
        // Get shift templates
        const templatesResponse = await fetch('http://localhost:3000/api/shift-template', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const templatesData = await templatesResponse.json();
        const templates = templatesData.data || [];
        
        if (templates.length === 0) {
            console.error('❌ No shift templates found! Create templates first.');
            alert('No shift templates found! Please create shift templates first.');
            return;
        }
        
        console.log(`Found ${templates.length} shift templates:`, templates.map(t => t.name).join(', '));
        
        // Get members
        const membersResponse = await fetch('http://localhost:3000/api/member', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const membersData = await membersResponse.json();
        const members = membersData.data || [];
        
        console.log(`Found ${members.length} members\n`);
        
        if (members.length === 0) {
            console.warn('⚠️  No members found. Creating schedules without assignments.');
        }
        
        // Week 50 dates: Dec 8-14, 2025 (Monday to Sunday)
        const dates = [
            { date: '2025-12-08', day: 'Monday' },
            { date: '2025-12-09', day: 'Tuesday' },
            { date: '2025-12-10', day: 'Wednesday' },
            { date: '2025-12-11', day: 'Thursday' },
            { date: '2025-12-12', day: 'Friday' },
            { date: '2025-12-13', day: 'Saturday' },
            { date: '2025-12-14', day: 'Sunday' }  // ← THIS IS THE IMPORTANT ONE!
        ];
        
        console.log('🗓️  Creating schedules for Week 50 (Dec 8-14)...\n');
        
        let created = 0;
        let errors = 0;
        
        for (const { date, day } of dates) {
            for (const template of templates) {
                try {
                    const payload = {
                        date: date,
                        shiftTemplateId: template._id,
                        memberIds: [],
                        year: 2025,
                        weekNumber: 50,
                        notes: `Week 50 schedule - ${day}`
                    };
                    
                    const createResponse = await fetch('http://localhost:3000/api/schedule', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });
                    
                    const result = await createResponse.json();
                    
                    if (createResponse.ok) {
                        created++;
                        console.log(`✅ ${day} ${date} - ${template.name} (Week ${result.data.weekNumber})`);
                    } else {
                        errors++;
                        console.error(`❌ ${day} ${date} - ${template.name}: ${result.message}`);
                    }
                    
                } catch (err) {
                    errors++;
                    console.error(`❌ Error creating ${day} ${template.name}:`, err.message);
                }
                
                // Small delay
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 COMPLETE!');
        console.log('='.repeat(60));
        console.log(`✅ Created: ${created} schedules`);
        console.log(`❌ Errors: ${errors}`);
        console.log('\n📝 Next Steps:');
        console.log('1. Refresh this page (Ctrl+R or Cmd+R)');
        console.log('2. Go to Weekly Schedule → Week 50');
        console.log('3. You should see all dates (Mon-Sun) with empty shifts');
        console.log('4. Click any cell to assign members');
        console.log('5. Sunday (Dec 14) should now work correctly! 🎊\n');
        
        alert(`✅ Success!\n\nCreated ${created} schedules for Week 50\n\nRefresh the page to see them!`);
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        alert(`Error: ${error.message}`);
    }
})();

