import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    items: [],
    paymentMethod: "cash" // Default payment method
};

const cartSlice = createSlice({
    name : "cart",
    initialState,
    reducers : {
        addItems : (state, action) => {
            state.items.push(action.payload);
        },

        removeItem: (state, action) => {
            state.items = state.items.filter(item => item.id != action.payload);
        },

        updateItemQuantity: (state, action) => {
            const { id, quantity, price } = action.payload;
            const item = state.items.find(item => item.id === id);
            if (item) {
                item.quantity = quantity;
                item.price = price;
            }
        },

        setPaymentMethod: (state, action) => {
            state.paymentMethod = action.payload;
        },

        removeAllItems: (state) => {
            state.items = [];
            state.paymentMethod = "cash"; // Reset to default
        }
    }
})

export const getTotalPrice = (state) => state.cart.items.reduce((total, item) => total + item.price, 0);
export const { addItems, removeItem, updateItemQuantity, setPaymentMethod, removeAllItems } = cartSlice.actions;
export default cartSlice.reducer;