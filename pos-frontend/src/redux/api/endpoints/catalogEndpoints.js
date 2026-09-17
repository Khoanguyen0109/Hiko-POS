import { baseApi } from "../baseApi";
import { providesList, invalidatesList } from "../tagHelpers";

const catalogQueryOptions = {
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: 60,
};

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query({
      query: () => ({ url: "/api/category", method: "GET" }),
      providesTags: (result) => providesList("Category", result),
      ...catalogQueryOptions,
    }),
    getCategoryById: build.query({
      query: (categoryId) => ({
        url: `/api/category/${categoryId}`,
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [{ type: "Category", id }],
      ...catalogQueryOptions,
    }),
    createCategory: build.mutation({
      query: (data) => ({ url: "/api/category/", method: "POST", data }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
    updateCategory: build.mutation({
      query: ({ categoryId, ...data }) => ({
        url: `/api/category/${categoryId}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_r, _e, { categoryId }) =>
        invalidatesList("Category", categoryId),
    }),
    deleteCategory: build.mutation({
      query: (categoryId) => ({
        url: `/api/category/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, id) => invalidatesList("Category", id),
    }),

    getDishes: build.query({
      query: () => ({ url: "/api/dish", method: "GET" }),
      providesTags: (result) => providesList("Dish", result),
      ...catalogQueryOptions,
    }),
    getAvailableDishes: build.query({
      query: () => ({ url: "/api/dish/available", method: "GET" }),
      providesTags: (result) => providesList("Dish", result),
      ...catalogQueryOptions,
    }),
    getDishesByCategory: build.query({
      query: (categoryId) => ({
        url: `/api/dish/category/${categoryId}`,
        method: "GET",
      }),
      providesTags: (result) => providesList("Dish", result),
      ...catalogQueryOptions,
    }),
    getDishById: build.query({
      query: (dishId) => ({ url: `/api/dish/${dishId}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "Dish", id }],
      ...catalogQueryOptions,
    }),
    createDish: build.mutation({
      query: (data) => ({ url: "/api/dish/", method: "POST", data }),
      invalidatesTags: [{ type: "Dish", id: "LIST" }],
    }),
    updateDish: build.mutation({
      query: ({ dishId, ...data }) => ({
        url: `/api/dish/${dishId}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_r, _e, { dishId }) => invalidatesList("Dish", dishId),
    }),
    deleteDish: build.mutation({
      query: (dishId) => ({ url: `/api/dish/${dishId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => invalidatesList("Dish", id),
    }),
    toggleDishAvailability: build.mutation({
      query: (dishId) => ({
        url: `/api/dish/${dishId}/toggle-availability`,
        method: "PATCH",
      }),
      invalidatesTags: (_r, _e, id) => invalidatesList("Dish", id),
    }),

    getToppings: build.query({
      query: (params = {}) => ({ url: "/api/topping", method: "GET", params }),
      providesTags: (result) => providesList("Topping", result),
      ...catalogQueryOptions,
    }),
    getToppingsByCategory: build.query({
      query: () => ({ url: "/api/topping/by-category", method: "GET" }),
      providesTags: (result) => {
        const items =
          result && !Array.isArray(result)
            ? Object.values(result).flat()
            : result;
        return providesList("Topping", items);
      },
      ...catalogQueryOptions,
    }),
    getToppingById: build.query({
      query: (toppingId) => ({
        url: `/api/topping/${toppingId}`,
        method: "GET",
      }),
      providesTags: (_r, _e, id) => [{ type: "Topping", id }],
      ...catalogQueryOptions,
    }),
    createTopping: build.mutation({
      query: (data) => ({ url: "/api/topping/", method: "POST", data }),
      invalidatesTags: [{ type: "Topping", id: "LIST" }],
    }),
    updateTopping: build.mutation({
      query: ({ toppingId, ...data }) => ({
        url: `/api/topping/${toppingId}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_r, _e, { toppingId }) =>
        invalidatesList("Topping", toppingId),
    }),
    deleteTopping: build.mutation({
      query: (toppingId) => ({
        url: `/api/topping/${toppingId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, id) => invalidatesList("Topping", id),
    }),
    toggleToppingAvailability: build.mutation({
      query: (toppingId) => ({
        url: `/api/topping/${toppingId}/toggle-availability`,
        method: "PATCH",
      }),
      invalidatesTags: (_r, _e, id) => invalidatesList("Topping", id),
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useGetDishesQuery,
  useGetAvailableDishesQuery,
  useGetDishesByCategoryQuery,
  useGetDishByIdQuery,
  useGetToppingsQuery,
  useGetToppingsByCategoryQuery,
  useGetToppingByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateDishMutation,
  useUpdateDishMutation,
  useDeleteDishMutation,
  useToggleDishAvailabilityMutation,
  useCreateToppingMutation,
  useUpdateToppingMutation,
  useDeleteToppingMutation,
  useToggleToppingAvailabilityMutation,
} = catalogApi;
