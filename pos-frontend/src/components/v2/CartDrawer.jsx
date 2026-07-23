import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { MdClose } from "react-icons/md";
import CustomerLookup from "../menu/CustomerLookup";
import RewardSelector from "../menu/RewardSelector";
import CartInfo from "../menu/CartInfo";
import Bill from "../menu/Bill";
import OrderTypePicker from "./OrderTypePicker";
import PaymentButtons from "./PaymentButtons";
import { useV2Ui } from "../../hooks/useV2Ui";
import { useSelector } from "react-redux";

const CartDrawer = ({ isOpen, onClose }) => {
  const billRef = useRef(null);
  const { v2UiEnabled } = useV2Ui();
  const { loading } = useSelector((state) => state.orders);
  const cartItems = useSelector((state) => state.cart.items);
  const cartEmpty = !cartItems?.length;

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

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        className="absolute inset-x-0 bottom-0 flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden rounded-t-2xl border border-[#343434] bg-[#1a1a1a] shadow-2xl"
      >
        <div className="flex shrink-0 flex-col items-center border-b border-[#343434] px-4 pt-3 pb-2">
          <div
            className="mb-3 h-1 w-10 rounded-full bg-[#555]"
            aria-hidden="true"
          />
          <div className="flex w-full items-center justify-between">
            <h2 className="text-base font-semibold text-[#f5f5f5]">Cart</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[#ababab] hover:bg-[#262626] hover:text-[#f5f5f5]"
              aria-label="Close"
            >
              <MdClose size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
          <CustomerLookup />
          <RewardSelector />
          <hr className="border-[#2a2a2a] border-t-2" />
          <CartInfo />
          <hr className="border-[#2a2a2a] border-t-2" />
          <Bill ref={billRef} inDrawer onOrderComplete={onClose} />
        </div>

        <div
          className="shrink-0 border-t border-[#343434] bg-[#1a1a1a] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          {v2UiEnabled ? (
            <>
              <OrderTypePicker />
              <PaymentButtons
                onPay={(method) => billRef.current?.handlePayWithMethod(method)}
                disabled={cartEmpty}
                loading={loading}
              />
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => billRef.current?.handlePrintReceipt()}
                className="min-h-[48px] rounded-lg bg-[#025cca] px-4 py-3 text-base font-semibold text-[#f5f5f5] transition-colors hover:bg-[#0248a3]"
              >
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => billRef.current?.handlePlaceOrder()}
                disabled={cartEmpty || loading}
                className="min-h-[48px] rounded-lg bg-brand px-4 py-3 text-base font-semibold text-[#f5f5f5] transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

CartDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CartDrawer;
