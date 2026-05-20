import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import {
  MdAdd,
  MdChevronLeft,
  MdCreateNewFolder,
  MdDelete,
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

const findNodeById = (nodes, id) => {
  for (const node of nodes) {
    if (node._id === id) return node;
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

  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderTitle, setSelectedFolderTitle] = useState("");
  const [createModal, setCreateModal] = useState(null);
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
      dispatch(fetchDoc(docId));
    } else {
      dispatch(clearSelectedDoc());
    }
  }, [dispatch, docId]);

  useEffect(() => {
    if (selectedDoc) {
      setEditTitle(selectedDoc.title || "");
      setEditContent(selectedDoc.content || "");
      setIsDirty(false);
    }
  }, [selectedDoc]);

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

  const getParentId = () => selectedFolderId || null;

  const refreshTree = async () => {
    await dispatch(fetchDocTree());
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
    if (!selectedDoc?._id) return;
    try {
      await dispatch(
        updateDoc({
          id: selectedDoc._id,
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
    if (!selectedDoc?._id) return;
    if (isDirty) {
      await handleSave();
    }
    try {
      await dispatch(publishDoc(selectedDoc._id)).unwrap();
      enqueueSnackbar("Document published", { variant: "success" });
      await refreshTree();
      dispatch(fetchDoc(selectedDoc._id));
    } catch (err) {
      enqueueSnackbar(err || "Failed to publish", { variant: "error" });
    }
  };

  const handleUnpublish = async () => {
    if (!selectedDoc?._id) return;
    try {
      await dispatch(unpublishDoc(selectedDoc._id)).unwrap();
      enqueueSnackbar("Document unpublished", { variant: "success" });
      await refreshTree();
      dispatch(fetchDoc(selectedDoc._id));
    } catch (err) {
      enqueueSnackbar(err || "Failed to unpublish", { variant: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc?._id) return;
    const label = selectedDoc.type === "folder" ? "folder" : "document";
    if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;

    try {
      await dispatch(deleteNode(selectedDoc._id)).unwrap();
      enqueueSnackbar("Deleted", { variant: "success" });
      navigate(ROUTES.DOCS);
      await refreshTree();
    } catch (err) {
      enqueueSnackbar(err || "Failed to delete", { variant: "error" });
    }
  };

  const selectedFolderNode = selectedFolderId
    ? findNodeById(tree, selectedFolderId)
    : null;

  const isDocSelected = selectedDoc?.type === "doc";
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
        variant="danger"
        size="sm"
        icon={<MdDelete size={16} />}
        onClick={handleDelete}
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
            <p className="text-xs uppercase tracking-wide text-[#ababab]">
              Browse
            </p>
            {selectedFolderNode && (
              <p className="text-xs text-[#888] mt-1 truncate">
                Selected folder: {selectedFolderNode.title}
              </p>
            )}
          </div>
          <div className="max-h-[calc(100vh-180px)] lg:max-h-[calc(100vh-220px)] overflow-y-auto">
            <DocsTree
              tree={tree}
              selectedId={docId}
              selectedFolderId={selectedFolderId}
              onSelect={handleSelectDoc}
              onSelectFolder={handleSelectFolder}
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

          {selectedDoc && !docLoading && (
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

              {showEditor && (
                <DocsEditor
                  content={editContent}
                  onChange={(html) => {
                    setEditContent(html);
                    setIsDirty(true);
                  }}
                />
              )}

              {showViewer && <DocsViewer content={selectedDoc.content} />}

              {isAdmin && selectedDoc.type === "folder" && (
                <div className="text-[#ababab] text-sm py-8 text-center">
                  Folder selected. Create or open a document inside this folder.
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
        parentTitle={selectedFolderTitle || undefined}
      />
    </section>
  );
};

export default Docs;
