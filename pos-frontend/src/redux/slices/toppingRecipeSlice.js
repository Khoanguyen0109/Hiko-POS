import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOrUpdateToppingRecipe,
  getAllToppingRecipes,
  getToppingRecipeByToppingId,
  deleteToppingRecipe,
  calculateToppingRecipeCost,
  recalculateAllToppingCosts,
} from "../../https";

// Async thunks
export const fetchAllToppingRecipes = createAsyncThunk(
  "toppingRecipe/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await getAllToppingRecipes(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch topping recipes"
      );
    }
  }
);

export const fetchToppingRecipeByToppingId = createAsyncThunk(
  "toppingRecipe/fetchByToppingId",
  async (toppingId, { rejectWithValue }) => {
    try {
      const response = await getToppingRecipeByToppingId(toppingId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch topping recipe"
      );
    }
  }
);

export const saveToppingRecipe = createAsyncThunk(
  "toppingRecipe/save",
  async (recipeData, { rejectWithValue }) => {
    try {
      const response = await createOrUpdateToppingRecipe(recipeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save topping recipe"
      );
    }
  }
);

export const removeToppingRecipe = createAsyncThunk(
  "toppingRecipe/remove",
  async (toppingId, { rejectWithValue }) => {
    try {
      const response = await deleteToppingRecipe(toppingId);
      return { toppingId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete topping recipe"
      );
    }
  }
);

export const calculateCostForToppingRecipe = createAsyncThunk(
  "toppingRecipe/calculateCost",
  async (toppingId, { rejectWithValue }) => {
    try {
      const response = await calculateToppingRecipeCost(toppingId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to calculate cost"
      );
    }
  }
);

export const recalculateAllCosts = createAsyncThunk(
  "toppingRecipe/recalculateAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await recalculateAllToppingCosts();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to recalculate costs"
      );
    }
  }
);

// Initial state
const initialState = {
  items: [],
  currentRecipe: null,
  loading: false,
  error: null,
  costCalculation: null,
};

// Slice
const toppingRecipeSlice = createSlice({
  name: "toppingRecipe",
  initialState,
  reducers: {
    clearCurrentRecipe: (state) => {
      state.currentRecipe = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCostCalculation: (state) => {
      state.costCalculation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all topping recipes
      .addCase(fetchAllToppingRecipes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllToppingRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
      })
      .addCase(fetchAllToppingRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch topping recipe by topping ID
      .addCase(fetchToppingRecipeByToppingId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchToppingRecipeByToppingId.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecipe = action.payload.data;
      })
      .addCase(fetchToppingRecipeByToppingId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentRecipe = null;
      })

      // Save topping recipe
      .addCase(saveToppingRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveToppingRecipe.fulfilled, (state, action) => {
        state.loading = false;
        const savedRecipe = action.payload.data;
        const existingIndex = state.items.findIndex(
          (item) => item.toppingId._id === savedRecipe.toppingId._id
        );
        if (existingIndex !== -1) {
          state.items[existingIndex] = savedRecipe;
        } else {
          state.items.unshift(savedRecipe);
        }
        state.currentRecipe = savedRecipe;
      })
      .addCase(saveToppingRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Remove topping recipe
      .addCase(removeToppingRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeToppingRecipe.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (item) => item.toppingId._id !== action.payload.toppingId
        );
        if (state.currentRecipe?.toppingId._id === action.payload.toppingId) {
          state.currentRecipe = null;
        }
      })
      .addCase(removeToppingRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Calculate cost for topping recipe
      .addCase(calculateCostForToppingRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateCostForToppingRecipe.fulfilled, (state, action) => {
        state.loading = false;
        state.costCalculation = action.payload.data;
      })
      .addCase(calculateCostForToppingRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Recalculate all costs
      .addCase(recalculateAllCosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recalculateAllCosts.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(recalculateAllCosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentRecipe, clearError, clearCostCalculation } = toppingRecipeSlice.actions;
export default toppingRecipeSlice.reducer;

