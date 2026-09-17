import { baseApi } from "../baseApi";
import { providesList, invalidatesList } from "../tagHelpers";

const TABLE_CACHE = {
  keepUnusedDataFor: 60,
  refetchOnMountOrArgChange: 30,
};

const ORDER_CACHE = {
  keepUnusedDataFor: 30,
  refetchOnMountOrArgChange: 15,
};

const ALL_FILTER = "all";

const buildOrderQueryParams = (params = {}) => {
  const queryParams = {};

  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;
  if (params.status && params.status !== ALL_FILTER) {
    queryParams.status = params.status;
  }
  if (params.createdBy && params.createdBy !== ALL_FILTER) {
    queryParams.createdBy = params.createdBy;
  }
  if (params.paymentMethod && params.paymentMethod !== ALL_FILTER) {
    queryParams.paymentMethod = params.paymentMethod;
  }
  if (params.thirdPartyVendor && params.thirdPartyVendor !== ALL_FILTER) {
    queryParams.thirdPartyVendor = params.thirdPartyVendor;
  }
  if (params.paginate) {
    queryParams.paginate = "true";
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
  }

  return queryParams;
};

const pickDefined = (fields) => {
  const data = {};
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) data[key] = value;
  });
  return data;
};

export const floorApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTables: build.query({
      query: () => ({ url: "/api/table", method: "GET" }),
      providesTags: (result) => providesList("Table", result),
      ...TABLE_CACHE,
    }),

    createTable: build.mutation({
      query: (data) => ({ url: "/api/table/", method: "POST", data }),
      invalidatesTags: invalidatesList("Table"),
    }),

    updateTable: build.mutation({
      query: ({ tableId, ...tableData }) => ({
        url: `/api/table/${tableId}`,
        method: "PUT",
        data: tableData,
      }),
      invalidatesTags: (_result, _error, { tableId }) =>
        invalidatesList("Table", tableId),
    }),

    getOrders: build.query({
      query: (params = {}) => ({
        url: "/api/order",
        method: "GET",
        params: buildOrderQueryParams(params),
      }),
      providesTags: (result) => providesList("Order", result),
      ...ORDER_CACHE,
    }),

    getOrderById: build.query({
      query: (orderId) => ({ url: `/api/order/${orderId}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
      ...ORDER_CACHE,
    }),

    createOrder: build.mutation({
      query: (data) => ({ url: "/api/order/", method: "POST", data }),
      invalidatesTags: [
        { type: "Order", id: "LIST" },
        { type: "Table", id: "LIST" },
      ],
    }),

    updateOrder: build.mutation({
      query: ({
        orderId,
        orderStatus,
        paymentMethod,
        thirdPartyVendor,
        appliedPromotions,
        appliedReward,
        customer,
      }) => ({
        url: `/api/order/${orderId}`,
        method: "PUT",
        data: pickDefined({
          orderStatus,
          paymentMethod,
          thirdPartyVendor,
          appliedPromotions,
          appliedReward,
          customer,
        }),
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        ...invalidatesList("Order", orderId),
        { type: "Table", id: "LIST" },
      ],
    }),

    updateOrderItems: build.mutation({
      query: ({ orderId, items }) => ({
        url: `/api/order/${orderId}/items`,
        method: "PATCH",
        data: { items },
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        ...invalidatesList("Order", orderId),
        { type: "Table", id: "LIST" },
      ],
    }),

    deleteOrder: build.mutation({
      query: (orderId) => ({ url: `/api/order/${orderId}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, orderId) => [
        ...invalidatesList("Order", orderId),
        { type: "Table", id: "LIST" },
      ],
    }),

    getPaymentByOrderId: build.query({
      query: (orderId) => ({
        url: `/api/payment/order/${orderId}`,
        method: "GET",
      }),
    }),

    getAllPayments: build.query({
      query: (params) => ({ url: "/api/payment", method: "GET", params }),
    }),

    processCashPayment: build.mutation({
      query: (data) => ({ url: "/api/payment/cash", method: "POST", data }),
      invalidatesTags: (_result, _error, { orderId }) =>
        invalidatesList("Order", orderId),
    }),
  }),
});

export const {
  useGetTablesQuery,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useGetPaymentByOrderIdQuery,
  useGetAllPaymentsQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useUpdateOrderItemsMutation,
  useDeleteOrderMutation,
  useProcessCashPaymentMutation,
} = floorApi;

export const PLACE_ORDER_CACHE_KEY = "place-order";
