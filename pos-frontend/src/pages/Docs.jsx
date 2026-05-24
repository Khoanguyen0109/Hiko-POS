import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import {
  MdAdd,
  MdChevronLeft,
  MdCreateNewFolder,
  MdDelete,
  MdEdit,
  MdMenuBook,
  MdPublish,
  MdUnpublished,
} from "react-icons/md";
import BackButton from "../components/shared/BackButton";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import Button from "../components/ui/Button";
import DocsTree from "../components/docs/DocsTree";
import DocsEditor from "../components/docs/DocsEditor";
import DocsViewer from "../components/docs/DocsViewer";
import CreateNodeModal from "../components/docs/CreateNodeModal";
import RenameNodeModal from "../components/docs/RenameNodeModal";
import DocsActionsMenu from "../components/docs/DocsActionsMenu";
import DocsCreateMenu from "../components/docs/DocsCreateMenu";
import {
  fetchDocTree,
  fetchDoc,
  createFolder,
  createDoc,
  updateDoc,
  publishDoc,
  unpublishDoc,
  deleteNode,
  clearSelectedDoc,
} from "../redux/slices/docsSlice";
import { ROUTES } from "../constants";
import { DOCS_ROOT_ID } from "../constants/docs";

const findNodeById = (nodes, id) => {
  for (const node of nodes) {
    if (String(node._id) === String(id)) return node;
    if (node.children?.length) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const Docs = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { docId } = useParams();
  const { role } = useSelector((state) => state.user);
  const isAdmin = role === "Admin";

  const {
    tree,
    selectedDoc,
    treeLoading,
    docLoading,
    saveLoading,
    deleteLoading,
    error,
  } = useSelector((state) => state.docs);

  const [selectedFolderId, setSelectedFolderId] = useState(DOCS_ROOT_ID);
  const [selectedFolderTitle, setSelectedFolderTitle] = useState("Root");
  const [createModal, setCreateModal] = useState(null);
  const [renameNode, setRenameNode] = useState(null);
  const [renameLoading, setRenameLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    document.title = "POS | Documentation";
  }, []);

  useEffect(() => {
    dispatch(fetchDocTree());
  }, [dispatch]);

  useEffect(() => {
    if (docId) {
      setEditTitle("");
      setEditContent("");
      setIsDirty(false);
      dispatch(fetchDoc(docId));
    } else {
      dispatch(clearSelectedDoc());
    }
  }, [dispatch, docId]);

  useEffect(() => {
    if (
      selectedDoc &&
      docId &&
      String(selectedDoc._id) === String(docId)
    ) {
      setEditTitle(selectedDoc.title || "");
      setEditContent(selectedDoc.content || "");
      setIsDirty(false);
    }
  }, [selectedDoc, docId]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
    }
  }, [error]);

  const confirmDiscard = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm("You have unsaved changes. Discard them?");
  }, [isDirty]);

  const handleBackToBrowse = () => {
    if (!confirmDiscard()) return;
    navigate(ROUTES.DOCS);
  };

  const handleSelectDoc = (node) => {
    if (!confirmDiscard()) return;
    navigate(`${ROUTES.DOCS}/${node._id}`);
  };

  const handleSelectFolder = (node) => {
    setSelectedFolderId(node._id);
    setSelectedFolderTitle(node.title);
  };

  const handleSelectRoot = () => {
    setSelectedFolderId(DOCS_ROOT_ID);
    setSelectedFolderTitle("Root");
  };

  const getParentId = () =>
    selectedFolderId === DOCS_ROOT_ID ? null : selectedFolderId;

  const getCreateParentTitle = () => selectedFolderTitle || "Root";

  const handleRename = async (newTitle) => {
    if (!renameNode?._id) return;
    setRenameLoading(true);
    try {
      await dispatch(
        updateDoc({
          id: renameNode._id,
          data: { title: newTitle },
        })
      ).unwrap();
      enqueueSnackbar("Renamed successfully", { variant: "success" });
      setRenameNode(null);

      if (renameNode._id === selectedFolderId) {
        setSelectedFolderTitle(newTitle);
      }

      if (docId === renameNode._id) {
        dispatch(fetchDoc(renameNode._id));
      }

      await refreshTree();
    } catch (err) {
      enqueueSnackbar(err || "Failed to rename", { variant: "error" });
    } finally {
      setRenameLoading(false);
    }
  };

  const openRenameModal = (node) => {
    setRenameNode(node);
  };

  const handleRenameSelectedFolder = () => {
    if (selectedFolderNode) {
      openRenameModal(selectedFolderNode);
    }
  };

  const refreshTree = async () => {
    try {
      await dispatch(fetchDocTree()).unwrap();
    } catch (err) {
      enqueueSnackbar(err || "Failed to refresh documentation tree", {
        variant: "error",
      });
    }
  };

  const handleCreate = async (title) => {
    setCreateLoading(true);
    try {
      const parentId = getParentId();
      if (createModal === "folder") {
        await dispatch(createFolder({ title, parentId })).unwrap();
        enqueueSnackbar("Folder created", { variant: "success" });
      } else {
        const result = await dispatch(
          createDoc({ title, parentId, content: "" })
        ).unwrap();
        enqueueSnackbar("Document created", { variant: "success" });
        navigate(`${ROUTES.DOCS}/${result.data._id}`);
      }
      setCreateModal(null);
      await refreshTree();
    } catch (err) {
      enqueueSnackbar(err || "Failed to create", { variant: "error" });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSave = async () => {
    if (!docId || !selectedDoc?._id) return;
    if (String(selectedDoc._id) !== String(docId)) return;

    try {
      await dispatch(
        updateDoc({
          id: docId,
          data: { title: editTitle, content: editContent },
        })
      ).unwrap();
      setIsDirty(false);
      enqueueSnackbar("Saved", { variant: "success" });
      await refreshTree();
    } catch (err) {
      enqueueSnackbar(err || "Failed to save", { variant: "error" });
    }
  };

  const handlePublish = async () => {
    if (!docId || !selectedDoc?._id) return;
    if (String(selectedDoc._id) !== String(docId)) return;

    if (isDirty) {
      await handleSave();
    }
    try {
      const result = await dispatch(publishDoc(docId)).unwrap();
      setEditTitle(result.data.title || "");
      setEditContent(result.data.content || "");
      setIsDirty(false);
      enqueueSnackbar("Document published", { variant: "success" });
      await refreshTree();
    } catch (err) {
      enqueueSnackbar(err || "Failed to publish", { variant: "error" });
    }
  };

  const handleUnpublish = async () => {
    if (!docId || !selectedDoc?._id) return;
    if (String(selectedDoc._id) !== String(docId)) return;

    try {
      const result = await dispatch(unpublishDoc(docId)).unwrap();
      setEditTitle(result.data.title || "");
      setEditContent(result.data.content || "");
      setIsDirty(false);
      enqueueSnackbar("Document unpublished", { variant: "success" });
      await refreshTree();
    } catch (err) {
      enqueueSnackbar(err || "Failed to unpublish", { variant: "error" });
    }
  };

  const handleDelete = async (nodeOverride) => {
    const target = nodeOverride || selectedDoc;
    if (!target?._id) return;

    const isFolder = target.type === "folder";
    const label = isFolder ? "folder" : "document";
    const cascadeNote = isFolder
      ? " All documents inside will also be removed."
      : "";
    const message = `Delete this ${label} "${target.title}"?${cascadeNote} This can be restored by an administrator later.`;

    if (!window.confirm(message)) return;

    try {
      await dispatch(deleteNode(target._id)).unwrap();
      enqueueSnackbar(
        isFolder ? "Folder deleted" : "Document deleted",
        { variant: "success" }
      );

      if (isFolder && selectedFolderId === target._id) {
        handleSelectRoot();
      }

      if (docId === target._id || isFolder) {
        navigate(ROUTES.DOCS);
      }

      await refreshTree();
    } catch (err) {
      enqueueSnackbar(err || "Failed to delete", { variant: "error" });
    }
  };

  const handleDeleteSelectedFolder = () => {
    if (selectedFolderNode) {
      handleDelete(selectedFolderNode);
    }
  };

  const selectedFolderNode =
    selectedFolderId && selectedFolderId !== DOCS_ROOT_ID
      ? findNodeById(tree, selectedFolderId)
      : null;

  const isRootSelected = selectedFolderId === DOCS_ROOT_ID;

  const isDocSelected = Boolean(selectedDoc && selectedDoc.type !== "folder");
  const isPublished = selectedDoc?.status === "published";
  const showEditor = isAdmin && isDocSelected;
  const showViewer = !isAdmin && isDocSelected && isPublished;
  const showBrowseView = !docId;
  const showDocView = !!docId;

  const adminActionButtons = isAdmin && isDocSelected && (
    <>
      {!isPublished && (
        <span className="text-xs px-2 py-1 rounded bg-[#383838] text-[#ababab]">
          Draft
        </span>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleSave}
        loading={saveLoading}
        disabled={!isDirty}
      >
        Save Draft
      </Button>
      {!isPublished ? (
        <Button
          variant="success"
          size="sm"
          icon={<MdPublish size={16} />}
          onClick={handlePublish}
          loading={saveLoading}
        >
          Publish
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          icon={<MdUnpublished size={16} />}
          onClick={handleUnpublish}
          loading={saveLoading}
        >
          Unpublish
        </Button>
      )}
      <Button
        variant="secondary"
        size="sm"
        icon={<MdEdit size={16} />}
        onClick={() => openRenameModal(selectedDoc)}
      >
        Rename
      </Button>
      <Button
        variant="danger"
        size="sm"
        icon={<MdDelete size={16} />}
        onClick={() => handleDelete()}
        loading={deleteLoading}
      >
        Delete
      </Button>
    </>
  );

  if (treeLoading && !tree.length) {
    return <FullScreenLoader />;
  }

  return (
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-80px)] pb-24 px-4 py-4 md:py-6 md:px-8">
      {/* Browse header — mobile full, desktop always */}
      <div
        className={`flex items-center justify-between mb-4 lg:mb-6 gap-3 ${
          showDocView ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <BackButton />
          <div className="flex items-center gap-2 min-w-0">
            <MdMenuBook size={22} className="text-[#f6b100] shrink-0" />
            <h1 className="text-xl lg:text-2xl font-semibold text-[#f5f5f5] truncate">
              Documentation
            </h1>
          </div>
        </div>

        {isAdmin && (
          <>
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<MdCreateNewFolder size={16} />}
                onClick={() => setCreateModal("folder")}
              >
                Folder
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<MdAdd size={16} />}
                onClick={() => setCreateModal("doc")}
              >
                Document
              </Button>
            </div>
            <DocsCreateMenu
              onCreateFolder={() => setCreateModal("folder")}
              onCreateDoc={() => setCreateModal("doc")}
            />
          </>
        )}
      </div>

      {/* Doc header — mobile only when viewing a doc */}
      {showDocView && (
        <div className="flex lg:hidden items-center justify-between mb-4 gap-2">
          <button
            type="button"
            onClick={handleBackToBrowse}
            className="flex items-center gap-1 text-[#f6b100] text-sm font-medium shrink-0"
          >
            <MdChevronLeft size={22} />
            Browse
          </button>
          <h2 className="text-base font-semibold text-[#f5f5f5] truncate flex-1 text-center px-2">
            {selectedDoc?.title || "Document"}
          </h2>
          {isAdmin && isDocSelected ? (
            <DocsActionsMenu
              isPublished={isPublished}
              isDirty={isDirty}
              saveLoading={saveLoading}
              deleteLoading={deleteLoading}
              onSave={handleSave}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onRename={() => selectedDoc && openRenameModal(selectedDoc)}
              onDelete={handleDelete}
            />
          ) : (
            <span className="w-10 shrink-0" />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[500px] lg:min-h-[600px]">
        {/* Tree — browse view on mobile, always visible on desktop */}
        <aside
          className={`bg-[#1f1f1f] rounded-2xl border border-[#343434] overflow-hidden ${
            showDocView ? "hidden lg:block" : "block"
          }`}
        >
          <div className="px-3 py-3 border-b border-[#343434]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-[#ababab]">
                  Browse
                </p>
                <p className="text-xs text-[#888] mt-1 truncate">
                  Create in:{" "}
                  {isRootSelected ? "Root" : selectedFolderNode?.title ?? "—"}
                </p>
              </div>
              {isAdmin && selectedFolderNode && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Rename folder"
                    aria-label="Rename folder"
                    onClick={handleRenameSelectedFolder}
                    disabled={renameLoading}
                    className="p-2 rounded-lg text-[#888] hover:text-[#f6b100] hover:bg-[#f6b100]/10 transition-colors disabled:opacity-40"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button
                    type="button"
                    title="Delete folder"
                    aria-label="Delete folder"
                    onClick={handleDeleteSelectedFolder}
                    disabled={deleteLoading}
                    className="p-2 rounded-lg text-[#888] hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              )}
              {isAdmin && isRootSelected && (
                <span className="text-[10px] uppercase tracking-wide text-[#ababab] shrink-0">
                  Root
                </span>
              )}
            </div>
          </div>
          <div className="max-h-[calc(100vh-180px)] lg:max-h-[calc(100vh-220px)] overflow-y-auto">
            <DocsTree
              tree={tree}
              selectedId={docId}
              selectedFolderId={selectedFolderId}
              onSelect={handleSelectDoc}
              onSelectFolder={handleSelectFolder}
              onSelectRoot={handleSelectRoot}
              onRename={isAdmin ? openRenameModal : undefined}
              onDelete={isAdmin ? handleDelete : undefined}
              isAdmin={isAdmin}
              loading={treeLoading}
            />
          </div>
        </aside>

        {/* Content — doc view on mobile, side panel on desktop */}
        <main
          className={`bg-[#1f1f1f] rounded-2xl border border-[#343434] p-4 md:p-6 min-h-[400px] ${
            showBrowseView ? "hidden lg:block" : "block"
          }`}
        >
          {docLoading && <FullScreenLoader />}

          {!docId && !docLoading && (
            <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[360px] text-center text-[#ababab]">
              <MdMenuBook size={48} className="mb-4 text-[#808080]" />
              <p className="text-lg text-[#d4d4d4]">
                Select a document from the tree
              </p>
              {isAdmin && (
                <p className="text-sm mt-2">
                  Or create a new folder or document to get started
                </p>
              )}
            </div>
          )}

          {docId && !docLoading && !selectedDoc && (
            <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-[#ababab]">
              <p>Document not found</p>
              <button
                type="button"
                onClick={handleBackToBrowse}
                className="mt-4 text-sm text-[#f6b100] lg:hidden"
              >
                Back to browse
              </button>
            </div>
          )}

          {selectedDoc && !docLoading && String(selectedDoc._id) === String(docId) && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {showEditor ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => {
                      setEditTitle(e.target.value);
                      setIsDirty(true);
                    }}
                    className="flex-1 min-w-0 w-full lg:min-w-[200px] text-lg lg:text-xl font-semibold bg-transparent border-b border-[#343434] pb-2 text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                  />
                ) : (
                  <h2 className="hidden lg:block text-xl font-semibold text-[#f5f5f5]">
                    {selectedDoc.title}
                  </h2>
                )}

                <div className="hidden lg:flex items-center gap-2 flex-wrap">
                  {adminActionButtons}
                </div>
              </div>

              {isAdmin && isDocSelected && !isPublished && (
                <span className="lg:hidden inline-block text-xs px-2 py-1 rounded bg-[#383838] text-[#ababab]">
                  Draft
                </span>
              )}

              {showEditor && docId && (
                <DocsEditor
                  key={docId}
                  content={editContent}
                  onChange={(html) => {
                    setEditContent(html);
                    setIsDirty(true);
                  }}
                />
              )}

              {showViewer && docId && (
                <DocsViewer key={docId} content={selectedDoc.content} />
              )}

              {isAdmin && selectedDoc.type === "folder" && (
                <div className="text-center py-8 space-y-4">
                  <p className="text-[#ababab] text-sm">
                    Folder selected. Create or open a document inside this folder.
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<MdEdit size={16} />}
                      onClick={() => openRenameModal(selectedDoc)}
                      loading={renameLoading}
                    >
                      Rename folder
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<MdDelete size={16} />}
                      onClick={() => handleDelete(selectedDoc)}
                      loading={deleteLoading}
                    >
                      Delete folder
                    </Button>
                  </div>
                </div>
              )}

              {!isAdmin && isDocSelected && !isPublished && (
                <div className="text-[#ababab] text-sm py-8 text-center">
                  This document is not available.
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <CreateNodeModal
        isOpen={!!createModal}
        onClose={() => setCreateModal(null)}
        onSubmit={handleCreate}
        type={createModal || "doc"}
        loading={createLoading}
        parentTitle={getCreateParentTitle()}
      />

      <RenameNodeModal
        isOpen={!!renameNode}
        onClose={() => setRenameNode(null)}
        onSubmit={handleRename}
        node={renameNode}
        loading={renameLoading}
      />
    </section>
  );
};

export default Docs;
