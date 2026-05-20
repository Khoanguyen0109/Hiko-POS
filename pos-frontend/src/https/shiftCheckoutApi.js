import { axiosWrapper } from "./axiosWrapper";

export const getShiftCheckoutPreview = (scheduleId, memberId) =>
  axiosWrapper.get(`/api/shift-checkout/preview/${scheduleId}`, {
    params: memberId ? { memberId } : {},
  });

export const submitShiftCheckout = (data) =>
  axiosWrapper.post("/api/shift-checkout", data);

export const getMyShiftCheckoutsToday = (params) =>
  axiosWrapper.get("/api/shift-checkout/my-today", { params });

export const getDayShiftCheckouts = (date) =>
  axiosWrapper.get(`/api/shift-checkout/day/${date}`);

export const getShiftCheckoutList = (params) =>
  axiosWrapper.get("/api/shift-checkout/list", { params });

export const getShiftCheckoutById = (id) =>
  axiosWrapper.get(`/api/shift-checkout/${id}`);

export const deleteShiftCheckout = (id) =>
  axiosWrapper.delete(`/api/shift-checkout/${id}`);
