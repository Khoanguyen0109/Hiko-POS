// Get current week number (ISO 8601)
export const getWeekNumber = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    // ISO week date: Thursday in current week decides the year
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNumber;
};

// Get dates in a week (Monday to Sunday) - ISO 8601 week
// Returns dates in LOCAL timezone (Vietnam) for correct display
export const getWeekDates = (year, weekNumber) => {
    // ISO week calculation: Week 1 is the week with the first Thursday of the year
    // Work in LOCAL timezone so dates display correctly for Vietnam users
    const jan4 = new Date(year, 0, 4);
    
    // Find Monday of week 1
    const dayOfWeek = jan4.getDay();
    const mondayOfWeek1 = new Date(jan4);
    mondayOfWeek1.setDate(jan4.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    // Calculate target week's Monday
    const targetMonday = new Date(mondayOfWeek1);
    targetMonday.setDate(mondayOfWeek1.getDate() + (weekNumber - 1) * 7);
    
    // Generate all 7 days of the week (Monday to Sunday)
    // Create dates at noon to avoid any DST edge cases
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(
            targetMonday.getFullYear(),
            targetMonday.getMonth(),
            targetMonday.getDate() + i,
            12, 0, 0, 0
        );
        dates.push(date);
    }
    
    return dates;
};

// Get local date string in YYYY-MM-DD format (Vietnam timezone)
// This is what we send to the API and use for comparisons
export const getLocalDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Format date for display
export const formatDate = (date, format = "short") => {
    const d = new Date(date);
    
    if (format === "short") {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    if (format === "full") {
        return d.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    if (format === "weekday") {
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    if (format === "iso" || format === "YYYY-MM-DD") {
        // Return date in YYYY-MM-DD format using LOCAL timezone (Vietnam)
        // This ensures the date sent to API matches what user sees
        return getLocalDateString(d);
    }
    
    return d.toLocaleDateString();
};

// Convert Date object to YYYY-MM-DD string in local timezone for API requests
export const toISODateString = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return getLocalDateString(d); // YYYY-MM-DD in local timezone
};

// Get week range string (e.g., "Dec 11 - Dec 17")
export const getWeekRangeString = (year, weekNumber) => {
    const dates = getWeekDates(year, weekNumber);
    const start = formatDate(dates[0], "short");
    const end = formatDate(dates[6], "short");
    return `${start} - ${end}`;
};

// Check if date is today
export const isToday = (date) => {
    const today = new Date();
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
};

// Check if date is in past
export const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
};

// Get current year and week
export const getCurrentWeekInfo = () => {
    const now = new Date();
    return {
        year: now.getFullYear(),
        week: getWeekNumber(now)
    };
};

// Navigate to next/previous week
export const navigateWeek = (year, week, direction) => {
    let newYear = year;
    let newWeek = week + direction;
    
    if (newWeek < 1) {
        newYear--;
        newWeek = 52; // Approximate, actual last week of year can be 52 or 53
    } else if (newWeek > 52) {
        newYear++;
        newWeek = 1;
    }
    
    return { year: newYear, week: newWeek };
};

// Get day name from date
export const getDayName = (date, format = "long") => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: format });
};

// Format time (HH:MM)
export const formatTime = (time) => {
    if (!time) return "";
    // If already in HH:MM format
    if (typeof time === 'string' && time.includes(':')) {
        return time;
    }
    // If it's a date object
    if (time instanceof Date) {
        return time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }
    return time;
};

// Calculate duration between two times (in hours)
export const calculateDuration = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return (endMinutes - startMinutes) / 60;
};

// Check if two time ranges overlap
export const timeRangesOverlap = (start1, end1, start2, end2) => {
    const [s1Hour, s1Min] = start1.split(':').map(Number);
    const [e1Hour, e1Min] = end1.split(':').map(Number);
    const [s2Hour, s2Min] = start2.split(':').map(Number);
    const [e2Hour, e2Min] = end2.split(':').map(Number);
    
    const s1 = s1Hour * 60 + s1Min;
    const e1 = e1Hour * 60 + e1Min;
    const s2 = s2Hour * 60 + s2Min;
    const e2 = e2Hour * 60 + e2Min;
    
    return s1 < e2 && s2 < e1;
};

// ============================================
// VIETNAM TIMEZONE UTILITIES
// ============================================

// Convert date to Vietnam timezone
export const toVietnamTime = (date) => {
    if (!date) return new Date();
    const d = new Date(date);
    // Convert to Vietnam timezone (UTC+7)
    return new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
};

// Get today's date in Vietnam timezone (YYYY-MM-DD format)
export const getTodayDateVietnam = () => {
    const now = toVietnamTime(new Date());
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Format date for input field (YYYY-MM-DD) in Vietnam timezone
export const formatDateForInputVietnam = (date) => {
  if (!date) return '';
    const d = toVietnamTime(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Format date for display (DD/MM/YYYY) in Vietnam timezone
export const formatDateForDisplayVietnam = (date) => {
    if (!date) return '';
    const d = toVietnamTime(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

// Get current Vietnam time
export const getCurrentVietnamTime = () => {
    return toVietnamTime(new Date());
};

// Format Vietnam time for display (with time)
export const formatVietnamTime = (date, includeSeconds = false) => {
    if (!date) return '';
    const d = toVietnamTime(date);
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    const dateStr = `${day}/${month}/${year}`;
    const timeStr = includeSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
    
    return `${dateStr} ${timeStr}`;
};

// Format Vietnam date only (without time) - DD/MM/YYYY
export const formatVietnamDateOnly = (date) => {
    if (!date) return '';
    const d = toVietnamTime(date);
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
};

// Get date range by period preset (Vietnam timezone)
export const getDateRangeByPeriodVietnam = (period) => {
    const today = toVietnamTime(new Date());
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
  let start, end;

  switch (period) {
        case 'today':
            start = new Date(year, month, day);
            end = new Date(year, month, day);
            break;
            
        case 'yesterday':
            start = new Date(year, month, day - 1);
            end = new Date(year, month, day - 1);
            break;
            
        case 'last7days':
            start = new Date(year, month, day - 6);
            end = new Date(year, month, day);
            break;
            
        case 'last30days':
            start = new Date(year, month, day - 29);
            end = new Date(year, month, day);
            break;
            
        case 'thisWeek': {
            const dayOfWeek = today.getDay();
            const monday = new Date(year, month, day - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            start = monday;
            end = new Date(year, month, day);
      break;
    }
        
        case 'lastWeek': {
            const dayOfWeek = today.getDay();
            const lastMonday = new Date(year, month, day - (dayOfWeek === 0 ? 13 : dayOfWeek + 6));
            const lastSunday = new Date(year, month, day - (dayOfWeek === 0 ? 7 : dayOfWeek));
            start = lastMonday;
            end = lastSunday;
      break;
    }
        
        case 'thisMonth':
            start = new Date(year, month, 1);
            end = new Date(year, month, day);
            break;
            
        case 'lastMonth':
            start = new Date(year, month - 1, 1);
            end = new Date(year, month, 0); // Last day of previous month
      break;
            
        case 'thisYear':
            start = new Date(year, 0, 1);
            end = new Date(year, month, day);
      break;
            
        case 'lastYear':
            start = new Date(year - 1, 0, 1);
            end = new Date(year - 1, 11, 31);
      break;
            
        default:
            start = new Date(year, month, day);
            end = new Date(year, month, day);
    }
    
    return {
        start: formatDateForInputVietnam(start),
        end: formatDateForInputVietnam(end)
    };
};
