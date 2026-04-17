import { useEffect, useRef } from "react";
import { FaHome, FaUsers, FaCalendarAlt } from "react-icons/fa";
import {
  MdOutlineReorder,
  MdTableBar,
  MdReceipt,
  MdStorage,
  MdStore,
  MdClose,
  MdCategory,
  MdLocalOffer,
  MdSchedule,
  MdInventory,
  MdBusiness,
  MdMenu,
  MdStar,
  MdPeople,
  MdCardGiftcard,
} from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { ROUTES } from "../../constants";

const Sidebar = ({ isOpen, onClose, onOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useSelector((state) => state.user);
  const activeStore = useSelector((state) => state.store.activeStore);
  const isAdmin = role === "Admin";
  const storeRole = activeStore?.role || activeStore?.storeRole || "";
  const canManageTickets = isAdmin || storeRole === "Owner" || storeRole === "Manager";

  const sidebarRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest("[data-sidebar-toggle]")
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navSections = [
    {
      label: "Main",
      items: [
        { path: ROUTES.ROOT, icon: <FaHome size={18} />, label: "Home" },
        {
          path: ROUTES.ORDERS,
          icon: <MdOutlineReorder size={18} />,
          label: "Orders",
        },
        {
          path: ROUTES.TABLES,
          icon: <MdTableBar size={18} />,
          label: "Tables",
        },
      ],
    },
    {
      label: "Finance",
      items: [
        {
          path: ROUTES.SPENDING,
          icon: <MdReceipt size={18} />,
          label: "Expenses",
        },
      ],
    },
    {
      label: "Inventory",
      items: [
        {
          path: ROUTES.STORAGE,
          icon: <MdStorage size={18} />,
          label: "Storage",
        },
        ...(isAdmin
          ? [
              {
                path: ROUTES.STORAGE_ITEMS,
                icon: <MdInventory size={18} />,
                label: "Storage Items",
              },
              {
                path: ROUTES.SUPPLIERS,
                icon: <MdBusiness size={18} />,
                label: "Suppliers",
              },
            ]
          : []),
      ],
    },
    ...(isAdmin
      ? [
          {
            label: "Menu Management",
            items: [
              {
                path: ROUTES.DISHES,
                icon: <BiSolidDish size={18} />,
                label: "Dishes",
              },
              {
                path: ROUTES.CATEGORIES,
                icon: <MdCategory size={18} />,
                label: "Categories",
              },
              {
                path: ROUTES.TOPPINGS,
                icon: <MdLocalOffer size={18} />,
                label: "Toppings",
              },
              {
                path: ROUTES.PROMOTIONS,
                icon: <MdLocalOffer size={18} />,
                label: "Promotions",
              },
            ],
          },
          {
            label: "Customers & Rewards",
            items: [
              {
                path: ROUTES.CUSTOMERS,
                icon: <MdPeople size={18} />,
                label: "Customers",
              },
              {
                path: ROUTES.REWARD_PROGRAMS,
                icon: <MdCardGiftcard size={18} />,
                label: "Rewards",
              },
            ],
          },
        ]
      : []),
    {
      label: "Schedule",
      items: [
        {
          path: ROUTES.SCHEDULES,
          icon: <FaCalendarAlt size={18} />,
          label: "Schedules",
        },
        ...(isAdmin
          ? [
              {
                path: ROUTES.SHIFT_TEMPLATES,
                icon: <MdSchedule size={18} />,
                label: "Shift Templates",
              },
            ]
          : []),
      ],
    },
    ...(canManageTickets
      ? [
          {
            label: "Tickets",
            items: [
              {
                path: ROUTES.TICKETS,
                icon: <MdStar size={18} />,
                label: "Tickets",
              },
            ],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            label: "Admin",
            items: [
              {
                path: ROUTES.MEMBERS,
                icon: <FaUsers size={18} />,
                label: "Members",
              },
              {
                path: ROUTES.STORES,
                icon: <MdStore size={18} />,
                label: "Stores",
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* New order FAB */}
      <button
        onClick={() => {
          navigate(ROUTES.MENU_ORDER);
          onClose();
        }}
        className="fixed bottom-4 right-4 z-30 bg-[#f6b100] text-[#f5f5f5] rounded-full p-3 md:p-4 shadow-lg"
      >
        <BiSolidDish size={28} />
      </button>

      {/* Backdrop — only when fully expanded */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar — mobile: slide in/out fully, desktop: collapse to icons */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full bg-[#1a1a1a] border-r border-[#343434] z-50 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen
            ? "w-64 translate-x-0"
            : "w-[56px] translate-x-0"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-[#343434] min-h-[57px]">
          {isOpen ? (
            <>
              <span className="text-[#f5f5f5] text-lg font-bold tracking-wide ml-1">
                Menu
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-[#262626] transition-colors"
              >
                <MdClose size={20} className="text-[#ababab]" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpen}
              className="p-1 rounded-lg hover:bg-[#262626] transition-colors mx-auto"
              data-sidebar-toggle
            >
              <MdMenu size={20} className="text-[#ababab]" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3 scrollbar-hide">
          {navSections.map((section) => (
            <div key={section.label}>
              {isOpen && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#666]">
                  {section.label}
                </p>
              )}
              {!isOpen && section !== navSections[0] && (
                <hr className="border-[#343434] mx-1 my-1" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    title={!isOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                      isOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"
                    } ${
                      isActive(item.path)
                        ? "bg-[#f6b100]/15 text-[#f6b100]"
                        : "text-[#ababab] hover:bg-[#262626] hover:text-[#f5f5f5]"
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 py-3 border-t border-[#343434]">
          {isOpen ? (
            <p className="text-[#666] text-xs text-center">Hiko POS</p>
          ) : (
            <p className="text-[#666] text-[10px] text-center font-bold">H</p>
          )}
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpen: PropTypes.func,
};

export default Sidebar;
