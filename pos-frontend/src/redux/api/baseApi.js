import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

export const TAG_TYPES = [
  "Store",
  "Dish",
  "Category",
  "Topping",
  "Table",
  "Order",
  "Customer",
  "Member",
  "Promotion",
  "Campaign",
  "Reward",
  "Spending",
  "Schedule",
  "ShiftTemplate",
  "ShiftCheckout",
  "Salary",
  "Supplier",
  "StorageItem",
  "StorageImport",
  "StorageExport",
  "Recipe",
  "Ticket",
  "Docs",
];

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: TAG_TYPES,
  keepUnusedDataFor: 60,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 30,
  endpoints: () => ({}),
});
