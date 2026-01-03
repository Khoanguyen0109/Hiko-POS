import { axiosWrapper } from "./axiosWrapper";

/**
 * Get member's monthly salary
 * @param {number} year - Year (e.g., 2025)
 * @param {number} month - Month (1-12)
 * @returns {Promise} Monthly salary data
 */
export const getMonthlySalary = (year, month) => {
    return axiosWrapper.get(`/api/salary/${year}/${month}`);
};

/**
 * Get salary summary for all members (Admin only)
 * Supports date range filtering via startDate/endDate or period (today, week, month)
 * Also supports legacy year/month parameters for backward compatibility
 * @param {Object} params - Filter parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD) - optional
 * @param {string} params.endDate - End date (YYYY-MM-DD) - optional
 * @param {string} params.period - Period filter (today, week, month) - optional
 * @param {number} params.year - Year (e.g., 2025) - optional, legacy support
 * @param {number} params.month - Month (1-12) - optional, legacy support
 * @returns {Promise} Salary summary data for all members
 */
export const getAllMembersSalarySummary = (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Follow the same pattern as other APIs - filter out empty/null/undefined values
    Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
            queryParams.append(key, value);
        }
    });
    
    const queryString = queryParams.toString();
    return axiosWrapper.get(`/api/salary/summary/all${queryString ? `?${queryString}` : ''}`);
};

