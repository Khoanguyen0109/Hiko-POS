import { startOfDay, endOfDay, isSameDay, parse } from "date-fns";
import { toZonedTime, fromZonedTime, format } from "date-fns-tz";

const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Get the current UTC timestamp (MongoDB stores dates in UTC).
 * Use formatVietnamTime / toVietnamTime for display.
 */
const getCurrentVietnamTime = () => new Date();

/**
 * Return a zoned Date whose numeric fields (getHours, getMinutes, etc.)
 * reflect the local time in Vietnam. Useful for display / day-boundary math.
 */
const toVietnamTime = (date) => toZonedTime(new Date(date), VIETNAM_TIMEZONE);

/**
 * Format a date as a string in the Vietnam timezone.
 * Uses date-fns format tokens (yyyy-MM-dd HH:mm:ss).
 */
const formatVietnamTime = (date, fmt = "yyyy-MM-dd HH:mm:ss") =>
    format(new Date(date), fmt, { timeZone: VIETNAM_TIMEZONE });

/**
 * UTC timestamp representing midnight (00:00:00) of the given date
 * as observed in the Vietnam timezone.
 */
const getStartOfDayVietnam = (date) => {
    const zoned = toZonedTime(new Date(date), VIETNAM_TIMEZONE);
    return fromZonedTime(startOfDay(zoned), VIETNAM_TIMEZONE);
};

/**
 * UTC timestamp representing 23:59:59.999 of the given date
 * as observed in the Vietnam timezone.
 */
const getEndOfDayVietnam = (date) => {
    const zoned = toZonedTime(new Date(date), VIETNAM_TIMEZONE);
    return fromZonedTime(endOfDay(zoned), VIETNAM_TIMEZONE);
};

/**
 * Parse a date string in the Vietnam timezone.
 * @param {string} dateString
 * @param {string} [fmt] - date-fns format token string (e.g. 'yyyy-MM-dd').
 *   Moment-style tokens (YYYY, DD) are auto-converted.
 */
const parseVietnamTime = (dateString, fmt) => {
    if (fmt) {
        // Accept both moment-style (YYYY/DD) and date-fns tokens (yyyy/dd)
        const dfFmt = fmt.replace(/YYYY/g, "yyyy").replace(/DD/g, "dd");
        const parsed = parse(dateString, dfFmt, new Date());
        return fromZonedTime(parsed, VIETNAM_TIMEZONE);
    }
    return fromZonedTime(new Date(dateString), VIETNAM_TIMEZONE);
};

/**
 * Check whether a date falls on today in the Vietnam timezone.
 */
const isToday = (date) => {
    const nowZoned = toZonedTime(new Date(), VIETNAM_TIMEZONE);
    const checkZoned = toZonedTime(new Date(date), VIETNAM_TIMEZONE);
    return isSameDay(nowZoned, checkZoned);
};

/**
 * Build a { start, end } range for Mongoose date queries from YYYY-MM-DD strings.
 * Boundaries are in UTC but aligned to Vietnam timezone day edges.
 */
const getDateRangeVietnam = (startDateString, endDateString) => ({
    start: startDateString ? getStartOfDayVietnam(startDateString) : null,
    end: endDateString ? getEndOfDayVietnam(endDateString) : null,
});

/**
 * ISO 8601 week number and year for a date.
 * Week starts Monday; the week containing Thursday determines the year.
 * Pure JS — no library needed.
 */
const getISOWeek = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const year = d.getFullYear();
    const yearStart = new Date(year, 0, 1);
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
    return { year, weekNumber };
};

export {
    VIETNAM_TIMEZONE,
    getCurrentVietnamTime,
    toVietnamTime,
    formatVietnamTime,
    getStartOfDayVietnam,
    getEndOfDayVietnam,
    parseVietnamTime,
    isToday,
    getDateRangeVietnam,
    getISOWeek,
};