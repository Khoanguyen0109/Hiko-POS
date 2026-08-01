import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOrUpdateToppingRecipe,
  getAllToppingRecipes,
  getToppingRecipeByToppingId,
  deleteToppingRecipe,
  recalculateAllToppingCosts,
} from "../../https";

export const fetchToppingRecipes = createAsyncThunk(
  "toppingRecipes/fetchAll",
  async (params = {}, thunkAPI) => {
    try {
      const { data } = await getAllToppingRecipes(params);
      return {
        items: data.data || [],
        pagination: data.pagination || {},
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch topping recipes");
    }
  }
);

export const fetchToppingRecipeByToppingId = createAsyncThunk(
  "toppingRecipes/fetchByToppingId",
  async (toppingId, thunkAPI) => {
    try {
      const { data } = await getToppingRecipeByToppingId(toppingId);
      return data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch topping recipe");
    }
  }
);

export const saveToppingRecipe = createAsyncThunk(
  "toppingRecipes/save",
  async (recipeData, thunkAPI) => {
    try {
      const { data } = await createOrUpdateToppingRecipe(recipeData);
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to save topping recipe");
    }
  }
);

export const removeToppingRecipe = createAsyncThunk(
  "toppingRecipes/delete",
  async (toppingId, thunkAPI) => {
    try {
      await deleteToppingRecipe(toppingId);
      return toppingId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete topping recipe");
    }
  }
);

export const recalculateToppingRecipeCosts = createAsyncThunk(
  "toppingRecipes/recalculateAll",
  async (_, thunkAPI) => {
    try {
      const { data } = await recalculateAllToppingCosts();
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to recalculate topping costs");
    }
  }
);

const initialState = {
  items: [],
  currentRecipe: null,
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

const toppingRecipeSlice = createSlice({
  name: "toppingRecipes",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentToppingRecipe: (state) => {
      state.currentRecipe = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchToppingRecipes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchToppingRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchToppingRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch topping recipes";
      })
      .addCase(fetchToppingRecipeByToppingId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchToppingRecipeByToppingId.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecipe = action.payload;
      })
      .addCase(fetchToppingRecipeByToppingId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch topping recipe";
        state.currentRecipe = null;
      })
      .addCase(saveToppingRecipe.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveToppingRecipe.fulfilled, (state, action) => {
        state.saving = false;
        state.currentRecipe = action.payload;
        const toppingId =
          typeof action.payload.toppingId === "object"
            ? action.payload.toppingId?._id
            : action.payload.toppingId;
        const idx = state.items.findIndex((item) => {
          const itemToppingId =
            typeof item.toppingId === "object" ? item.toppingId?._id : item.toppingId;
          return itemToppingId === toppingId;
        });
        if (idx !== -1) {
          state.items[idx] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(saveToppingRecipe.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Failed to save topping recipe";
      })
      .addCase(removeToppingRecipe.fulfilled, (state, action) => {
        const toppingId = action.payload;
        state.items = state.items.filter((item) => {
          const itemToppingId =
            typeof item.toppingId === "object" ? item.toppingId?._id : item.toppingId;
          return itemToppingId !== toppingId;
        });
        const currentToppingId =
          typeof state.currentRecipe?.toppingId === "object"
            ? state.currentRecipe?.toppingId?._id
            : state.currentRecipe?.toppingId;
        if (currentToppingId === toppingId) {
          state.currentRecipe = null;
        }
      })
      .addCase(recalculateToppingRecipeCosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(recalculateToppingRecipeCosts.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(recalculateToppingRecipeCosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to recalculate topping costs";
      });
  },
});

export const { clearError, clearCurrentToppingRecipe } = toppingRecipeSlice.actions;
export default toppingRecipeSlice.reducer;
