// pos-frontend/src/https/ticketApi.js
import { axiosWrapper } from "./axiosWrapper";

export const getTickets = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) q.append(k, v);
  });
  const qs = q.toString();
  return axiosWrapper.get(`/api/ticket${qs ? `?${qs}` : ''}`);
};

export const createTicket = (data) => axiosWrapper.post("/api/ticket", data);

export const updateTicket = ({ ticketId, ...data }) =>
  axiosWrapper.put(`/api/ticket/${ticketId}`, data);

export const deleteTicket = (ticketId) =>
  axiosWrapper.delete(`/api/ticket/${ticketId}`);

export const getTicketSummary = (params = {}) => {
  const q = new URLSearchParams();
  if (params.month) q.append('month', params.month);
  if (params.year)  q.append('year',  params.year);
  const qs = q.toString();
  return axiosWrapper.get(`/api/ticket/summary${qs ? `?${qs}` : ''}`);
};

export const getMyTickets = (params = {}) => {
  const q = new URLSearchParams();
  if (params.month) q.append('month', params.month);
  if (params.year)  q.append('year',  params.year);
  const qs = q.toString();
  return axiosWrapper.get(`/api/ticket/my-tickets${qs ? `?${qs}` : ''}`);
};
