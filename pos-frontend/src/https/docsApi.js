import { axiosWrapper } from "./axiosWrapper";

export const getDocTree = () => axiosWrapper.get("/api/docs/tree");

export const getDocById = (id) => axiosWrapper.get(`/api/docs/${id}`);

export const createFolder = (data) =>
  axiosWrapper.post("/api/docs/folder", data);

export const createDoc = (data) => axiosWrapper.post("/api/docs", data);

export const updateDoc = (id, data) =>
  axiosWrapper.put(`/api/docs/${id}`, data);

export const publishDoc = (id) =>
  axiosWrapper.patch(`/api/docs/${id}/publish`);

export const unpublishDoc = (id) =>
  axiosWrapper.patch(`/api/docs/${id}/unpublish`);

export const deleteDocNode = (id) =>
  axiosWrapper.delete(`/api/docs/${id}`);
