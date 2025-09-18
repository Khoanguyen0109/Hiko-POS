import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/shared/BackButton";
import { MdRestaurantMenu, MdShoppingCart } from "react-icons/md";
import MenuContainer from "../components/menu/MenuContainer";
import CustomerInfo from "../components/menu/CustomerInfo";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import { useSelector } from "react-redux";
import { ROUTES } from "../constants";

const MenuOrder = () => {
  const navigate = useNavigate();
  const customerData = useSelector((state) => state.customer);
  const cartItems = useSelector((state) => state.cart);

  useEffect(() => {
    document.title = "POS | Menu";
  }, []);

  const handleCartClick = () => {
    navigate(ROUTES.MOBILE_CART);
  };

  return (
    <section className="bg-[#1f1f1f] pb-20 flex flex-col lg:flex-row gap-3 min-h-screen relative">
      {/* Left Div - Menu Container */}
      <div className="flex-1 lg:flex-[3]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-[#f5f5f5] text-xl sm:text-2xl font-bold tracking-wider">
              Menu
            </h1>
          </div>
          <div className="flex items-center gap-3 cursor-pointer">
            <MdRestaurantMenu className="text-[#f5f5f5] text-2xl sm:text-4xl" />
            <div className="flex flex-col items-start">
              <h1 className="text-sm sm:text-md text-[#f5f5f5] font-semibold tracking-wide">
                {customerData.customerName || "Customer Name"}
              </h1>
              <p className="text-xs text-[#ababab] font-medium">
                Table : {customerData.table?.tableNo || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <MenuContainer />
      </div>

      {/* Right Div - Cart Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-[1] bg-[#1a1a1a] mt-4 mr-3 rounded-lg pt-2 flex-col">
        {/* Customer Info */}
        <CustomerInfo />
        <hr className="border-[#2a2a2a] border-t-2" />
        {/* Cart Items */}
        <CartInfo />
        <hr className="border-[#2a2a2a] border-t-2" />
        {/* Bills */}
        <Bill />
      </div>

      {/* Mobile Cart Button - Fixed position */}
      <button
        onClick={handleCartClick}
        className="lg:hidden fixed bottom-20 right-4 bg-[#f6b100] text-[#1f1f1f] rounded-full p-4 shadow-lg z-50 flex items-center gap-2 font-semibold"
      >
        <MdShoppingCart size={24} />
        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
          {cartItems?.items?.length || 0}
        </span>
      </button>
    </section>
  );
};

export default MenuOrder;
