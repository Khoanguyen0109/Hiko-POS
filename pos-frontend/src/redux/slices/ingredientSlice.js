import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  addIngredient,
  getIngredients,
  getIngredientById,
  updateIngredient,
  deleteIngredient,
  getLowStockIngredients,
  getIngredientHistory,
  importIngredient,
  exportIngredient,
  adjustIngredient,
  getIngredientTransactions,
  getTransactionById,
  deleteIngredientTransaction
} from "../../https";

// ==================== INGREDIENT ASYNC THUNKS ====================

export const fetchIngredients = createAsyncThunk("ingredients/fetchAll", async (params = {}, thunkAPI) => {
  try {
    const { data } = await getIngredients(params);
    return {
      items: data.data || [],
      pagination: data.pagination || {}
    };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch ingredients");
  }
});

export const fetchIngredientById = createAsyncThunk("ingredients/fetchById", async (id, thunkAPI) => {
  try {
    const { data } = await getIngredientById(id);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch ingredient");
  }
});

export const createIngredient = createAsyncThunk("ingredients/create", async (ingredientData, thunkAPI) => {
  try {
    const { data } = await addIngredient(ingredientData);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create ingredient");
  }
});

export const editIngredient = createAsyncThunk("ingredients/update", async ({ ingredientId, ...updates }, thunkAPI) => {
  try {
    const { data } = await updateIngredient({ ingredientId, ...updates });
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update ingredient");
  }
});

export const removeIngredient = createAsyncThunk("ingredients/delete", async (id, thunkAPI) => {
  try {
    await deleteIngredient(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete ingredient");
  }
});

export const fetchLowStockIngredients = createAsyncThunk("ingredients/fetchLowStock", async (_, thunkAPI) => {
  try {
    const { data } = await getLowStockIngredients();
    return data.data || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch low stock ingredients");
  }
});

export const fetchIngredientHistory = createAsyncThunk("ingredients/fetchHistory", async ({ id, params }, thunkAPI) => {
  try {
    const { data } = await getIngredientHistory(id, params);
    return data.data || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch ingredient history");
  }
});

// ==================== TRANSACTION ASYNC THUNKS ====================

export const createImportTransaction = createAsyncThunk("ingredients/import", async (transactionData, thunkAPI) => {
  try {
    const { data } = await importIngredient(transactionData);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to import ingredient");
  }
});

export const createExportTransaction = createAsyncThunk("ingredients/export", async (transactionData, thunkAPI) => {
  try {
    const { data } = await exportIngredient(transactionData);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to export ingredient");
  }
});

export const createAdjustmentTransaction = createAsyncThunk("ingredients/adjust", async (transactionData, thunkAPI) => {
  try {
    const { data } = await adjustIngredient(transactionData);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to adjust ingredient");
  }
});

export const fetchTransactions = createAsyncThunk("ingredients/fetchTransactions", async (params = {}, thunkAPI) => {
  try {
    const { data } = await getIngredientTransactions(params);
    return {
      items: data.data || [],
      pagination: data.pagination || {}
    };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch transactions");
  }
});

export const fetchTransactionById = createAsyncThunk("ingredients/fetchTransactionById", async (id, thunkAPI) => {
  try {
    const { data } = await getTransactionById(id);
    return data.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch transaction");
  }
});

export const removeTransaction = createAsyncThunk("ingredients/deleteTransaction", async (id, thunkAPI) => {
  try {
    const { data } = await deleteIngredientTransaction(id);
    return { transactionId: id, ...data.data };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete transaction");
  }
});

// ==================== INITIAL STATE ====================

const initialState = {
  // Ingredients
  items: [],
  currentIngredient: null,
  lowStockItems: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50
  },
  
  // Transactions
  transactions: [],
  currentTransaction: null,
  transactionHistory: [],
  transactionPagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50
  },
  
  // UI State
  loading: false,
  transactionLoading: false,
  lowStockLoading: false,
  
  // Error handling
  error: null,
  transactionError: null,
  
  // Filters
  filters: {
    category: 'all',
    stockStatus: 'all',
    isActive: true,
    search: ''
  }
};

// ==================== SLICE DEFINITION ====================

const ingredientSlice = createSlice({
  name: "ingredients",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTransactionError: (state) => {
      state.transactionError = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearCurrentIngredient: (state) => {
      state.currentIngredient = null;
    },
    clearCurrentTransaction: (state) => {
      state.currentTransaction = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setTransactionPagination: (state, action) => {
      state.transactionPagination = { ...state.transactionPagination, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // ==================== FETCH INGREDIENTS ====================
      .addCase(fetchIngredients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIngredients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchIngredients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch ingredients";
      })
      
      // ==================== FETCH INGREDIENT BY ID ====================
      .addCase(fetchIngredientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIngredientById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentIngredient = action.payload;
      })
      .addCase(fetchIngredientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch ingredient";
      })
      
      // ==================== CREATE INGREDIENT ====================
      .addCase(createIngredient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createIngredient.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createIngredient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create ingredient";
      })
      
      // ==================== UPDATE INGREDIENT ====================
      .addCase(editIngredient.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.items.findIndex(item => item._id === updated._id);
        if (idx !== -1) {
          state.items[idx] = updated;
        }
        if (state.currentIngredient && state.currentIngredient._id === updated._id) {
          state.currentIngredient = updated;
        }
      })
      
      // ==================== DELETE INGREDIENT ====================
      .addCase(removeIngredient.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter(item => item._id !== id);
      })
      
      // ==================== FETCH LOW STOCK ====================
      .addCase(fetchLowStockIngredients.pending, (state) => {
        state.lowStockLoading = true;
      })
      .addCase(fetchLowStockIngredients.fulfilled, (state, action) => {
        state.lowStockLoading = false;
        state.lowStockItems = action.payload;
      })
      .addCase(fetchLowStockIngredients.rejected, (state, action) => {
        state.lowStockLoading = false;
        state.error = action.payload || "Failed to fetch low stock items";
      })
      
      // ==================== FETCH INGREDIENT HISTORY ====================
      .addCase(fetchIngredientHistory.fulfilled, (state, action) => {
        state.transactionHistory = action.payload;
      })
      
      // ==================== IMPORT TRANSACTION ====================
      .addCase(createImportTransaction.pending, (state) => {
        state.transactionLoading = true;
        state.transactionError = null;
      })
      .addCase(createImportTransaction.fulfilled, (state, action) => {
        state.transactionLoading = false;
        state.transactions.unshift(action.payload);
        // Update ingredient stock and costs if in current items
        const ing = state.items.find(i => i._id === action.payload.ingredientId._id || i._id === action.payload.ingredientId);
        if (ing) {
          ing.inventory.currentStock = action.payload.stockAfter;
          // Recalculate average cost (weighted average)
          const transaction = action.payload;
          const oldTotalValue = transaction.stockBefore * (ing.costs?.averageCost || 0);
          const newTotalValue = oldTotalValue + transaction.totalCost;
          if (!ing.costs) ing.costs = {};
          ing.costs.averageCost = transaction.stockAfter > 0 ? newTotalValue / transaction.stockAfter : 0;
          ing.costs.lastPurchaseCost = transaction.unitCost;
        }
      })
      .addCase(createImportTransaction.rejected, (state, action) => {
        state.transactionLoading = false;
        state.transactionError = action.payload || "Failed to import ingredient";
      })
      
      // ==================== EXPORT TRANSACTION ====================
      .addCase(createExportTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
        // Update ingredient stock (average cost remains the same on export)
        const ing = state.items.find(i => i._id === action.payload.ingredientId._id || i._id === action.payload.ingredientId);
        if (ing) {
          ing.inventory.currentStock = action.payload.stockAfter;
        }
      })
      
      // ==================== ADJUSTMENT TRANSACTION ====================
      .addCase(createAdjustmentTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
        // Update ingredient stock (average cost remains the same on adjustment)
        const ing = state.items.find(i => i._id === action.payload.ingredientId._id || i._id === action.payload.ingredientId);
        if (ing) {
          ing.inventory.currentStock = action.payload.stockAfter;
        }
      })
      
      // ==================== FETCH TRANSACTIONS ====================
      .addCase(fetchTransactions.pending, (state) => {
        state.transactionLoading = true;
        state.transactionError = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactionLoading = false;
        state.transactions = action.payload.items;
        state.transactionPagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.transactionLoading = false;
        state.transactionError = action.payload || "Failed to fetch transactions";
      })
      
      // ==================== FETCH TRANSACTION BY ID ====================
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.currentTransaction = action.payload;
      })
      
      // ==================== DELETE TRANSACTION ====================
      .addCase(removeTransaction.pending, (state) => {
        state.transactionLoading = true;
        state.transactionError = null;
      })
      .addCase(removeTransaction.fulfilled, (state, action) => {
        state.transactionLoading = false;
        // Remove transaction from list
        state.transactions = state.transactions.filter(t => t._id !== action.payload.transactionId);
        
        // Update ingredient stock and average cost in the items list
        const ing = state.items.find(i => i._id === action.payload.ingredientId || i._id === action.payload.ingredientId?._id);
        if (ing) {
          ing.inventory.currentStock = action.payload.newStock;
          if (action.payload.newAverageCost !== undefined) {
            if (!ing.costs) ing.costs = {};
            ing.costs.averageCost = action.payload.newAverageCost;
          }
        }
      })
      .addCase(removeTransaction.rejected, (state, action) => {
        state.transactionLoading = false;
        state.transactionError = action.payload || "Failed to delete transaction";
      });
  }
});

// Export actions
export const {
  clearError,
  clearTransactionError,
  setFilters,
  clearFilters,
  clearCurrentIngredient,
  clearCurrentTransaction,
  setPagination,
  setTransactionPagination
} = ingredientSlice.actions;

// Export reducer
export default ingredientSlice.reducer;

