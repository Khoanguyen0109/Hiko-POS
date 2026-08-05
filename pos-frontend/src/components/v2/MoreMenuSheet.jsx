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
  MdQrCodeScanner,
} from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { ROUTES } from "../../constants";
import BottomSheet from "../shared/BottomSheet";

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
    {
      label: "Finance",
      items: [
        { path: ROUTES.SPENDING, icon: <MdReceipt size={18} />, label: "Expenses" },
        {
          path: ROUTES.SHIFT_CHECKOUT,
          icon: <MdAccountBalanceWallet size={18} />,
          label: "Shift checkout",
        },
        {
          path: ROUTES.REDEEM_REWARD,
          icon: <MdQrCodeScanner size={18} />,
          label: "Redeem Reward",
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
              { path: ROUTES.RECIPES, icon: <MdMenuBook size={18} />, label: "Recipes" },
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

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="More"
      maxHeight="85dvh"
      size="full"
      zIndexClass="z-[60]"
      bodyClassName="px-3 py-3 overscroll-contain"
    >
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
    </BottomSheet>
  );
};

MoreMenuSheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default MoreMenuSheet;
