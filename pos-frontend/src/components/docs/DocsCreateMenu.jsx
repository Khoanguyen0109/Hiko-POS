import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { MdAdd, MdCreateNewFolder, MdDescription } from "react-icons/md";

const DocsCreateMenu = ({ onCreateFolder, onCreateDoc }) => {
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

  return (
    <div className="relative lg:hidden" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-full bg-[#f6b100] text-[#1f1f1f] shadow-lg"
        aria-label="Create new"
      >
        <MdAdd size={22} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 min-w-[160px] bg-[#262626] border border-[#343434] rounded-xl shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onCreateFolder();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#f5f5f5] hover:bg-[#2a2a2a] text-left"
          >
            <MdCreateNewFolder size={18} className="text-[#f6b100]" />
            New folder
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onCreateDoc();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#f5f5f5] hover:bg-[#2a2a2a] text-left border-t border-[#343434]"
          >
            <MdDescription size={18} className="text-[#f6b100]" />
            New document
          </button>
        </div>
      )}
    </div>
  );
};

DocsCreateMenu.propTypes = {
  onCreateFolder: PropTypes.func.isRequired,
  onCreateDoc: PropTypes.func.isRequired,
};

export default DocsCreateMenu;
