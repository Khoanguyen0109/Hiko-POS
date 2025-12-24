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
 * @param {number} year - Year (e.g., 2025)
 * @param {number} month - Month (1-12)
 * @returns {Promise} Salary summary data for all members
 */
export const getAllMembersSalarySummary = (year, month) => {
    return axiosWrapper.get(`/api/salary/summary/all?year=${year}&month=${month}`);
};

