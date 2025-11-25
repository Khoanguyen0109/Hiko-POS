import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { MdShoppingCart, MdArrowBack, MdPrint } from "react-icons/md";
import { FaShoppingCart } from "react-icons/fa";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";

const MobileCart = () => {
  const navigate = useNavigate();
  const billRef = useRef();
  const { loading } = useSelector((state) => state.orders);
  const cartData = useSelector((state) => state.cart);

  useEffect(() => {
    document.title = "POS | Cart";
  }, []);

  const handleBackToMenu = () => {
    navigate(-1); // Go back to previous page (menu)
  };

  const handlePrintReceipt = () => {
    if (billRef.current) {
      billRef.current.handlePrintReceipt();
    }
  };

  const handlePlaceOrder = () => {
    if (billRef.current) {
      billRef.current.handlePlaceOrder();
    }
  };

  return (
    <section className="bg-[#1f1f1f] pb-20 min-h-screen">
      {/* Mobile Cart Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#343434] bg-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackToMenu}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#262626] text-[#f5f5f5] hover:bg-[#343434] transition-colors"
          >
            <MdArrowBack size={18} />
          </button>
          <h1 className="text-[#f5f5f5] text-lg font-bold tracking-wider flex items-center gap-2">
            <MdShoppingCart size={20} />
            Cart
          </h1>
        </div>

        {/* Action Buttons - Visible only on mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={handlePrintReceipt}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#025cca] text-[#f5f5f5] hover:bg-[#0248a3] transition-colors"
            title="Print Receipt"
          >
            <MdPrint size={18} />
          </button>
          <button
            onClick={handlePlaceOrder}
            disabled={cartData.items?.length === 0 || loading}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#f6b100] text-[#1f1f1f] hover:bg-[#e09900] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Place Order"
          >
            <FaShoppingCart size={16} />
          </button>
        </div>
      </div>

      {/* Cart Content */}
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <hr className="border-[#2a2a2a] border-t-2" />

        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <CartInfo />
        </div>

        <hr className="border-[#2a2a2a] border-t-2" />

        {/* Bill Section - Fixed at bottom */}
        <div className="flex-shrink-0 bg-[#1a1a1a]">
          <Bill ref={billRef} />
        </div>
      </div>
    </section>
  );
};

export default MobileCart;
