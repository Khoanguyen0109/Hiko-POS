import { useEffect } from "react";
import { FaHome, FaUsers, FaCalendarAlt } from "react-icons/fa";
import {
  MdOutlineReorder,
  MdReceipt,
  MdAccountBalanceWallet,
  MdStorage,
  MdStore,
  MdCategory,
  MdLocalOffer,
  MdSchedule,
  MdInventory,
  MdBusiness,
  MdStar,
  MdPeople,
  MdCardGiftcard,
  MdMenuBook,
  MdClose,
} from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { ROUTES } from "../../constants";

function buildMoreMenuSections({ isAdmin, canManageTickets }) {
  return [
    {
      label: "Main",
      items: [
        { path: ROUTES.ROOT, icon: <FaHome size={18} />, label: "Home" },
        { path: ROUTES.ORDERS, icon: <MdOutlineReorder size={18} />, label: "Orders" },
        { path: ROUTES.DOCS, icon: <MdMenuBook size={18} />, label: "Documentation" },
      ],
    },
    {
      label: "Finance",
      items: [
        { path: ROUTES.SPENDING, icon: <MdReceipt size={18} />, label: "Expenses" },
        {
          path: ROUTES.SHIFT_CHECKOUT,
          icon: <MdAccountBalanceWallet size={18} />,
          label: "Shift checkout",
        },
      ],
    },
    {
      label: "Inventory",
      items: [
        { path: ROUTES.STORAGE, icon: <MdStorage size={18} />, label: "Storage" },
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
              { path: ROUTES.DISHES, icon: <BiSolidDish size={18} />, label: "Dishes" },
              { path: ROUTES.CATEGORIES, icon: <MdCategory size={18} />, label: "Categories" },
              { path: ROUTES.TOPPINGS, icon: <MdLocalOffer size={18} />, label: "Toppings" },
              { path: ROUTES.PROMOTIONS, icon: <MdLocalOffer size={18} />, label: "Promotions" },
            ],
          },
          {
            label: "Customers & Rewards",
            items: [
              { path: ROUTES.CUSTOMERS, icon: <MdPeople size={18} />, label: "Customers" },
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
        { path: ROUTES.SCHEDULES, icon: <FaCalendarAlt size={18} />, label: "Schedules" },
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
            items: [{ path: ROUTES.TICKETS, icon: <MdStar size={18} />, label: "Tickets" }],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            label: "Admin",
            items: [
              { path: ROUTES.MEMBERS, icon: <FaUsers size={18} />, label: "Members" },
              { path: ROUTES.STORES, icon: <MdStore size={18} />, label: "Stores" },
            ],
          },
        ]
      : []),
  ];
}

const MoreMenuSheet = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useSelector((state) => state.user);
  const activeStore = useSelector((state) => state.store.activeStore);
  const isAdmin = role === "Admin";
  const storeRole = activeStore?.role || activeStore?.storeRole || "";
  const canManageTickets = isAdmin || storeRole === "Owner" || storeRole === "Manager";

  const sections = buildMoreMenuSections({ isAdmin, canManageTickets });

  const isActive = (path) => {
    if (path === ROUTES.DOCS) {
      return (
        location.pathname === path ||
        location.pathname.startsWith(`${path}/`)
      );
    }
    return location.pathname === path;
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="More navigation"
        className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-hidden rounded-t-2xl border border-[#343434] bg-[#1a1a1a] shadow-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-between border-b border-[#343434] px-4 py-3">
          <h2 className="text-base font-semibold text-[#f5f5f5]">More</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#ababab] hover:bg-[#262626] hover:text-[#f5f5f5]"
            aria-label="Close"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-3 py-3 scrollbar-hide">
          {sections.map((section) => (
            <div key={section.label} className="mb-4 last:mb-0">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-[#666]">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className={`flex min-h-[48px] w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? "bg-brand/15 text-brand"
                        : "text-[#ababab] hover:bg-[#262626] hover:text-[#f5f5f5]"
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

MoreMenuSheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default MoreMenuSheet;
