import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdShoppingCart, MdArrowBack } from "react-icons/md";
import CustomerInfo from "../components/menu/CustomerInfo";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import { useSelector } from "react-redux";

const MobileCart = () => {
  const navigate = useNavigate();
  const customerData = useSelector((state) => state.customer);
  
  const cartItems = useSelector((state) => state.cart);

  useEffect(() => {
    document.title = "POS | Cart";
  }, []);

  const handleBackToMenu = () => {
    navigate(-1); // Go back to previous page (menu)
  };

  return (
    <section className="bg-[#1f1f1f] pb-20 min-h-screen">
      {/* Mobile Cart Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#343434] bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToMenu}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#262626] text-[#f5f5f5] hover:bg-[#343434] transition-colors"
          >
            <MdArrowBack size={20} />
          </button>
          <div>
            <h1 className="text-[#f5f5f5] text-xl font-bold tracking-wider flex items-center gap-2">
              <MdShoppingCart size={24} />
              Cart
            </h1>
            <p className="text-[#ababab] text-sm">
              {cartItems?.items?.length || 0} items • {customerData.customerName || "Customer"}
            </p>
          </div>
        </div>
        
        {/* Table Info */}
        <div className="text-right">
          <p className="text-[#f5f5f5] text-sm font-medium">
            Table {customerData.table?.tableNo || "N/A"}
          </p>
          <p className="text-[#ababab] text-xs">
            {customerData.table?.seats || 0} seats
          </p>
        </div>
      </div>

      {/* Cart Content */}
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Customer Info */}
        <div className="flex-shrink-0">
          <CustomerInfo />
        </div>
        
        <hr className="border-[#2a2a2a] border-t-2" />
        
        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <CartInfo />
        </div>
        
        <hr className="border-[#2a2a2a] border-t-2" />
        
        {/* Bill Section - Fixed at bottom */}
        <div className="flex-shrink-0 bg-[#1a1a1a]">
          <Bill />
        </div>
      </div>
    </section>
  );
};

export default MobileCart;
