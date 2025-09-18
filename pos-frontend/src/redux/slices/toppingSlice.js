import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  getToppings,
  getToppingsByCategory,
  addTopping,
  updateTopping as updateToppingAPI,
  deleteTopping as deleteToppingAPI,
  toggleToppingAvailability as toggleToppingAvailabilityAPI
} from "../../https/index";

// Async thunks for topping operations
export const fetchToppings = createAsyncThunk(
  "toppings/fetchToppings",
  async ({ category, available, sort } = {}, { rejectWithValue }) => {
    try {
      const response = await getToppings({ category, available, sort });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch toppings");
    }
  }
);

export const fetchToppingsByCategory = createAsyncThunk(
  "toppings/fetchToppingsByCategory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getToppingsByCategory();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch toppings by category");
    }
  }
);

export const createTopping = createAsyncThunk(
  "toppings/createTopping",
  async (toppingData, { rejectWithValue }) => {
    try {
      const response = await addTopping(toppingData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create topping");
    }
  }
);

export const updateToppingThunk = createAsyncThunk(
  "toppings/updateTopping",
  async ({ toppingId, toppingData }, { rejectWithValue }) => {
    try {
      const response = await updateToppingAPI({ toppingId, ...toppingData });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update topping");
    }
  }
);

export const deleteToppingThunk = createAsyncThunk(
  "toppings/deleteTopping",
  async (toppingId, { rejectWithValue }) => {
    try {
      const response = await deleteToppingAPI(toppingId);
      return { toppingId, deletedTopping: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete topping");
    }
  }
);

export const toggleToppingAvailabilityThunk = createAsyncThunk(
  "toppings/toggleToppingAvailability",
  async (toppingId, { rejectWithValue }) => {
    try {
      const response = await toggleToppingAvailabilityAPI(toppingId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to toggle topping availability");
    }
  }
);

const initialState = {
  toppings: [],
  toppingsByCategory: {},
  loading: false,
  error: null,
  selectedToppings: {}, // For order creation: { dishId: [{ toppingId, quantity }] }
};

const toppingSlice = createSlice({
  name: "toppings",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearToppings: (state) => {
      state.toppings = [];
      state.toppingsByCategory = {};
    },
    // Topping selection for orders
    addToppingToItem: (state, action) => {
      const { dishId, toppingId, quantity = 1 } = action.payload;
      if (!state.selectedToppings[dishId]) {
        state.selectedToppings[dishId] = [];
      }
      
      const existingIndex = state.selectedToppings[dishId].findIndex(
        t => t.toppingId === toppingId
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
          t => t.toppingId !== toppingId
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
      const { dishId } = action.payload;
      delete state.selectedToppings[dishId];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch toppings
      .addCase(fetchToppings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchToppings.fulfilled, (state, action) => {
        state.loading = false;
        state.toppings = action.payload;
      })
      .addCase(fetchToppings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch toppings by category
      .addCase(fetchToppingsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchToppingsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.toppingsByCategory = action.payload;
      })
      .addCase(fetchToppingsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create topping
      .addCase(createTopping.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTopping.fulfilled, (state, action) => {
        state.loading = false;
        state.toppings.push(action.payload);
        
        // Add to category grouping
        const category = action.payload.category;
        if (!state.toppingsByCategory[category]) {
          state.toppingsByCategory[category] = [];
        }
        state.toppingsByCategory[category].push(action.payload);
      })
      .addCase(createTopping.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update topping
      .addCase(updateToppingThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateToppingThunk.fulfilled, (state, action) => {
        state.loading = false;
        const updatedTopping = action.payload;
        
        // Update in toppings array
        const index = state.toppings.findIndex(t => t._id === updatedTopping._id);
        if (index >= 0) {
          state.toppings[index] = updatedTopping;
        }
        
        // Update in category grouping
        Object.keys(state.toppingsByCategory).forEach(category => {
          const categoryIndex = state.toppingsByCategory[category].findIndex(
            t => t._id === updatedTopping._id
          );
          if (categoryIndex >= 0) {
            if (category === updatedTopping.category) {
              state.toppingsByCategory[category][categoryIndex] = updatedTopping;
            } else {
              // Remove from old category and add to new category
              state.toppingsByCategory[category].splice(categoryIndex, 1);
              if (!state.toppingsByCategory[updatedTopping.category]) {
                state.toppingsByCategory[updatedTopping.category] = [];
              }
              state.toppingsByCategory[updatedTopping.category].push(updatedTopping);
            }
          }
        });
      })
      .addCase(updateToppingThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete topping
      .addCase(deleteToppingThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteToppingThunk.fulfilled, (state, action) => {
        state.loading = false;
        const { toppingId } = action.payload;
        
        // Remove from toppings array
        state.toppings = state.toppings.filter(t => t._id !== toppingId);
        
        // Remove from category grouping
        Object.keys(state.toppingsByCategory).forEach(category => {
          state.toppingsByCategory[category] = state.toppingsByCategory[category].filter(
            t => t._id !== toppingId
          );
        });
      })
      .addCase(deleteToppingThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Toggle topping availability
      .addCase(toggleToppingAvailabilityThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleToppingAvailabilityThunk.fulfilled, (state, action) => {
        state.loading = false;
        const updatedTopping = action.payload;
        
        // Update in toppings array
        const index = state.toppings.findIndex(t => t._id === updatedTopping._id);
        if (index >= 0) {
          state.toppings[index] = updatedTopping;
        }
        
        // Update in category grouping
        Object.keys(state.toppingsByCategory).forEach(category => {
          const categoryIndex = state.toppingsByCategory[category].findIndex(
            t => t._id === updatedTopping._id
          );
          if (categoryIndex >= 0) {
            state.toppingsByCategory[category][categoryIndex] = updatedTopping;
          }
        });
      })
      .addCase(toggleToppingAvailabilityThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearToppings,
  addToppingToItem,
  removeToppingFromItem,
  clearSelectedToppings,
  clearItemToppings
} = toppingSlice.actions;

export default toppingSlice.reducer;


