import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    items: [],
    paymentMethod: "Cash", // Default payment method
    thirdPartyVendor: "None" // Default vendor
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

        setThirdPartyVendor: (state, action) => {
            state.thirdPartyVendor = action.payload;
        },

        removeAllItems: (state) => {
            state.items = [];
            state.paymentMethod = "Cash"; // Reset to default
            state.thirdPartyVendor = "None"; // Reset to default
        }
    }
})

export const getTotalPrice = (state) => state.cart.items.reduce((total, item) => total + item.price, 0);
export const { addItems, removeItem, updateItemQuantity, setPaymentMethod, setThirdPartyVendor, removeAllItems } = cartSlice.actions;
export default cartSlice.reducer;