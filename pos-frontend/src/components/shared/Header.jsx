import { FaSearch } from "react-icons/fa";
import { FaUserCircle } from "react-icons/fa";
import { FaBell } from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { IoLogOut } from "react-icons/io5";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { MdDashboard, MdPerson, MdSettings, MdKeyboardArrowDown } from "react-icons/md";
import { useState, useRef, useEffect } from "react";
import { ROUTES } from "../../constants";

const Header = () => {
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: (data) => {
      console.log(data);
      dispatch(removeUser());
      navigate(ROUTES.AUTH);
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleMenuClick = (route) => {
    navigate(route);
    setShowUserMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="flex justify-between items-center py-4 px-8 bg-[#1a1a1a]">
      {/* LOGO */}
      <div onClick={() => userData.role === "Admin" ? navigate("/") : navigate("/orders")} className="flex items-center gap-2 cursor-pointer">
        <img src={logo} className="h-8 w-8" alt="restro logo" />
        <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">
          Restro
        </h1>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-5 py-2 w-[500px]">
        <FaSearch className="text-[#f5f5f5]" />
        <input
          type="text"
          placeholder="Search"
          className="bg-[#1f1f1f] outline-none text-[#f5f5f5]"
        />
      </div>

      {/* LOGGED USER DETAILS */}
      <div className="flex items-center gap-4">
        {userData.role === "Admin" && (
          <div onClick={() => navigate("/dashboard")} className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer">
            <MdDashboard className="text-[#f5f5f5] text-2xl" />
          </div>
        )}
        <div className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer">
          <FaBell className="text-[#f5f5f5] text-2xl" />
        </div>
        
        {/* User Profile Section with Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <div 
            onClick={toggleUserMenu}
            className="flex items-center gap-3 cursor-pointer bg-[#1f1f1f] rounded-[15px] p-3 hover:bg-[#262626] transition-colors"
          >
            <FaUserCircle className="text-[#f5f5f5] text-4xl" />
            <div className="flex flex-col items-start">
              <h1 className="text-md text-[#f5f5f5] font-semibold tracking-wide">
                {userData.name || "TEST USER"}
              </h1>
              <p className="text-xs text-[#ababab] font-medium">
                {userData.role || "Role"}
              </p>
            </div>
            <MdKeyboardArrowDown 
              className={`text-[#f5f5f5] transition-transform duration-200 ${
                showUserMenu ? 'rotate-180' : ''
              }`}
              size={20}
            />
          </div>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#1f1f1f] rounded-lg border border-[#343434] shadow-xl z-50">
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-[#343434]">
                <p className="text-[#f5f5f5] font-medium text-sm">Signed in as</p>
                <p className="text-[#ababab] text-xs">{userData.email || "user@example.com"}</p>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => handleMenuClick(ROUTES.ACCOUNT_SETTINGS)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[#f5f5f5] hover:bg-[#262626] transition-colors text-left"
                >
                  <MdPerson size={18} className="text-[#ababab]" />
                  <span className="text-sm">Account Settings</span>
                </button>
                
                <button
                  onClick={() => handleMenuClick(ROUTES.SETTINGS)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[#f5f5f5] hover:bg-[#262626] transition-colors text-left"
                >
                  <MdSettings size={18} className="text-[#ababab]" />
                  <span className="text-sm">Settings</span>
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-[#343434]"></div>

              {/* Logout Button */}
              <div className="py-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-[#262626] transition-colors text-left"
                >
                  <IoLogOut size={18} />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
