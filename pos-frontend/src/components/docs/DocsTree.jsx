import { useState } from "react";
import PropTypes from "prop-types";
import {
  MdFolder,
  MdFolderOpen,
  MdDescription,
  MdChevronRight,
  MdExpandMore,
  MdDelete,
  MdEdit,
  MdHome,
} from "react-icons/md";
import { DOCS_ROOT_ID, isFolderNode } from "../../constants/docs";

const DocsTreeNode = ({
  node,
  selectedId,
  highlightFolderId,
  onSelect,
  onSelectFolder,
  onRename,
  onDelete,
  isAdmin,
  depth = 0,
}) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const isFolder = isFolderNode(node);
  const hasDocSelection = Boolean(selectedId);
  const isSelected = hasDocSelection
    ? !isFolder && String(selectedId) === String(node._id)
    : isFolder && String(highlightFolderId) === String(node._id);
  const hasChildren = isFolder && node.children?.length > 0;
  const isDraft = !isFolder && node.status === "draft";

  const handleClick = () => {
    if (isFolder) {
      onSelectFolder(node);
      if (hasChildren) setExpanded((prev) => !prev);
    } else {
      onSelect(node);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(node);
  };

  const handleRename = (e) => {
    e.stopPropagation();
    onRename?.(node);
  };

  return (
    <div>
      <div
        className={`w-full flex items-center gap-1 min-h-11 rounded-lg transition-colors ${
          isSelected ? "bg-[#f6b100]/15" : "hover:bg-[#2a2a2a]"
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          onClick={handleClick}
          className={`flex-1 flex items-center gap-1.5 py-2.5 px-2 rounded-lg text-left text-sm min-w-0 ${
            isSelected ? "text-[#f6b100]" : "text-[#d4d4d4]"
          }`}
        >
          {isFolder && hasChildren ? (
            expanded ? (
              <MdExpandMore size={16} className="shrink-0 text-[#ababab]" />
            ) : (
              <MdChevronRight size={16} className="shrink-0 text-[#ababab]" />
            )
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {isFolder ? (
            expanded ? (
              <MdFolderOpen size={16} className="shrink-0 text-[#f6b100]" />
            ) : (
              <MdFolder size={16} className="shrink-0 text-[#f6b100]" />
            )
          ) : (
            <MdDescription
              size={16}
              className={`shrink-0 ${isDraft ? "text-[#888]" : "text-[#ababab]"}`}
            />
          )}

          <span className={`truncate flex-1 ${isDraft ? "text-[#888]" : ""}`}>
            {node.title}
          </span>

          {!isFolder && (
            <MdChevronRight
              size={16}
              className="shrink-0 text-[#666] lg:hidden"
            />
          )}

          {isAdmin && isDraft && (
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#383838] text-[#ababab] shrink-0">
              Draft
            </span>
          )}
        </button>

        {isAdmin && onRename && (
          <button
            type="button"
            onClick={handleRename}
            title={`Rename ${isFolder ? "folder" : "document"}`}
            className="p-2 rounded-lg text-[#888] hover:text-[#f6b100] hover:bg-[#f6b100]/10 shrink-0 transition-colors"
          >
            <MdEdit size={16} />
          </button>
        )}

        {isAdmin && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            title={`Delete ${isFolder ? "folder" : "document"}`}
            className="p-2 mr-1 rounded-lg text-[#888] hover:text-red-400 hover:bg-red-900/20 shrink-0 transition-colors"
          >
            <MdDelete size={16} />
          </button>
        )}
      </div>

      {isFolder && expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <DocsTreeNode
              key={child._id}
              node={child}
              selectedId={selectedId}
              highlightFolderId={highlightFolderId}
              onSelect={onSelect}
              onSelectFolder={onSelectFolder}
              onRename={onRename}
              onDelete={onDelete}
              isAdmin={isAdmin}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

DocsTreeNode.propTypes = {
  node: PropTypes.object.isRequired,
  selectedId: PropTypes.string,
  highlightFolderId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onSelectFolder: PropTypes.func.isRequired,
  onRename: PropTypes.func,
  onDelete: PropTypes.func,
  isAdmin: PropTypes.bool.isRequired,
  depth: PropTypes.number,
};

const DocsTree = ({
  tree,
  selectedId,
  selectedFolderId,
  onSelect,
  onSelectFolder,
  onSelectRoot,
  onRename,
  onDelete,
  isAdmin,
  loading,
}) => {
  const hasDocSelection = Boolean(selectedId);
  const isRootSelected =
    !hasDocSelection && selectedFolderId === DOCS_ROOT_ID;
  const highlightFolderId = hasDocSelection ? null : selectedFolderId;

  if (loading) {
    return (
      <div className="p-4 text-sm text-[#ababab]">Loading tree...</div>
    );
  }

  return (
    <div className="py-2">
      <button
        type="button"
        onClick={onSelectRoot}
        className={`w-full flex items-center gap-2 min-h-11 py-2.5 px-3 mx-1 rounded-lg text-left text-sm transition-colors ${
          isRootSelected
            ? "bg-[#f6b100]/15 text-[#f6b100]"
            : "text-[#d4d4d4] hover:bg-[#2a2a2a]"
        }`}
      >
        <MdHome size={16} className="shrink-0" />
        <span className="font-medium">Root</span>
        {isRootSelected && isAdmin && (
          <span className="text-[10px] uppercase tracking-wide ml-auto text-[#ababab]">
            Create here
          </span>
        )}
      </button>

      {!tree?.length ? (
        <div className="p-4 pt-2 text-sm text-[#ababab]">
          {isAdmin
            ? "No folders or documents yet. Create at root or inside a folder."
            : "No published documentation available."}
        </div>
      ) : (
        tree.map((node) => (
          <DocsTreeNode
            key={node._id}
            node={node}
            selectedId={selectedId}
            highlightFolderId={highlightFolderId}
            onSelect={onSelect}
            onSelectFolder={onSelectFolder}
            onRename={onRename}
            onDelete={onDelete}
            isAdmin={isAdmin}
          />
        ))
      )}
    </div>
  );
};

DocsTree.propTypes = {
  tree: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  selectedFolderId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onSelectFolder: PropTypes.func.isRequired,
  onSelectRoot: PropTypes.func.isRequired,
  onRename: PropTypes.func,
  onDelete: PropTypes.func,
  isAdmin: PropTypes.bool.isRequired,
  loading: PropTypes.bool,
};

export default DocsTree;
