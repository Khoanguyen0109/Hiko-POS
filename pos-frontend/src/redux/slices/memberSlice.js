import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
    getAllMembers, 
    getMemberById, 
    createMember, 
    updateMember, 
    deleteMember,
    getOwnProfile,
    updateOwnProfile,
    changePassword
} from "../../https";

// Async thunks for member management (Admin only)
export const fetchMembers = createAsyncThunk(
    "members/fetchMembers",
    async (_, { rejectWithValue }) => {
        try {
            const response = await getAllMembers();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch members");
        }
    }
);

export const fetchMemberById = createAsyncThunk(
    "members/fetchMemberById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await getMemberById(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch member");
        }
    }
);

export const createNewMember = createAsyncThunk(
    "members/createMember",
    async (memberData, { rejectWithValue }) => {
        try {
            const response = await createMember(memberData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create member");
        }
    }
);

export const updateExistingMember = createAsyncThunk(
    "members/updateMember",
    async ({ id, memberData }, { rejectWithValue }) => {
        try {
            const response = await updateMember(id, memberData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update member");
        }
    }
);

export const removeMember = createAsyncThunk(
    "members/deleteMember",
    async (id, { rejectWithValue }) => {
        try {
            await deleteMember(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete member");
        }
    }
);

// Async thunks for member profile (All authenticated users)
export const fetchOwnProfile = createAsyncThunk(
    "members/fetchOwnProfile",
    async (_, { rejectWithValue }) => {
        try {
            const response = await getOwnProfile();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch profile");
        }
    }
);

export const updateProfile = createAsyncThunk(
    "members/updateProfile",
    async (profileData, { rejectWithValue }) => {
        try {
            const response = await updateOwnProfile(profileData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update profile");
        }
    }
);

export const updatePassword = createAsyncThunk(
    "members/updatePassword",
    async (passwordData, { rejectWithValue }) => {
        try {
            const response = await changePassword(passwordData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to change password");
        }
    }
);

const initialState = {
    // Member list state (Admin only)
    members: [],
    selectedMember: null,
    loading: false,
    error: null,
    
    // Profile state (All users)
    profile: null,
    profileLoading: false,
    profileError: null,
    
    // Operation states
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,
    passwordLoading: false,
};

const memberSlice = createSlice({
    name: "members",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
            state.profileError = null;
        },
        clearSelectedMember: (state) => {
            state.selectedMember = null;
        },
        clearProfile: (state) => {
            state.profile = null;
        },
        resetMemberState: (state) => {
            state.members = [];
            state.selectedMember = null;
            state.loading = false;
            state.error = null;
            state.createLoading = false;
            state.updateLoading = false;
            state.deleteLoading = false;
        },
    },
    extraReducers: (builder) => {
        // Fetch members
        builder
            .addCase(fetchMembers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMembers.fulfilled, (state, action) => {
                state.loading = false;
                state.members = action.payload.data;
                state.error = null;
            })
            .addCase(fetchMembers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Fetch member by ID
        builder
            .addCase(fetchMemberById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMemberById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedMember = action.payload.data;
                state.error = null;
            })
            .addCase(fetchMemberById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Create member
        builder
            .addCase(createNewMember.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })
            .addCase(createNewMember.fulfilled, (state, action) => {
                state.createLoading = false;
                state.members.unshift(action.payload.data);
                state.error = null;
            })
            .addCase(createNewMember.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload;
            });

        // Update member
        builder
            .addCase(updateExistingMember.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
            })
            .addCase(updateExistingMember.fulfilled, (state, action) => {
                state.updateLoading = false;
                const updatedMember = action.payload.data;
                const index = state.members.findIndex(member => member._id === updatedMember._id);
                if (index !== -1) {
                    state.members[index] = updatedMember;
                }
                if (state.selectedMember && state.selectedMember._id === updatedMember._id) {
                    state.selectedMember = updatedMember;
                }
                state.error = null;
            })
            .addCase(updateExistingMember.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = action.payload;
            });

        // Delete member
        builder
            .addCase(removeMember.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
            })
            .addCase(removeMember.fulfilled, (state, action) => {
                state.deleteLoading = false;
                state.members = state.members.filter(member => member._id !== action.payload);
                if (state.selectedMember && state.selectedMember._id === action.payload) {
                    state.selectedMember = null;
                }
                state.error = null;
            })
            .addCase(removeMember.rejected, (state, action) => {
                state.deleteLoading = false;
                state.error = action.payload;
            });

        // Fetch own profile
        builder
            .addCase(fetchOwnProfile.pending, (state) => {
                state.profileLoading = true;
                state.profileError = null;
            })
            .addCase(fetchOwnProfile.fulfilled, (state, action) => {
                state.profileLoading = false;
                state.profile = action.payload.data;
                state.profileError = null;
            })
            .addCase(fetchOwnProfile.rejected, (state, action) => {
                state.profileLoading = false;
                state.profileError = action.payload;
            });

        // Update profile
        builder
            .addCase(updateProfile.pending, (state) => {
                state.profileLoading = true;
                state.profileError = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.profileLoading = false;
                state.profile = action.payload.data;
                state.profileError = null;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.profileLoading = false;
                state.profileError = action.payload;
            });

        // Update password
        builder
            .addCase(updatePassword.pending, (state) => {
                state.passwordLoading = true;
                state.profileError = null;
            })
            .addCase(updatePassword.fulfilled, (state) => {
                state.passwordLoading = false;
                state.profileError = null;
            })
            .addCase(updatePassword.rejected, (state, action) => {
                state.passwordLoading = false;
                state.profileError = action.payload;
            });
    },
});

export const { 
    clearError, 
    clearSelectedMember, 
    clearProfile, 
    resetMemberState 
} = memberSlice.actions;

export default memberSlice.reducer; 