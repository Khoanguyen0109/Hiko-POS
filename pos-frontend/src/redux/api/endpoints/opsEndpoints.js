import { baseApi } from "../baseApi";
import { providesList, invalidatesList } from "../tagHelpers";

const CATALOG_CACHE = {
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: 60,
};

const ANALYTICS_CACHE = {
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
};

const SEARCH_CACHE = {
  keepUnusedDataFor: 15,
};

const cleanParams = (params = {}) => {
  const queryParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      queryParams[key] = value.join(",");
      return;
    }
    queryParams[key] = value;
  });
  return queryParams;
};

const toId = (value) =>
  value && typeof value === "object" ? value._id : value;

const spendingSubListTags = (listId, result) => {
  const items = Array.isArray(result)
    ? result
    : Array.isArray(result?.data)
      ? result.data
      : [];
  return [
    ...items.map((item) => ({ type: "Spending", id: item._id })),
    { type: "Spending", id: listId },
  ];
};

const invalidateSpendingSub = (listId, id) =>
  id
    ? [
        { type: "Spending", id },
        { type: "Spending", id: listId },
      ]
    : [{ type: "Spending", id: listId }];

const invalidateSpendingRecords = (id) => [
  ...invalidatesList("Spending", id),
  { type: "Spending", id: "DASHBOARD" },
  { type: "Spending", id: "ANALYTICS" },
];

const toppingRecipeTag = (toppingId) => ({
  type: "Recipe",
  id: `topping-${toppingId}`,
});

const toppingRecipeListTags = (result) => {
  const items = Array.isArray(result)
    ? result
    : Array.isArray(result?.data)
      ? result.data
      : [];
  return [
    ...items.map((item) =>
      toppingRecipeTag(toId(item.toppingId) || item._id)
    ),
    { type: "Recipe", id: "TOPPING-LIST" },
  ];
};

const invalidateToppingRecipe = (toppingId) => {
  const tags = [{ type: "Recipe", id: "TOPPING-LIST" }];
  if (toppingId) {
    tags.push(toppingRecipeTag(toppingId));
    tags.push(...invalidatesList("Topping", toppingId));
  }
  return tags;
};

const invalidateRecipe = (dishId) => {
  const tags = invalidatesList("Recipe", dishId);
  if (dishId) tags.push({ type: "Dish", id: dishId });
  return tags;
};

const invalidateTickets = (id) => [
  ...invalidatesList("Ticket", id),
  { type: "Ticket", id: "SUMMARY" },
  { type: "Ticket", id: "MINE" },
];

const invalidateDocs = (id) =>
  id
    ? [
        { type: "Docs", id },
        { type: "Docs", id: "TREE" },
      ]
    : [{ type: "Docs", id: "TREE" }];

export const opsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Customers ──────────────────────────────────────────────
    getCustomers: build.query({
      query: () => ({ url: "/api/customer", method: "GET" }),
      providesTags: (result) => providesList("Customer", result),
      ...CATALOG_CACHE,
    }),
    getCustomerById: build.query({
      query: (customerId) => ({
        url: `/api/customer/${customerId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Customer", id }],
    }),
    addCustomer: build.mutation({
      query: (data) => ({ url: "/api/customer/", method: "POST", data }),
      invalidatesTags: invalidatesList("Customer"),
    }),
    updateCustomer: build.mutation({
      query: ({ customerId, ...customerData }) => ({
        url: `/api/customer/${customerId}`,
        method: "PUT",
        data: customerData,
      }),
      invalidatesTags: (_result, _error, { customerId }) =>
        invalidatesList("Customer", customerId),
    }),
    deleteCustomer: build.mutation({
      query: (customerId) => ({
        url: `/api/customer/${customerId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) =>
        invalidatesList("Customer", id),
    }),
    searchCustomers: build.query({
      query: (query) => ({
        url: "/api/customer/search",
        method: "GET",
        params: { q: query },
      }),
      ...SEARCH_CACHE,
    }),
    getCustomerRewards: build.query({
      query: (customerId) => ({
        url: `/api/customer/${customerId}/rewards`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Customer", id }],
    }),
    getCustomerHistory: build.query({
      query: (customerId) => ({
        url: `/api/customer/${customerId}/history`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Customer", id }],
    }),

    // ── Promotions ─────────────────────────────────────────────
    getPromotions: build.query({
      query: (params = {}) => ({
        url: "/api/promotion",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (result) => providesList("Promotion", result),
    }),
    getPromotionById: build.query({
      query: (promotionId) => ({
        url: `/api/promotion/${promotionId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Promotion", id }],
    }),
    addPromotion: build.mutation({
      query: (data) => ({ url: "/api/promotion/", method: "POST", data }),
      invalidatesTags: [
        { type: "Promotion", id: "LIST" },
        { type: "Promotion", id: "ANALYTICS" },
      ],
    }),
    updatePromotion: build.mutation({
      query: ({ promotionId, ...promotionData }) => ({
        url: `/api/promotion/${promotionId}`,
        method: "PUT",
        data: promotionData,
      }),
      invalidatesTags: (_result, _error, { promotionId }) => [
        ...invalidatesList("Promotion", promotionId),
        { type: "Promotion", id: "ANALYTICS" },
      ],
    }),
    deletePromotion: build.mutation({
      query: (promotionId) => ({
        url: `/api/promotion/${promotionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        ...invalidatesList("Promotion", id),
        { type: "Promotion", id: "ANALYTICS" },
      ],
    }),
    togglePromotionStatus: build.mutation({
      query: (promotionId) => ({
        url: `/api/promotion/${promotionId}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) =>
        invalidatesList("Promotion", id),
    }),
    getPromotionAnalytics: build.query({
      query: (params = {}) => ({
        url: "/api/promotion/analytics",
        method: "GET",
        params: cleanParams({
          startDate: params.startDate,
          endDate: params.endDate,
        }),
      }),
      providesTags: [{ type: "Promotion", id: "ANALYTICS" }],
      ...ANALYTICS_CACHE,
    }),
    validateCouponCode: build.mutation({
      query: (code) => ({
        url: "/api/promotion/validate-coupon",
        method: "POST",
        data: { code },
      }),
    }),

    // ── Campaigns ──────────────────────────────────────────────
    getCampaigns: build.query({
      query: () => ({ url: "/api/campaign", method: "GET" }),
      providesTags: (result) => providesList("Campaign", result),
    }),
    getCampaignById: build.query({
      query: (campaignId) => ({
        url: `/api/campaign/${campaignId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Campaign", id }],
    }),
    addCampaign: build.mutation({
      query: (data) => ({ url: "/api/campaign", method: "POST", data }),
      invalidatesTags: [
        { type: "Campaign", id: "LIST" },
        { type: "Campaign", id: "ANALYTICS" },
      ],
    }),
    updateCampaign: build.mutation({
      query: ({ campaignId, ...data }) => ({
        url: `/api/campaign/${campaignId}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { campaignId }) => [
        ...invalidatesList("Campaign", campaignId),
        { type: "Campaign", id: "ANALYTICS" },
      ],
    }),
    deactivateCampaign: build.mutation({
      query: (campaignId) => ({
        url: `/api/campaign/${campaignId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        ...invalidatesList("Campaign", id),
        { type: "Campaign", id: "ANALYTICS" },
      ],
    }),
    validateVoucher: build.mutation({
      query: (qrToken) => ({
        url: `/api/voucher/validate/${encodeURIComponent(qrToken)}`,
        method: "GET",
      }),
    }),
    redeemVoucher: build.mutation({
      query: (qrToken) => ({
        url: "/api/voucher/redeem",
        method: "POST",
        data: { qrToken },
      }),
      invalidatesTags: [
        { type: "Campaign", id: "LIST" },
        { type: "Campaign", id: "ANALYTICS" },
      ],
    }),
    getCampaignDashboardAnalytics: build.query({
      query: (params = {}) => ({
        url: "/api/campaign/analytics/dashboard",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: [{ type: "Campaign", id: "ANALYTICS" }],
      ...ANALYTICS_CACHE,
    }),
    clearCampaignParticipation: build.mutation({
      query: (participationId) => ({
        url: `/api/campaign/participations/${participationId}/clear`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Campaign", id: "LIST" },
        { type: "Campaign", id: "ANALYTICS" },
      ],
    }),

    // ── Reward programs ────────────────────────────────────────
    getRewardPrograms: build.query({
      query: (params = {}) => ({
        url: "/api/reward-program",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (result) => providesList("Reward", result),
      ...CATALOG_CACHE,
    }),
    getRewardProgramById: build.query({
      query: (id) => ({
        url: `/api/reward-program/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Reward", id }],
    }),
    addRewardProgram: build.mutation({
      query: (data) => ({ url: "/api/reward-program", method: "POST", data }),
      invalidatesTags: [
        { type: "Reward", id: "LIST" },
        { type: "Reward", id: "ANALYTICS" },
      ],
    }),
    updateRewardProgram: build.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/reward-program/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        ...invalidatesList("Reward", id),
        { type: "Reward", id: "ANALYTICS" },
      ],
    }),
    deleteRewardProgram: build.mutation({
      query: (id) => ({
        url: `/api/reward-program/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        ...invalidatesList("Reward", id),
        { type: "Reward", id: "ANALYTICS" },
      ],
    }),
    toggleRewardProgramStatus: build.mutation({
      query: (id) => ({
        url: `/api/reward-program/${id}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => invalidatesList("Reward", id),
    }),
    getRewardAnalytics: build.query({
      query: (params = {}) => ({
        url: "/api/reward-program/analytics",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: [{ type: "Reward", id: "ANALYTICS" }],
      ...ANALYTICS_CACHE,
    }),

    // ── Spending ───────────────────────────────────────────────
    getSpending: build.query({
      query: (params = {}) => ({
        url: "/api/spending",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (result) => providesList("Spending", result),
    }),
    getSpendingById: build.query({
      query: (spendingId) => ({
        url: `/api/spending/${spendingId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Spending", id }],
    }),
    addSpending: build.mutation({
      query: (data) => ({ url: "/api/spending/", method: "POST", data }),
      invalidatesTags: invalidateSpendingRecords(),
    }),
    updateSpending: build.mutation({
      query: ({ spendingId, ...spendingData }) => ({
        url: `/api/spending/${spendingId}`,
        method: "PUT",
        data: spendingData,
      }),
      invalidatesTags: (_result, _error, { spendingId }) =>
        invalidateSpendingRecords(spendingId),
    }),
    deleteSpending: build.mutation({
      query: (spendingId) => ({
        url: `/api/spending/${spendingId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) =>
        invalidateSpendingRecords(id),
    }),

    getSpendingCategories: build.query({
      query: (params = {}) => ({
        url: "/api/spending/categories",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (result) => spendingSubListTags("CATEGORY-LIST", result),
    }),
    getSpendingCategoryById: build.query({
      query: (categoryId) => ({
        url: `/api/spending/categories/${categoryId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Spending", id }],
    }),
    addSpendingCategory: build.mutation({
      query: (data) => ({
        url: "/api/spending/categories/",
        method: "POST",
        data,
      }),
      invalidatesTags: invalidateSpendingSub("CATEGORY-LIST"),
    }),
    updateSpendingCategory: build.mutation({
      query: ({ categoryId, ...categoryData }) => ({
        url: `/api/spending/categories/${categoryId}`,
        method: "PUT",
        data: categoryData,
      }),
      invalidatesTags: (_result, _error, { categoryId }) =>
        invalidateSpendingSub("CATEGORY-LIST", categoryId),
    }),
    deleteSpendingCategory: build.mutation({
      query: (categoryId) => ({
        url: `/api/spending/categories/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) =>
        invalidateSpendingSub("CATEGORY-LIST", id),
    }),

    getVendors: build.query({
      query: (params = {}) => ({
        url: "/api/spending/vendors",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (result) => spendingSubListTags("VENDOR-LIST", result),
    }),
    getVendorById: build.query({
      query: (vendorId) => ({
        url: `/api/spending/vendors/${vendorId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Spending", id }],
    }),
    addVendor: build.mutation({
      query: (data) => ({
        url: "/api/spending/vendors/",
        method: "POST",
        data,
      }),
      invalidatesTags: invalidateSpendingSub("VENDOR-LIST"),
    }),
    updateVendor: build.mutation({
      query: ({ vendorId, ...vendorData }) => ({
        url: `/api/spending/vendors/${vendorId}`,
        method: "PUT",
        data: vendorData,
      }),
      invalidatesTags: (_result, _error, { vendorId }) =>
        invalidateSpendingSub("VENDOR-LIST", vendorId),
    }),
    deleteVendor: build.mutation({
      query: (vendorId) => ({
        url: `/api/spending/vendors/${vendorId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) =>
        invalidateSpendingSub("VENDOR-LIST", id),
    }),

    getSpendingDashboard: build.query({
      query: () => ({
        url: "/api/spending/analytics/dashboard",
        method: "GET",
      }),
      providesTags: [{ type: "Spending", id: "DASHBOARD" }],
      ...ANALYTICS_CACHE,
    }),
    getSpendingAnalytics: build.query({
      query: (params = {}) => ({
        url: "/api/spending/analytics/reports",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: [{ type: "Spending", id: "ANALYTICS" }],
      ...ANALYTICS_CACHE,
    }),

    // ── Storage suppliers ──────────────────────────────────────
    getSuppliers: build.query({
      query: (params = {}) => ({
        url: "/api/storage/supplier",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (result) => providesList("Supplier", result),
      ...CATALOG_CACHE,
    }),
    getActiveSuppliers: build.query({
      query: () => ({ url: "/api/storage/supplier/active", method: "GET" }),
      providesTags: (result) => providesList("Supplier", result),
      ...CATALOG_CACHE,
    }),
    getSupplierById: build.query({
      query: (id) => ({
        url: `/api/storage/supplier/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Supplier", id }],
    }),
    createSupplier: build.mutation({
      query: (data) => ({
        url: "/api/storage/supplier",
        method: "POST",
        data,
      }),
      invalidatesTags: invalidatesList("Supplier"),
    }),
    updateSupplier: build.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/storage/supplier/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) =>
        invalidatesList("Supplier", id),
    }),
    deleteSupplier: build.mutation({
      query: (id) => ({
        url: `/api/storage/supplier/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => invalidatesList("Supplier", id),
    }),

    // ── Storage items ──────────────────────────────────────────
    getStorageItems: build.query({
      query: (params = {}) => ({
        url: "/api/storage/item",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (result) => providesList("StorageItem", result),
      ...CATALOG_CACHE,
    }),
    getStorageItemById: build.query({
      query: (id) => ({
        url: `/api/storage/item/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "StorageItem", id }],
    }),
    createStorageItem: build.mutation({
      query: (data) => ({ url: "/api/storage/item", method: "POST", data }),
      invalidatesTags: [
        { type: "StorageItem", id: "LIST" },
        { type: "StorageItem", id: "ANALYTICS" },
        { type: "StorageItem", id: "VARIANCE" },
      ],
    }),
    updateStorageItem: build.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/storage/item/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        ...invalidatesList("StorageItem", id),
        { type: "StorageItem", id: "ANALYTICS" },
        { type: "StorageItem", id: "VARIANCE" },
      ],
    }),
    deleteStorageItem: build.mutation({
      query: (id) => ({
        url: `/api/storage/item/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        ...invalidatesList("StorageItem", id),
        { type: "StorageItem", id: "ANALYTICS" },
        { type: "StorageItem", id: "VARIANCE" },
      ],
    }),
    getLowStockItems: build.query({
      query: () => ({ url: "/api/storage/item/low-stock", method: "GET" }),
      providesTags: [{ type: "StorageItem", id: "LIST" }],
    }),

    // ── Storage imports ────────────────────────────────────────
    getStorageImports: build.query({
      query: (params = {}) => ({
        url: "/api/storage/import",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (result) => providesList("StorageImport", result),
    }),
    getStorageImportById: build.query({
      query: (id) => ({
        url: `/api/storage/import/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "StorageImport", id }],
    }),
    createStorageImport: build.mutation({
      query: (data) => ({ url: "/api/storage/import", method: "POST", data }),
      invalidatesTags: [
        { type: "StorageImport", id: "LIST" },
        { type: "StorageItem", id: "LIST" },
        { type: "StorageItem", id: "ANALYTICS" },
        { type: "StorageItem", id: "VARIANCE" },
      ],
    }),
    updateStorageImport: build.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/storage/import/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        ...invalidatesList("StorageImport", id),
        { type: "StorageItem", id: "LIST" },
        { type: "StorageItem", id: "ANALYTICS" },
        { type: "StorageItem", id: "VARIANCE" },
      ],
    }),
    cancelStorageImport: build.mutation({
      query: (id) => ({
        url: `/api/storage/import/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        ...invalidatesList("StorageImport", id),
        { type: "StorageItem", id: "LIST" },
        { type: "StorageItem", id: "ANALYTICS" },
        { type: "StorageItem", id: "VARIANCE" },
      ],
    }),

    // ── Storage exports ────────────────────────────────────────
    getStorageExports: build.query({
      query: (params = {}) => ({
        url: "/api/storage/export",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (result) => providesList("StorageExport", result),
    }),
    getStorageExportById: build.query({
      query: (id) => ({
        url: `/api/storage/export/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "StorageExport", id }],
    }),
    createStorageExport: build.mutation({
      query: (data) => ({ url: "/api/storage/export", method: "POST", data }),
      invalidatesTags: [
        { type: "StorageExport", id: "LIST" },
        { type: "StorageItem", id: "LIST" },
        { type: "StorageItem", id: "ANALYTICS" },
        { type: "StorageItem", id: "VARIANCE" },
      ],
    }),
    updateStorageExport: build.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/storage/export/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        ...invalidatesList("StorageExport", id),
        { type: "StorageItem", id: "LIST" },
        { type: "StorageItem", id: "ANALYTICS" },
        { type: "StorageItem", id: "VARIANCE" },
      ],
    }),
    cancelStorageExport: build.mutation({
      query: (id) => ({
        url: `/api/storage/export/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        ...invalidatesList("StorageExport", id),
        { type: "StorageItem", id: "LIST" },
        { type: "StorageItem", id: "ANALYTICS" },
        { type: "StorageItem", id: "VARIANCE" },
      ],
    }),

    getStorageAnalytics: build.query({
      query: (params) => ({
        url: "/api/storage/analytics",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: [{ type: "StorageItem", id: "ANALYTICS" }],
      ...ANALYTICS_CACHE,
    }),
    getStorageVariance: build.query({
      query: (params) => ({
        url: "/api/storage/variance",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: [{ type: "StorageItem", id: "VARIANCE" }],
      ...ANALYTICS_CACHE,
    }),

    // ── Recipes ────────────────────────────────────────────────
    getAllRecipes: build.query({
      query: (params = {}) => ({
        url: "/api/recipe",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (result) => providesList("Recipe", result),
    }),
    getRecipeByDishId: build.query({
      query: (dishId) => ({
        url: `/api/recipe/dish/${dishId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Recipe", id }],
    }),
    createOrUpdateRecipe: build.mutation({
      query: (data) => ({ url: "/api/recipe", method: "POST", data }),
      invalidatesTags: (_result, _error, arg) =>
        invalidateRecipe(toId(arg?.dishId)),
    }),
    deleteRecipe: build.mutation({
      query: (dishId) => ({
        url: `/api/recipe/dish/${dishId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, dishId) => invalidateRecipe(dishId),
    }),
    recalculateAllCosts: build.mutation({
      query: () => ({ url: "/api/recipe/recalculate-all", method: "POST" }),
      invalidatesTags: [
        { type: "Recipe", id: "LIST" },
        { type: "Dish", id: "LIST" },
      ],
    }),
    calculateDishCost: build.query({
      query: ({ dishId, ...params }) => ({
        url: `/api/recipe/dish/${dishId}/cost`,
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (_result, _error, { dishId }) => [
        { type: "Recipe", id: dishId },
      ],
    }),

    // ── Topping recipes ────────────────────────────────────────
    getAllToppingRecipes: build.query({
      query: (params = {}) => ({
        url: "/api/topping-recipe",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (result) => toppingRecipeListTags(result),
    }),
    getToppingRecipeByToppingId: build.query({
      query: (toppingId) => ({
        url: `/api/topping-recipe/topping/${toppingId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [toppingRecipeTag(id)],
    }),
    createOrUpdateToppingRecipe: build.mutation({
      query: (data) => ({ url: "/api/topping-recipe", method: "POST", data }),
      invalidatesTags: (_result, _error, arg) =>
        invalidateToppingRecipe(toId(arg?.toppingId)),
    }),
    deleteToppingRecipe: build.mutation({
      query: (toppingId) => ({
        url: `/api/topping-recipe/topping/${toppingId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, toppingId) =>
        invalidateToppingRecipe(toppingId),
    }),
    recalculateAllToppingCosts: build.mutation({
      query: () => ({
        url: "/api/topping-recipe/recalculate-all",
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Recipe", id: "TOPPING-LIST" },
        { type: "Topping", id: "LIST" },
      ],
    }),

    // ── Tickets ────────────────────────────────────────────────
    getTickets: build.query({
      query: (params = {}) => ({
        url: "/api/ticket",
        method: "GET",
        params: cleanParams(params),
      }),
      providesTags: (result) => providesList("Ticket", result),
    }),
    createTicket: build.mutation({
      query: (data) => ({ url: "/api/ticket", method: "POST", data }),
      invalidatesTags: invalidateTickets(),
    }),
    updateTicket: build.mutation({
      query: ({ ticketId, ...data }) => ({
        url: `/api/ticket/${ticketId}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { ticketId }) =>
        invalidateTickets(ticketId),
    }),
    deleteTicket: build.mutation({
      query: (ticketId) => ({
        url: `/api/ticket/${ticketId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => invalidateTickets(id),
    }),
    getTicketSummary: build.query({
      query: (params = {}) => ({
        url: "/api/ticket/summary",
        method: "GET",
        params: cleanParams({ month: params.month, year: params.year }),
      }),
      providesTags: [{ type: "Ticket", id: "SUMMARY" }],
      ...ANALYTICS_CACHE,
    }),
    getMyTickets: build.query({
      query: (params = {}) => ({
        url: "/api/ticket/my-tickets",
        method: "GET",
        params: cleanParams({ month: params.month, year: params.year }),
      }),
      providesTags: (result) => [
        ...providesList("Ticket", result),
        { type: "Ticket", id: "MINE" },
      ],
    }),

    // ── Docs ───────────────────────────────────────────────────
    getDocTree: build.query({
      query: () => ({ url: "/api/docs/tree", method: "GET" }),
      providesTags: [{ type: "Docs", id: "TREE" }],
    }),
    getDocById: build.query({
      query: (id) => ({ url: `/api/docs/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Docs", id }],
    }),
    createFolder: build.mutation({
      query: (data) => ({ url: "/api/docs/folder", method: "POST", data }),
      invalidatesTags: [{ type: "Docs", id: "TREE" }],
    }),
    createDoc: build.mutation({
      query: (data) => ({ url: "/api/docs", method: "POST", data }),
      invalidatesTags: [{ type: "Docs", id: "TREE" }],
    }),
    updateDoc: build.mutation({
      query: ({ id, data }) => ({
        url: `/api/docs/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => invalidateDocs(id),
    }),
    publishDoc: build.mutation({
      query: (id) => ({
        url: `/api/docs/${id}/publish`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => invalidateDocs(id),
    }),
    unpublishDoc: build.mutation({
      query: (id) => ({
        url: `/api/docs/${id}/unpublish`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => invalidateDocs(id),
    }),
    deleteDocNode: build.mutation({
      query: (id) => ({ url: `/api/docs/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => invalidateDocs(id),
    }),
  }),
});

export const {
  // Customers
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useSearchCustomersQuery,
  useGetCustomerRewardsQuery,
  useGetCustomerHistoryQuery,
  // Promotions
  useGetPromotionsQuery,
  useGetPromotionByIdQuery,
  useAddPromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
  useTogglePromotionStatusMutation,
  useGetPromotionAnalyticsQuery,
  useValidateCouponCodeMutation,
  // Campaigns
  useGetCampaignsQuery,
  useGetCampaignByIdQuery,
  useAddCampaignMutation,
  useUpdateCampaignMutation,
  useDeactivateCampaignMutation,
  useValidateVoucherMutation,
  useRedeemVoucherMutation,
  useGetCampaignDashboardAnalyticsQuery,
  useClearCampaignParticipationMutation,
  // Rewards
  useGetRewardProgramsQuery,
  useGetRewardProgramByIdQuery,
  useAddRewardProgramMutation,
  useUpdateRewardProgramMutation,
  useDeleteRewardProgramMutation,
  useToggleRewardProgramStatusMutation,
  useGetRewardAnalyticsQuery,
  // Spending
  useGetSpendingQuery,
  useGetSpendingByIdQuery,
  useAddSpendingMutation,
  useUpdateSpendingMutation,
  useDeleteSpendingMutation,
  useGetSpendingCategoriesQuery,
  useGetSpendingCategoryByIdQuery,
  useAddSpendingCategoryMutation,
  useUpdateSpendingCategoryMutation,
  useDeleteSpendingCategoryMutation,
  useGetVendorsQuery,
  useGetVendorByIdQuery,
  useAddVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useGetSpendingDashboardQuery,
  useGetSpendingAnalyticsQuery,
  // Storage
  useGetSuppliersQuery,
  useGetActiveSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetStorageItemsQuery,
  useGetStorageItemByIdQuery,
  useCreateStorageItemMutation,
  useUpdateStorageItemMutation,
  useDeleteStorageItemMutation,
  useGetLowStockItemsQuery,
  useGetStorageImportsQuery,
  useGetStorageImportByIdQuery,
  useCreateStorageImportMutation,
  useUpdateStorageImportMutation,
  useCancelStorageImportMutation,
  useGetStorageExportsQuery,
  useGetStorageExportByIdQuery,
  useCreateStorageExportMutation,
  useUpdateStorageExportMutation,
  useCancelStorageExportMutation,
  useGetStorageAnalyticsQuery,
  useGetStorageVarianceQuery,
  // Recipes
  useGetAllRecipesQuery,
  useGetRecipeByDishIdQuery,
  useCreateOrUpdateRecipeMutation,
  useDeleteRecipeMutation,
  useRecalculateAllCostsMutation,
  useCalculateDishCostQuery,
  // Topping recipes
  useGetAllToppingRecipesQuery,
  useGetToppingRecipeByToppingIdQuery,
  useCreateOrUpdateToppingRecipeMutation,
  useDeleteToppingRecipeMutation,
  useRecalculateAllToppingCostsMutation,
  // Tickets
  useGetTicketsQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
  useGetTicketSummaryQuery,
  useGetMyTicketsQuery,
  // Docs
  useGetDocTreeQuery,
  useGetDocByIdQuery,
  useCreateFolderMutation,
  useCreateDocMutation,
  useUpdateDocMutation,
  usePublishDocMutation,
  useUnpublishDocMutation,
  useDeleteDocNodeMutation,
} = opsApi;
