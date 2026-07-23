import { useMemo } from "react";
import { FaHome } from "react-icons/fa";
import {
  MdOutlineReorder,
  MdStorage,
  MdMoreHoriz,
} from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { ROUTES } from "../../constants";
import { useV2Ui } from "../../hooks/useV2Ui";
import MoreMenuSheet from "./MoreMenuSheet";

const TAB_ITEMS = [
  {
    id: "home",
    label: "Home",
    path: ROUTES.ROOT,
    icon: FaHome,
    isActive: (pathname) => pathname === ROUTES.ROOT,
  },
  {
    id: "orders",
    label: "Orders",
    path: ROUTES.ORDERS,
    icon: MdOutlineReorder,
    isActive: (pathname) =>
      pathname === ROUTES.ORDERS || pathname.startsWith(`${ROUTES.ORDERS}/`),
  },
  {
    id: "pos",
    label: "POS",
    path: ROUTES.MENU_ORDER,
    icon: BiSolidDish,
    isActive: (pathname) => pathname === ROUTES.MENU_ORDER,
  },
  {
    id: "storage",
    label: "Storage",
    path: ROUTES.STORAGE,
    icon: MdStorage,
    isActive: (pathname) => pathname.startsWith("/storage"),
  },
];

const BottomNav = ({ moreOpen, onMoreOpen, onMoreClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { v2UiEnabled } = useV2Ui();

  const moreActive = useMemo(() => {
    const mainTabActive = TAB_ITEMS.some((tab) => tab.isActive(location.pathname));
    return moreOpen || !mainTabActive;
  }, [location.pathname, moreOpen]);

  if (!v2UiEnabled) {
    return null;
  }

  const handleTabClick = (tab) => {
    if (tab.id === "more") {
      onMoreOpen();
      return;
    }
    onMoreClose();
    navigate(tab.path);
  };

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#343434] bg-[#1a1a1a]/95 backdrop-blur-sm lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Main navigation"
      >
        <div className="grid grid-cols-5">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.isActive(location.pathname);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-[#f6b100]"
                    : "text-[#ababab] hover:text-[#f5f5f5]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => handleTabClick({ id: "more" })}
            className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors ${
              moreActive
                ? "text-[#f6b100]"
                : "text-[#ababab] hover:text-[#f5f5f5]"
            }`}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
          >
            <MdMoreHoriz size={20} />
            <span>More</span>
          </button>
        </div>
      </nav>

      <MoreMenuSheet isOpen={moreOpen} onClose={onMoreClose} />
    </>
  );
};

BottomNav.propTypes = {
  moreOpen: PropTypes.bool.isRequired,
  onMoreOpen: PropTypes.func.isRequired,
  onMoreClose: PropTypes.func.isRequired,
};

export default BottomNav;
