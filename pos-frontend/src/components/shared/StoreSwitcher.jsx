import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveStore, fetchAllStores, fetchMyStores } from "../../redux/slices/storeSlice";
import { MdStore, MdKeyboardArrowDown, MdCheck } from "react-icons/md";

const StoreSwitcher = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stores, allStores, activeStore } = useSelector((state) => state.store);
  const { role } = useSelector((state) => state.user);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = role === "Admin";

  useEffect(() => {
    if (isAdmin && allStores.length === 0) {
      dispatch(fetchAllStores());
    } else if (!isAdmin && stores.length === 0) {
      dispatch(fetchMyStores());
    }
  }, [dispatch, isAdmin, allStores.length, stores.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitch = (store) => {
    dispatch(setActiveStore(store));
    setOpen(false);
    navigate("/");
    window.location.reload();
  };

  // Admin sees all stores; regular users see their assigned stores
  const storeList = isAdmin
    ? allStores.filter((s) => s.isActive !== false)
    : stores;

  if (!activeStore) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#1f1f1f] rounded-[15px] px-3 py-2 md:py-3 hover:bg-[#262626] transition-colors"
      >
        <MdStore className="text-yellow-400 text-lg" />
        <span className="text-[#f5f5f5] text-sm font-medium max-w-[120px] truncate">
          {activeStore.name}
        </span>
        <MdKeyboardArrowDown
          className={`text-[#f5f5f5] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          size={18}
        />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 bg-[#1f1f1f] rounded-lg border border-[#343434] shadow-xl z-50">
          <div className="px-4 py-2 border-b border-[#343434]">
            <p className="text-[#ababab] text-xs font-medium uppercase tracking-wider">
              Switch Store
            </p>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {storeList.map((store) => (
              <button
                key={store._id}
                onClick={() => handleSwitch(store)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#262626] transition-colors text-left ${
                  activeStore._id === store._id ? "bg-[#262626]" : ""
                }`}
              >
                <MdStore className="text-[#ababab] text-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[#f5f5f5] text-sm font-medium truncate">{store.name}</p>
                  <p className="text-[#666] text-xs">{store.code}</p>
                </div>
                {activeStore._id === store._id && (
                  <MdCheck className="text-yellow-400 text-lg flex-shrink-0" />
                )}
              </button>
            ))}
            {storeList.length === 0 && (
              <p className="px-4 py-3 text-[#ababab] text-sm">No stores available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreSwitcher;
