import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdMenu } from "react-icons/md";
import { FiShoppingCart } from "react-icons/fi";
import MenuContainer from "../components/menu/MenuContainer";
import CustomerLookup from "../components/menu/CustomerLookup";
import RewardSelector from "../components/menu/RewardSelector";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import { useSelector } from "react-redux";
import { ROUTES } from "../constants";

const MenuOrder = () => {
  const navigate = useNavigate();
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-[#f5f5f5] p-1"
            >
              <MdMenu size={24} />
            </button>
            <h1 className="text-[#f5f5f5] text-lg sm:text-xl font-bold">
              Matcha POS
            </h1>
          </div>
          <button
            onClick={handleCartClick}
            className="lg:hidden relative text-[#f5f5f5] p-1"
          >
            <FiShoppingCart size={22} />
            {cartItems?.items?.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartItems.items.length}
              </span>
            )}
          </button>
        </div>

        <MenuContainer />
      </div>

      {/* Right Div - Cart Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-[1] bg-[#1a1a1a] mt-4 mr-3 rounded-lg pt-2 flex-col">
        <CustomerLookup />
        <RewardSelector />
        <hr className="border-[#2a2a2a] border-t-2" />
        <CartInfo />
        <hr className="border-[#2a2a2a] border-t-2" />
        <Bill />
      </div>
    </section>
  );
};

export default MenuOrder;
