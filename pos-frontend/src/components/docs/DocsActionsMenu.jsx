import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  MdMoreVert,
  MdSave,
  MdPublish,
  MdUnpublished,
  MdDelete,
  MdEdit,
} from "react-icons/md";

const DocsActionsMenu = ({
  isPublished,
  isDirty,
  saveLoading,
  deleteLoading,
  onSave,
  onPublish,
  onUnpublish,
  onRename,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const items = [
    ...(onRename
      ? [
          {
            label: "Rename",
            icon: <MdEdit size={18} />,
            onClick: onRename,
          },
        ]
      : []),
    {
      label: "Save draft",
      icon: <MdSave size={18} />,
      onClick: onSave,
      disabled: !isDirty || saveLoading,
    },
    isPublished
      ? {
          label: "Unpublish",
          icon: <MdUnpublished size={18} />,
          onClick: onUnpublish,
          disabled: saveLoading,
        }
      : {
          label: "Publish",
          icon: <MdPublish size={18} />,
          onClick: onPublish,
          disabled: saveLoading,
        },
    {
      label: "Delete",
      icon: <MdDelete size={18} />,
      onClick: onDelete,
      disabled: deleteLoading,
      danger: true,
    },
  ];

  return (
    <div className="relative lg:hidden" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-lg text-[#ababab] hover:bg-[#2a2a2a] hover:text-[#f5f5f5] transition-colors"
        aria-label="Document actions"
      >
        <MdMoreVert size={22} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] bg-[#262626] border border-[#343434] rounded-xl shadow-lg overflow-hidden">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                item.danger
                  ? "text-red-400 hover:bg-red-900/20"
                  : "text-[#f5f5f5] hover:bg-[#2a2a2a]"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

DocsActionsMenu.propTypes = {
  isPublished: PropTypes.bool.isRequired,
  isDirty: PropTypes.bool.isRequired,
  saveLoading: PropTypes.bool,
  deleteLoading: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onUnpublish: PropTypes.func.isRequired,
  onRename: PropTypes.func,
  onDelete: PropTypes.func.isRequired,
};

export default DocsActionsMenu;
