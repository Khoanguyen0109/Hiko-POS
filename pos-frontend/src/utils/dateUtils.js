import moment from 'moment-timezone';

// Set default timezone to Ho Chi Minh City, Vietnam
export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Get current date and time in Vietnam timezone
 * @returns {Date} Current date in Vietnam timezone
 */
export const getCurrentVietnamTime = () => {
  return moment().tz(VIETNAM_TIMEZONE).toDate();
};

/**
 * Convert any date to Vietnam timezone
 * @param {Date|string} date - Date to convert
 * @returns {Date} Date in Vietnam timezone
 */
export const toVietnamTime = (date) => {
  return moment(date).tz(VIETNAM_TIMEZONE).toDate();
};

/**
 * Format date to Vietnam timezone string
 * @param {Date|string} date - Date to format
 * @param {string} format - Moment.js format string (default: 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} Formatted date string in Vietnam timezone
 */
export const formatVietnamTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).tz(VIETNAM_TIMEZONE).format(format);
};

/**
 * Get start of day in Vietnam timezone
 * @param {Date|string} date - Date to get start of day for
 * @returns {Date} Start of day in Vietnam timezone
 */
export const getStartOfDayVietnam = (date) => {
  return moment(date).tz(VIETNAM_TIMEZONE).startOf('day').toDate();
};

/**
 * Get end of day in Vietnam timezone
 * @param {Date|string} date - Date to get end of day for
 * @returns {Date} End of day in Vietnam timezone
 */
export const getEndOfDayVietnam = (date) => {
  return moment(date).tz(VIETNAM_TIMEZONE).endOf('day').toDate();
};

/**
 * Parse date string in Vietnam timezone
 * @param {string} dateString - Date string to parse
 * @param {string} format - Input format (optional)
 * @returns {Date} Parsed date in Vietnam timezone
 */
export const parseVietnamTime = (dateString, format) => {
  if (format) {
    return moment.tz(dateString, format, VIETNAM_TIMEZONE).toDate();
  }
  return moment.tz(dateString, VIETNAM_TIMEZONE).toDate();
};

/**
 * Check if a date is today in Vietnam timezone
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today in Vietnam timezone
 */
export const isToday = (date) => {
  const today = moment().tz(VIETNAM_TIMEZONE);
  const checkDate = moment(date).tz(VIETNAM_TIMEZONE);
  return today.isSame(checkDate, 'day');
};

/**
 * Get today's date in Vietnam timezone (YYYY-MM-DD format)
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayDateVietnam = () => {
  return moment().tz(VIETNAM_TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Format date for display in Vietnam timezone (DD/MM/YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForDisplayVietnam = (date) => {
  if (!date) return '';
  return moment(date).tz(VIETNAM_TIMEZONE).format('DD/MM/YYYY');
};

/**
 * Format date and time for display in Vietnam timezone
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateAndTimeVietnam = (date) => {
  if (!date) return '';
  return moment(date).tz(VIETNAM_TIMEZONE).format('DD/MM/YYYY HH:mm:ss');
};

/**
 * Format date for input field in Vietnam timezone (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string for input field
 */
export const formatDateForInputVietnam = (date) => {
  if (!date) return '';
  return moment(date).tz(VIETNAM_TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Get date range for filtering in Vietnam timezone
 * @param {string} startDateString - Start date string (YYYY-MM-DD)
 * @param {string} endDateString - End date string (YYYY-MM-DD)
 * @returns {Object} Object with start and end dates
 */
export const getDateRangeVietnam = (startDateString, endDateString) => {
  const start = startDateString ? getStartOfDayVietnam(startDateString) : null;
  const end = endDateString ? getEndOfDayVietnam(endDateString) : null;
  
  return { start, end };
};

/**
 * Get relative time periods in Vietnam timezone
 * @param {string} period - Period type ('today', 'yesterday', 'last7days', 'last30days', 'thisMonth')
 * @returns {Object} Object with start and end date strings
 */
export const getDateRangeByPeriodVietnam = (period) => {
  const today = moment().tz(VIETNAM_TIMEZONE);
  let start, end;

  switch (period) {
    case 'today': {
      start = end = today.format('YYYY-MM-DD');
      break;
    }
    case 'yesterday': {
      const yesterday = today.clone().subtract(1, 'day');
      start = end = yesterday.format('YYYY-MM-DD');
      break;
    }
    case 'last7days': {
      const last7Days = today.clone().subtract(7, 'days');
      start = last7Days.format('YYYY-MM-DD');
      end = today.format('YYYY-MM-DD');
      break;
    }
    case 'last30days': {
      const last30Days = today.clone().subtract(30, 'days');
      start = last30Days.format('YYYY-MM-DD');
      end = today.format('YYYY-MM-DD');
      break;
    }
    case 'thisMonth': {
      const firstDayOfMonth = today.clone().startOf('month');
      start = firstDayOfMonth.format('YYYY-MM-DD');
      end = today.format('YYYY-MM-DD');
      break;
    }
    default:
      start = end = today.format('YYYY-MM-DD');
  }

  return { start, end };
};
