import { createSlice } from "@reduxjs/toolkit";

const toppingSlice = createSlice({
  name: "toppings",
  initialState: {
    selectedToppings: {},
  },
  reducers: {
    addToppingToItem: (state, action) => {
      const { dishId, toppingId, quantity = 1 } = action.payload;
      if (!state.selectedToppings[dishId]) {
        state.selectedToppings[dishId] = [];
      }

      const existingIndex = state.selectedToppings[dishId].findIndex(
        (t) => t.toppingId === toppingId
      );

      if (existingIndex >= 0) {
        state.selectedToppings[dishId][existingIndex].quantity = quantity;
      } else {
        state.selectedToppings[dishId].push({ toppingId, quantity });
      }
    },
    removeToppingFromItem: (state, action) => {
      const { dishId, toppingId } = action.payload;
      if (state.selectedToppings[dishId]) {
        state.selectedToppings[dishId] = state.selectedToppings[dishId].filter(
          (t) => t.toppingId !== toppingId
        );

        if (state.selectedToppings[dishId].length === 0) {
          delete state.selectedToppings[dishId];
        }
      }
    },
    clearSelectedToppings: (state) => {
      state.selectedToppings = {};
    },
    clearItemToppings: (state, action) => {
      delete state.selectedToppings[action.payload.dishId];
    },
  },
});

export const {
  addToppingToItem,
  removeToppingFromItem,
  clearSelectedToppings,
  clearItemToppings,
} = toppingSlice.actions;

export default toppingSlice.reducer;
