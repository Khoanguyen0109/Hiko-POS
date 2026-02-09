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
import spendingReducer from "./slices/spendingSlice";
import shiftTemplateReducer from "./slices/shiftTemplateSlice";
import scheduleReducer from "./slices/scheduleSlice";
import extraWorkReducer from "./slices/extraWorkSlice";
import salaryReducer from "./slices/salarySlice";

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
        promotions: promotionReducer,
        spending: spendingReducer,
        shiftTemplates: shiftTemplateReducer,
        schedules: scheduleReducer,
        extraWork: extraWorkReducer,
        salary: salaryReducer
    },

    devTools: import.meta.env.NODE_ENV !== "production",
});

export default store;
