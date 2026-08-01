import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOrUpdateRecipe,
  getAllRecipes,
  getRecipeByDishId,
  deleteRecipe,
  recalculateAllCosts,
  calculateDishCost,
} from "../../https";

export const fetchRecipes = createAsyncThunk("recipes/fetchAll", async (params = {}, thunkAPI) => {
  try {
    const { data } = await getAllRecipes(params);
    return {
      items: data.data || [],
      pagination: data.pagination || {},
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
    if (error.response?.status === 404) {
      return null;
    }
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

const initialState = {
  items: [],
  currentRecipe: null,
  dishCost: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50,
  },
  loading: false,
  saving: false,
  error: null,
};

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
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(saveRecipe.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveRecipe.fulfilled, (state, action) => {
        state.saving = false;
        state.currentRecipe = action.payload;
        const dishId = typeof action.payload.dishId === "object"
          ? action.payload.dishId?._id
          : action.payload.dishId;
        const idx = state.items.findIndex((item) => {
          const itemDishId = typeof item.dishId === "object" ? item.dishId?._id : item.dishId;
          return itemDishId === dishId;
        });
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
      .addCase(removeRecipe.fulfilled, (state, action) => {
        const dishId = action.payload;
        state.items = state.items.filter((item) => {
          const itemDishId = typeof item.dishId === "object" ? item.dishId?._id : item.dishId;
          return itemDishId !== dishId;
        });
        const currentDishId = typeof state.currentRecipe?.dishId === "object"
          ? state.currentRecipe?.dishId?._id
          : state.currentRecipe?.dishId;
        if (currentDishId === dishId) {
          state.currentRecipe = null;
        }
      })
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
      .addCase(fetchDishCost.fulfilled, (state, action) => {
        state.dishCost = action.payload;
      });
  },
});

export const { clearError, clearCurrentRecipe, clearDishCost } = recipeSlice.actions;
export default recipeSlice.reducer;
