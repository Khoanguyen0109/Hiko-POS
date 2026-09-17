import { baseApi } from "./baseApi";

/** Warm POS catalog cache after login or store switch. */
export const prefetchPosCatalog = (dispatch) => {
  dispatch(baseApi.util.prefetch("getDishes", undefined, { force: false }));
  dispatch(baseApi.util.prefetch("getCategories", undefined, { force: false }));
  dispatch(baseApi.util.prefetch("getTables", undefined, { force: false }));
  dispatch(baseApi.util.prefetch("getToppings", undefined, { force: false }));
};
