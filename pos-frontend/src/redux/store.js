import { configureStore } from "@reduxjs/toolkit";
import customerSlice from "./slices/customerSlice"
import cartSlice from "./slices/cartSlice";
import userSlice from "./slices/userSlice";
import categoriesReducer from "./slices/categorySlice";
import dishesReducer from "./slices/dishSlice";
import customersDataReducer from "./slices/customersSlice";
import memberReducer from "./slices/memberSlice";
import ordersReducer from "./slices/orderSlice";
import tablesReducer from "./slices/tableSlice";
import toppingReducer from "./slices/toppingSlice";
import promotionReducer from "./slices/promotionSlice";

const store = configureStore({
    reducer: {
        customer: customerSlice,
        cart : cartSlice,
        user : userSlice,
        categories: categoriesReducer,
        dishes: dishesReducer,
        customersData: customersDataReducer,
        members: memberReducer,
        orders: ordersReducer,
        tables: tablesReducer,
        toppings: toppingReducer,
        promotions: promotionReducer
    },

    devTools: import.meta.env.NODE_ENV !== "production",
});

export default store;
