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
  activeDocId: null,
  treeLoading: false,
  docLoading: false,
  saveLoading: false,
  deleteLoading: false,
  error: null,
};

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

const updateNodeInTree = (nodes, id, updater) =>
  nodes.map((node) => {
    if (sameId(node._id, id)) {
      return updater(node);
    }
    if (node.children?.length) {
      return {
        ...node,
        children: updateNodeInTree(node.children, id, updater),
      };
    }
    return node;
  });

const docsSlice = createSlice({
  name: "docs",
  initialState,
  reducers: {
    clearDocsError: (state) => {
      state.error = null;
    },
    clearSelectedDoc: (state) => {
      state.selectedDoc = null;
      state.activeDocId = null;
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
      .addCase(fetchDoc.pending, (state, action) => {
        state.docLoading = true;
        state.activeDocId = action.meta.arg;
        state.error = null;
      })
      .addCase(fetchDoc.fulfilled, (state, action) => {
        state.docLoading = false;
        if (sameId(action.meta.arg, state.activeDocId)) {
          state.selectedDoc = action.payload.data;
        }
      })
      .addCase(fetchDoc.rejected, (state, action) => {
        state.docLoading = false;
        if (sameId(action.meta.arg, state.activeDocId)) {
          state.error = action.payload;
          state.selectedDoc = null;
        }
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
        const node = action.payload.data;
        state.selectedDoc = node;
        if (node?._id) {
          state.tree = updateNodeInTree(state.tree, node._id, (existing) => ({
            ...existing,
            title: node.title,
            status: node.status,
          }));
        }
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
        const node = action.payload.data;
        state.selectedDoc = node;
        if (node?._id) {
          state.tree = updateNodeInTree(state.tree, node._id, (existing) => ({
            ...existing,
            status: node.status,
            publishedAt: node.publishedAt,
            publishedBy: node.publishedBy,
          }));
        }
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
        const node = action.payload.data;
        state.selectedDoc = node;
        if (node?._id) {
          state.tree = updateNodeInTree(state.tree, node._id, (existing) => ({
            ...existing,
            status: node.status,
            publishedAt: node.publishedAt,
            publishedBy: node.publishedBy,
          }));
        }
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
