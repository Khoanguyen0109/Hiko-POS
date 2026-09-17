import { createSlice } from "@reduxjs/toolkit";

const getStoredActiveStore = () => {
  try {
    const stored = localStorage.getItem("activeStore");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const storeSlice = createSlice({
  name: "store",
  initialState: {
    stores: [],
    activeStore: getStoredActiveStore(),
  },
  reducers: {
    setStores: (state, action) => {
      state.stores = action.payload;
    },
    setActiveStore: (state, action) => {
      state.activeStore = action.payload;
      if (action.payload) {
        localStorage.setItem("activeStore", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("activeStore");
      }
    },
    clearStore: (state) => {
      state.stores = [];
      state.activeStore = null;
      localStorage.removeItem("activeStore");
    },
  },
});

export const { setStores, setActiveStore, clearStore } = storeSlice.actions;
export default storeSlice.reducer;
