import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login, register, logout, getUserData } from "../../https";

// Auth async thunks
export const loginUser = createAsyncThunk("user/login", async (credentials, thunkAPI) => {
    try {
        const { data } = await login(credentials);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed");
    }
});

export const registerUser = createAsyncThunk("user/register", async (userData, thunkAPI) => {
    try {
        const { data } = await register(userData);
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Registration failed");
    }
});

export const logoutUser = createAsyncThunk("user/logout", async (_, thunkAPI) => {
    try {
        await logout();
        return true;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Logout failed");
    }
});

export const fetchUserData = createAsyncThunk("user/fetchUserData", async (_, thunkAPI) => {
    try {
        const { data } = await getUserData();
        return data.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch user data");
    }
});

const initialState = {
    _id: "",
    name: "",
    email : "",
    phone: "",
    role: "",
    isAuth: false,
    loading: false,
    error: null
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action) => {
            const { _id, name, phone, email, role  } = action.payload;
            state._id = _id;
            state.name = name;
            state.phone = phone;
            state.email = email;
            state.role = role;
            state.isAuth = true;
            state.error = null;
        },

        removeUser: (state) => {
            state._id = "";
            state.email = "";
            state.name = "";
            state.phone = "";
            state.role = "";
            state.isAuth = false;
            state.error = null;
        },

        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                const { _id, name, phone, email, role } = action.payload;
                state._id = _id;
                state.name = name;
                state.phone = phone;
                state.email = email;
                state.role = role;
                state.isAuth = true;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Login failed";
                state.isAuth = false;
            })

            // Register
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
                // Registration doesn't automatically log in, so don't set user data
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Registration failed";
            })

            // Logout
            .addCase(logoutUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = false;
                state._id = "";
                state.email = "";
                state.name = "";
                state.phone = "";
                state.role = "";
                state.isAuth = false;
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Logout failed";
            })

            // Fetch user data
            .addCase(fetchUserData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserData.fulfilled, (state, action) => {
                state.loading = false;
                const { _id, name, phone, email, role } = action.payload;
                state._id = _id;
                state.name = name;
                state.phone = phone;
                state.email = email;
                state.role = role;
                state.isAuth = true;
                state.error = null;
            })
            .addCase(fetchUserData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch user data";
                state.isAuth = false;
            });
    }
})

export const { setUser, removeUser, clearError } = userSlice.actions;
export default userSlice.reducer;