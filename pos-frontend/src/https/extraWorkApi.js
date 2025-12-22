import { axiosWrapper } from "./axiosWrapper";

export const getAllExtraWork = (params) => 
    axiosWrapper.get("/api/extra-work", { params });

export const getExtraWorkById = (id) => 
    axiosWrapper.get(`/api/extra-work/${id}`);

export const getExtraWorkByMember = (memberId, params) => 
    axiosWrapper.get(`/api/extra-work/member/${memberId}`, { params });

export const createExtraWork = (data) => 
    axiosWrapper.post("/api/extra-work", data);

export const updateExtraWork = (id, data) => 
    axiosWrapper.put(`/api/extra-work/${id}`, data);

export const deleteExtraWork = (id) => 
    axiosWrapper.delete(`/api/extra-work/${id}`);

export const approveExtraWork = (id) => 
    axiosWrapper.patch(`/api/extra-work/${id}/approve`);

export const markAsPaid = (id) => 
    axiosWrapper.patch(`/api/extra-work/${id}/mark-paid`);

export const getMyExtraWork = (params) => 
    axiosWrapper.get("/api/extra-work/my-extra-work", { params });

