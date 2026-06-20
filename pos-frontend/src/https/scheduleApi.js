import { axiosWrapper } from "./axiosWrapper";

// Shift Template APIs
export const getAllShiftTemplates = (params) => 
    axiosWrapper.get("/api/shift-template", { params });

export const getActiveShiftTemplates = () => 
    axiosWrapper.get("/api/shift-template/active");

export const getShiftTemplateById = (id) => 
    axiosWrapper.get(`/api/shift-template/${id}`);

export const createShiftTemplate = (data) => 
    axiosWrapper.post("/api/shift-template", data);

export const updateShiftTemplate = (id, data) => 
    axiosWrapper.put(`/api/shift-template/${id}`, data);

export const deleteShiftTemplate = (id) => 
    axiosWrapper.delete(`/api/shift-template/${id}`);

export const toggleShiftTemplateActiveStatus = (id) => 
    axiosWrapper.patch(`/api/shift-template/${id}/toggle-active`);

// Schedule APIs
export const getAllSchedules = (params) => 
    axiosWrapper.get("/api/schedule", { params });

export const getSchedulesByWeek = (year, week) => 
    axiosWrapper.get(`/api/schedule/week/${year}/${week}`);

export const getSchedulesByDate = (date) => 
    axiosWrapper.get(`/api/schedule/date/${date}`);

export const getSchedulesByDateRange = (params) => 
    axiosWrapper.get("/api/schedule/range", { params });

export const getSchedulesByMember = (memberId, params) => 
    axiosWrapper.get(`/api/schedule/member/${memberId}`, { params });

export const getScheduleById = (id) => 
    axiosWrapper.get(`/api/schedule/${id}`);

// `storeId` (optional) overrides the active-store header so an admin can create
// a schedule for any store without switching their global active store.
export const createSchedule = (data, storeId) =>
    axiosWrapper.post("/api/schedule", data, storeId ? { headers: { "X-Store-Id": storeId } } : undefined);

export const bulkCreateSchedules = (schedules) => 
    axiosWrapper.post("/api/schedule/bulk", { schedules });

export const updateSchedule = (id, data) => 
    axiosWrapper.put(`/api/schedule/${id}`, data);

export const deleteSchedule = (id) => 
    axiosWrapper.delete(`/api/schedule/${id}`);

export const assignMemberToShift = (scheduleId, memberId) => 
    axiosWrapper.patch(`/api/schedule/${scheduleId}/assign`, { memberId });

// `storeId` (optional) overrides the active-store header. Required when assigning
// to a schedule that belongs to a store other than the current active store,
// because batch-assign looks the schedule up scoped to the request's store.
export const batchAssignMembers = (scheduleId, memberIds, storeId) =>
    axiosWrapper.patch(`/api/schedule/${scheduleId}/batch-assign`, { memberIds }, storeId ? { headers: { "X-Store-Id": storeId } } : undefined);

export const unassignMemberFromShift = (scheduleId, memberId) => 
    axiosWrapper.patch(`/api/schedule/${scheduleId}/unassign`, { memberId });

export const updateMemberStatus = (scheduleId, memberId, status) => 
    axiosWrapper.patch(`/api/schedule/${scheduleId}/status`, { memberId, status });

export const getMySchedules = (params) => 
    axiosWrapper.get("/api/schedule/my-schedule", { params });

export const getMySchedulesAllStores = (params) =>
    axiosWrapper.get("/api/schedule/my-schedule-all", { params });

export const getAllMembersWeek = (year, week) =>
    axiosWrapper.get(`/api/schedule/all-members-week/${year}/${week}`);

export const checkScheduleConflicts = (data) =>
    axiosWrapper.post("/api/schedule/check-conflicts", data);

