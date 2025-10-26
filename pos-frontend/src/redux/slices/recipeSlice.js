import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOrUpdateRecipe,
  getAllRecipes,
  getRecipeByDishId,
  deleteRecipe,
  recalculateAllCosts,
  calculateDishCost,
  exportIngredientsForOrder,
  checkIngredientAvailability
} from "../../https";

// ==================== ASYNC THUNKS ====================

export const fetchRecipes = createAsyncThunk("recipes/fetchAll", async (params = {}, thunkAPI) => {
  try {
    const { data } = await getAllRecipes(params);
    return {
      items: data.data || [],
      pagination: data.pagination || {}
    };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch recipes");
  }
});

export const fetchRecipeByDishId = createAsyncThunk("recipes/fetchByDishId", async (dishId, thunkAPI) => {
  try {
    const { data } = await getRecipeByDishId(dishId);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch recipe");
  }
});

export const saveRecipe = createAsyncThunk("recipes/save", async (recipeData, thunkAPI) => {
  try {
    const { data } = await createOrUpdateRecipe(recipeData);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to save recipe");
  }
});

export const removeRecipe = createAsyncThunk("recipes/delete", async (dishId, thunkAPI) => {
  try {
    await deleteRecipe(dishId);
    return dishId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete recipe");
  }
});

export const recalculateRecipeCosts = createAsyncThunk("recipes/recalculateAll", async (_, thunkAPI) => {
  try {
    const { data } = await recalculateAllCosts();
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to recalculate costs");
  }
});

export const fetchDishCost = createAsyncThunk("recipes/fetchDishCost", async ({ dishId, size }, thunkAPI) => {
  try {
    const { data } = await calculateDishCost(dishId, { size });
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to calculate dish cost");
  }
});

export const exportIngredients = createAsyncThunk("recipes/exportIngredients", async (orderData, thunkAPI) => {
  try {
    const { data } = await exportIngredientsForOrder(orderData);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to export ingredients");
  }
});

export const checkAvailability = createAsyncThunk("recipes/checkAvailability", async (items, thunkAPI) => {
  try {
    const { data } = await checkIngredientAvailability({ items });
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to check availability");
  }
});

// ==================== INITIAL STATE ====================

const initialState = {
  items: [],
  currentRecipe: null,
  dishCost: null,
  availability: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50
  },
  loading: false,
  saving: false,
  error: null
};

// ==================== SLICE DEFINITION ====================

const recipeSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentRecipe: (state) => {
      state.currentRecipe = null;
    },
    clearDishCost: (state) => {
      state.dishCost = null;
    },
    clearAvailability: (state) => {
      state.availability = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // ==================== FETCH RECIPES ====================
      .addCase(fetchRecipes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch recipes";
      })
      
      // ==================== FETCH RECIPE BY DISH ID ====================
      .addCase(fetchRecipeByDishId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipeByDishId.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecipe = action.payload;
      })
      .addCase(fetchRecipeByDishId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch recipe";
        state.currentRecipe = null;
      })
      
      // ==================== SAVE RECIPE ====================
      .addCase(saveRecipe.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveRecipe.fulfilled, (state, action) => {
        state.saving = false;
        state.currentRecipe = action.payload;
        // Update in items list if it exists
        const idx = state.items.findIndex(item => item.dishId === action.payload.dishId);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(saveRecipe.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to save recipe";
      })
      
      // ==================== DELETE RECIPE ====================
      .addCase(removeRecipe.fulfilled, (state, action) => {
        const dishId = action.payload;
        // Filter out recipe where dishId matches (handle both string ID and populated object)
        state.items = state.items.filter(item => {
          const itemDishId = typeof item.dishId === 'object' ? item.dishId?._id : item.dishId;
          return itemDishId !== dishId;
        });
        // Clear current recipe if it matches
        const currentDishId = typeof state.currentRecipe?.dishId === 'object' 
          ? state.currentRecipe?.dishId?._id 
          : state.currentRecipe?.dishId;
        if (currentDishId === dishId) {
          state.currentRecipe = null;
        }
      })
      
      // ==================== RECALCULATE COSTS ====================
      .addCase(recalculateRecipeCosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(recalculateRecipeCosts.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(recalculateRecipeCosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to recalculate costs";
      })
      
      // ==================== FETCH DISH COST ====================
      .addCase(fetchDishCost.fulfilled, (state, action) => {
        state.dishCost = action.payload;
      })
      
      // ==================== EXPORT INGREDIENTS ====================
      .addCase(exportIngredients.pending, (state) => {
        state.loading = true;
      })
      .addCase(exportIngredients.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportIngredients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to export ingredients";
      })
      
      // ==================== CHECK AVAILABILITY ====================
      .addCase(checkAvailability.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.availability = action.payload;
      })
      .addCase(checkAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to check availability";
      });
  }
});

// Export actions
export const {
  clearError,
  clearCurrentRecipe,
  clearDishCost,
  clearAvailability,
  setPagination
} = recipeSlice.actions;

// Export reducer
export default recipeSlice.reducer;

