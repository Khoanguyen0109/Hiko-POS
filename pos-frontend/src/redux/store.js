import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "./api/baseApi";
import { cacheResetListener } from "./api/cacheResetListener";
import customerSlice from "./slices/customerSlice";
import cartSlice from "./slices/cartSlice";
import userSlice from "./slices/userSlice";
import toppingReducer from "./slices/toppingSlice";
import storeReducer from "./slices/storeSlice";
import rewardReducer from "./slices/rewardSlice";
import "./api/endpoints";

const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    customer: customerSlice,
    cart: cartSlice,
    user: userSlice,
    toppings: toppingReducer,
    store: storeReducer,
    rewards: rewardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(baseApi.middleware)
      .prepend(cacheResetListener.middleware),
  devTools: import.meta.env.MODE !== "production",
});

setupListeners(store.dispatch);

export default store;
