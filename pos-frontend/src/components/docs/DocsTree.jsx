import { useState } from "react";
import PropTypes from "prop-types";
import {
  MdFolder,
  MdFolderOpen,
  MdDescription,
  MdChevronRight,
  MdExpandMore,
} from "react-icons/md";

const DocsTreeNode = ({
  node,
  selectedId,
  onSelect,
  onSelectFolder,
  selectedFolderId,
  isAdmin,
  depth = 0,
}) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const isFolder = node.type === "folder";
  const isSelected = isFolder
    ? selectedFolderId === node._id
    : selectedId === node._id;
  const hasChildren = isFolder && node.children?.length > 0;
  const isDraft = node.type === "doc" && node.status === "draft";

  const handleClick = () => {
    if (isFolder) {
      onSelectFolder(node);
      if (hasChildren) setExpanded((prev) => !prev);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 min-h-11 py-2.5 px-2 rounded-lg text-left text-sm transition-colors ${
          isSelected
            ? "bg-[#f6b100]/15 text-[#f6b100]"
            : "text-[#d4d4d4] hover:bg-[#2a2a2a]"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
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

      {isFolder && expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <DocsTreeNode
              key={child._id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onSelectFolder={onSelectFolder}
              selectedFolderId={selectedFolderId}
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
  onSelect: PropTypes.func.isRequired,
  onSelectFolder: PropTypes.func.isRequired,
  selectedFolderId: PropTypes.string,
  isAdmin: PropTypes.bool.isRequired,
  depth: PropTypes.number,
};

const DocsTree = ({
  tree,
  selectedId,
  selectedFolderId,
  onSelect,
  onSelectFolder,
  isAdmin,
  loading,
}) => {
  if (loading) {
    return (
      <div className="p-4 text-sm text-[#ababab]">Loading tree...</div>
    );
  }

  if (!tree?.length) {
    return (
      <div className="p-4 text-sm text-[#ababab]">
        {isAdmin
          ? "No documentation yet. Create a folder or document to get started."
          : "No published documentation available."}
      </div>
    );
  }

  return (
    <div className="py-2">
      {tree.map((node) => (
        <DocsTreeNode
          key={node._id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          onSelectFolder={onSelectFolder}
          selectedFolderId={selectedFolderId}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};

DocsTree.propTypes = {
  tree: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  selectedFolderId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onSelectFolder: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  loading: PropTypes.bool,
};

export default DocsTree;
