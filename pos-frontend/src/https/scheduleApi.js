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

export const createSchedule = (data) => 
    axiosWrapper.post("/api/schedule", data);

export const bulkCreateSchedules = (schedules) => 
    axiosWrapper.post("/api/schedule/bulk", { schedules });

export const updateSchedule = (id, data) => 
    axiosWrapper.put(`/api/schedule/${id}`, data);

export const deleteSchedule = (id) => 
    axiosWrapper.delete(`/api/schedule/${id}`);

export const assignMemberToShift = (scheduleId, memberId) => 
    axiosWrapper.patch(`/api/schedule/${scheduleId}/assign`, { memberId });

export const unassignMemberFromShift = (scheduleId, memberId) => 
    axiosWrapper.patch(`/api/schedule/${scheduleId}/unassign`, { memberId });

export const updateMemberStatus = (scheduleId, memberId, status) => 
    axiosWrapper.patch(`/api/schedule/${scheduleId}/status`, { memberId, status });

export const getMySchedules = (params) => 
    axiosWrapper.get("/api/schedule/my-schedule", { params });

