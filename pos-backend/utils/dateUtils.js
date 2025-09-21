const moment = require('moment-timezone');

// Set default timezone to Ho Chi Minh City, Vietnam
const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Get current date and time in Vietnam timezone
 * @returns {Date} Current date in Vietnam timezone
 */
const getCurrentVietnamTime = () => {
  return moment().tz(VIETNAM_TIMEZONE).toDate();
};

/**
 * Convert any date to Vietnam timezone
 * @param {Date|string} date - Date to convert
 * @returns {Date} Date in Vietnam timezone
 */
const toVietnamTime = (date) => {
  return moment(date).tz(VIETNAM_TIMEZONE).toDate();
};

/**
 * Format date to Vietnam timezone string
 * @param {Date|string} date - Date to format
 * @param {string} format - Moment.js format string (default: 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} Formatted date string in Vietnam timezone
 */
const formatVietnamTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).tz(VIETNAM_TIMEZONE).format(format);
};

/**
 * Get start of day in Vietnam timezone
 * @param {Date|string} date - Date to get start of day for
 * @returns {Date} Start of day in Vietnam timezone
 */
const getStartOfDayVietnam = (date) => {
  return moment(date).tz(VIETNAM_TIMEZONE).startOf('day').toDate();
};

/**
 * Get end of day in Vietnam timezone
 * @param {Date|string} date - Date to get end of day for
 * @returns {Date} End of day in Vietnam timezone
 */
const getEndOfDayVietnam = (date) => {
  return moment(date).tz(VIETNAM_TIMEZONE).endOf('day').toDate();
};

/**
 * Parse date string in Vietnam timezone
 * @param {string} dateString - Date string to parse
 * @param {string} format - Input format (optional)
 * @returns {Date} Parsed date in Vietnam timezone
 */
const parseVietnamTime = (dateString, format) => {
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
const isToday = (date) => {
  const today = moment().tz(VIETNAM_TIMEZONE);
  const checkDate = moment(date).tz(VIETNAM_TIMEZONE);
  return today.isSame(checkDate, 'day');
};

/**
 * Get date range for filtering in Vietnam timezone
 * @param {string} startDateString - Start date string (YYYY-MM-DD)
 * @param {string} endDateString - End date string (YYYY-MM-DD)
 * @returns {Object} Object with start and end dates in Vietnam timezone
 */
const getDateRangeVietnam = (startDateString, endDateString) => {
  const start = startDateString ? getStartOfDayVietnam(startDateString) : null;
  const end = endDateString ? getEndOfDayVietnam(endDateString) : null;
  
  return { start, end };
};

module.exports = {
  VIETNAM_TIMEZONE,
  getCurrentVietnamTime,
  toVietnamTime,
  formatVietnamTime,
  getStartOfDayVietnam,
  getEndOfDayVietnam,
  parseVietnamTime,
  isToday,
  getDateRangeVietnam
};
