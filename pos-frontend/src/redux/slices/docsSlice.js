import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as docsApi from "../../https/docsApi";

export const fetchDocTree = createAsyncThunk(
  "docs/fetchTree",
  async (_, { rejectWithValue }) => {
    try {
      const response = await docsApi.getDocTree();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load documentation"
      );
    }
  }
);

export const fetchDoc = createAsyncThunk(
  "docs/fetchDoc",
  async (id, { rejectWithValue }) => {
    try {
      const response = await docsApi.getDocById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load document"
      );
    }
  }
);

export const createFolder = createAsyncThunk(
  "docs/createFolder",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await docsApi.createFolder(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create folder"
      );
    }
  }
);

export const createDoc = createAsyncThunk(
  "docs/createDoc",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await docsApi.createDoc(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create document"
      );
    }
  }
);

export const updateDoc = createAsyncThunk(
  "docs/updateDoc",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await docsApi.updateDoc(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update document"
      );
    }
  }
);

export const publishDoc = createAsyncThunk(
  "docs/publishDoc",
  async (id, { rejectWithValue }) => {
    try {
      const response = await docsApi.publishDoc(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to publish document"
      );
    }
  }
);

export const unpublishDoc = createAsyncThunk(
  "docs/unpublishDoc",
  async (id, { rejectWithValue }) => {
    try {
      const response = await docsApi.unpublishDoc(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to unpublish document"
      );
    }
  }
);

export const deleteNode = createAsyncThunk(
  "docs/deleteNode",
  async (id, { rejectWithValue }) => {
    try {
      const response = await docsApi.deleteDocNode(id);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete item"
      );
    }
  }
);

const initialState = {
  tree: [],
  selectedDoc: null,
  treeLoading: false,
  docLoading: false,
  saveLoading: false,
  deleteLoading: false,
  error: null,
};

const docsSlice = createSlice({
  name: "docs",
  initialState,
  reducers: {
    clearDocsError: (state) => {
      state.error = null;
    },
    clearSelectedDoc: (state) => {
      state.selectedDoc = null;
    },
    setSelectedDocLocal: (state, action) => {
      state.selectedDoc = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocTree.pending, (state) => {
        state.treeLoading = true;
        state.error = null;
      })
      .addCase(fetchDocTree.fulfilled, (state, action) => {
        state.treeLoading = false;
        state.tree = action.payload.data || [];
      })
      .addCase(fetchDocTree.rejected, (state, action) => {
        state.treeLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchDoc.pending, (state) => {
        state.docLoading = true;
        state.error = null;
      })
      .addCase(fetchDoc.fulfilled, (state, action) => {
        state.docLoading = false;
        state.selectedDoc = action.payload.data;
      })
      .addCase(fetchDoc.rejected, (state, action) => {
        state.docLoading = false;
        state.error = action.payload;
        state.selectedDoc = null;
      })
      .addCase(createFolder.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(createDoc.fulfilled, (state, action) => {
        state.selectedDoc = action.payload.data;
        state.error = null;
      })
      .addCase(updateDoc.pending, (state) => {
        state.saveLoading = true;
      })
      .addCase(updateDoc.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.selectedDoc = action.payload.data;
      })
      .addCase(updateDoc.rejected, (state, action) => {
        state.saveLoading = false;
        state.error = action.payload;
      })
      .addCase(publishDoc.pending, (state) => {
        state.saveLoading = true;
      })
      .addCase(publishDoc.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.selectedDoc = action.payload.data;
      })
      .addCase(publishDoc.rejected, (state, action) => {
        state.saveLoading = false;
        state.error = action.payload;
      })
      .addCase(unpublishDoc.pending, (state) => {
        state.saveLoading = true;
      })
      .addCase(unpublishDoc.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.selectedDoc = action.payload.data;
      })
      .addCase(unpublishDoc.rejected, (state, action) => {
        state.saveLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteNode.pending, (state) => {
        state.deleteLoading = true;
      })
      .addCase(deleteNode.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const deletedId = action.payload.id;
        if (state.selectedDoc?._id === deletedId) {
          state.selectedDoc = null;
        }
      })
      .addCase(deleteNode.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDocsError, clearSelectedDoc, setSelectedDocLocal } =
  docsSlice.actions;
export default docsSlice.reducer;
