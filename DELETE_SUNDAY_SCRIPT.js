// ===================================================================
// DELETE OLD SUNDAY SCHEDULE SCRIPT
// ===================================================================
// Copy and paste this entire script into your browser console
// (Press F12 → Console tab)
// ===================================================================

(async function deleteSundaySchedule() {
    console.log('🗑️ Starting Sunday schedule deletion...\n');
    
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
        console.error('❌ No auth token found! Please login first.');
        alert('Please login first, then run this script again.');
        return;
    }
    
    console.log('✅ Auth token found');
    
    // Schedule ID to delete (Week 51 Sunday schedule)
    const scheduleId = '693e268a7af72cbf2c2ed7ac';
    
    try {
        console.log(`📤 Deleting schedule: ${scheduleId}...`);
        
        const response = await fetch(`http://localhost:3000/api/schedule/${scheduleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ SUCCESS! Schedule deleted:', data);
            console.log('\n🎉 Next steps:');
            console.log('1. Refresh this page (Ctrl+R or Cmd+R)');
            console.log('2. Go to Week 50');
            console.log('3. Click on Sunday (Dec 14)');
            console.log('4. Assign members and save');
            console.log('5. Sunday will now show members! 🎊\n');
            
            alert('✅ Schedule deleted successfully!\n\nNext: Refresh page → Create new Sunday schedule');
        } else {
            console.error('❌ Failed to delete:', data);
            alert(`Failed: ${data.message || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert(`Error: ${error.message}`);
    }
})();

