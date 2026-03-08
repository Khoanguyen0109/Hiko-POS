import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getMyStores as fetchMyStoresApi,
    getAllStores as fetchAllStoresApi,
    createStore as createStoreApi,
    updateStore as updateStoreApi,
    deleteStore as deleteStoreApi,
    getStoreMembers as getStoreMembersApi,
    addStoreMember as addStoreMemberApi,
    updateStoreMemberRole as updateStoreMemberRoleApi,
    removeStoreMember as removeStoreMemberApi
} from "../../https";

// Store CRUD thunks
export const fetchMyStores = createAsyncThunk("store/fetchMyStores", async (_, thunkAPI) => {
    try {
        const { data } = await fetchMyStoresApi();
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch stores");
    }
});

export const fetchAllStores = createAsyncThunk("store/fetchAllStores", async (_, thunkAPI) => {
    try {
        const { data } = await fetchAllStoresApi();
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch stores");
    }
});

export const createNewStore = createAsyncThunk("store/createStore", async (storeData, thunkAPI) => {
    try {
        const { data } = await createStoreApi(storeData);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to create store");
    }
});

export const updateExistingStore = createAsyncThunk("store/updateStore", async ({ id, ...storeData }, thunkAPI) => {
    try {
        const { data } = await updateStoreApi({ id, ...storeData });
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update store");
    }
});

export const removeStore = createAsyncThunk("store/deleteStore", async (id, thunkAPI) => {
    try {
        await deleteStoreApi(id);
        return id;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete store");
    }
});

// Store member thunks
export const fetchStoreMembers = createAsyncThunk("store/fetchStoreMembers", async (storeId, thunkAPI) => {
    try {
        const { data } = await getStoreMembersApi(storeId);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch store members");
    }
});

export const addMemberToStore = createAsyncThunk("store/addMember", async ({ storeId, userId, role }, thunkAPI) => {
    try {
        const { data } = await addStoreMemberApi(storeId, { userId, role });
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to add member");
    }
});

export const updateMemberRole = createAsyncThunk("store/updateMemberRole", async ({ storeId, userId, role }, thunkAPI) => {
    try {
        const { data } = await updateStoreMemberRoleApi(storeId, userId, { role });
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update member role");
    }
});

export const removeMemberFromStore = createAsyncThunk("store/removeMember", async ({ storeId, userId }, thunkAPI) => {
    try {
        await removeStoreMemberApi(storeId, userId);
        return userId;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to remove member");
    }
});

const getStoredActiveStore = () => {
    try {
        const stored = localStorage.getItem("activeStore");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

const initialState = {
    // Store list
    stores: [],
    activeStore: getStoredActiveStore(),
    loading: false,
    error: null,

    // All stores (admin management)
    allStores: [],
    allStoresLoading: false,

    // CRUD operation states
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,

    // Store members
    storeMembers: [],
    membersLoading: false,
    memberActionLoading: false,
};

const storeSlice = createSlice({
    name: "store",
    initialState,
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
        clearStoreError: (state) => {
            state.error = null;
        },
        clearStoreMembers: (state) => {
            state.storeMembers = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch my stores
            .addCase(fetchMyStores.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyStores.fulfilled, (state, action) => {
                state.loading = false;
                state.stores = action.payload;
            })
            .addCase(fetchMyStores.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch all stores (admin)
            .addCase(fetchAllStores.pending, (state) => {
                state.allStoresLoading = true;
                state.error = null;
            })
            .addCase(fetchAllStores.fulfilled, (state, action) => {
                state.allStoresLoading = false;
                state.allStores = action.payload;
            })
            .addCase(fetchAllStores.rejected, (state, action) => {
                state.allStoresLoading = false;
                state.error = action.payload;
            })

            // Create store
            .addCase(createNewStore.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })
            .addCase(createNewStore.fulfilled, (state, action) => {
                state.createLoading = false;
                state.allStores.unshift(action.payload);
                state.stores.push({
                    ...action.payload,
                    role: "Owner"
                });
            })
            .addCase(createNewStore.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload;
            })

            // Update store
            .addCase(updateExistingStore.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
            })
            .addCase(updateExistingStore.fulfilled, (state, action) => {
                state.updateLoading = false;
                const updated = action.payload;
                const idx = state.allStores.findIndex(s => s._id === updated._id);
                if (idx !== -1) state.allStores[idx] = updated;
                const sIdx = state.stores.findIndex(s => s._id === updated._id);
                if (sIdx !== -1) {
                    state.stores[sIdx] = { ...state.stores[sIdx], ...updated };
                }
                if (state.activeStore && state.activeStore._id === updated._id) {
                    state.activeStore = { ...state.activeStore, ...updated };
                    localStorage.setItem("activeStore", JSON.stringify(state.activeStore));
                }
            })
            .addCase(updateExistingStore.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = action.payload;
            })

            // Delete store
            .addCase(removeStore.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
            })
            .addCase(removeStore.fulfilled, (state, action) => {
                state.deleteLoading = false;
                state.allStores = state.allStores.filter(s => s._id !== action.payload);
                state.stores = state.stores.filter(s => s._id !== action.payload);
            })
            .addCase(removeStore.rejected, (state, action) => {
                state.deleteLoading = false;
                state.error = action.payload;
            })

            // Fetch store members
            .addCase(fetchStoreMembers.pending, (state) => {
                state.membersLoading = true;
            })
            .addCase(fetchStoreMembers.fulfilled, (state, action) => {
                state.membersLoading = false;
                state.storeMembers = action.payload;
            })
            .addCase(fetchStoreMembers.rejected, (state, action) => {
                state.membersLoading = false;
                state.error = action.payload;
            })

            // Add member to store
            .addCase(addMemberToStore.pending, (state) => {
                state.memberActionLoading = true;
            })
            .addCase(addMemberToStore.fulfilled, (state, action) => {
                state.memberActionLoading = false;
                state.storeMembers.push(action.payload);
            })
            .addCase(addMemberToStore.rejected, (state, action) => {
                state.memberActionLoading = false;
                state.error = action.payload;
            })

            // Update member role
            .addCase(updateMemberRole.pending, (state) => {
                state.memberActionLoading = true;
            })
            .addCase(updateMemberRole.fulfilled, (state, action) => {
                state.memberActionLoading = false;
                const updated = action.payload;
                const idx = state.storeMembers.findIndex(m => m._id === updated._id);
                if (idx !== -1) state.storeMembers[idx] = updated;
            })
            .addCase(updateMemberRole.rejected, (state, action) => {
                state.memberActionLoading = false;
                state.error = action.payload;
            })

            // Remove member from store
            .addCase(removeMemberFromStore.pending, (state) => {
                state.memberActionLoading = true;
            })
            .addCase(removeMemberFromStore.fulfilled, (state, action) => {
                state.memberActionLoading = false;
                state.storeMembers = state.storeMembers.filter(m =>
                    m.user?._id !== action.payload && m._id !== action.payload
                );
            })
            .addCase(removeMemberFromStore.rejected, (state, action) => {
                state.memberActionLoading = false;
                state.error = action.payload;
            });
    }
});

export const { setStores, setActiveStore, clearStore, clearStoreError, clearStoreMembers } = storeSlice.actions;
export default storeSlice.reducer;
