import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { getTotalPrice, getSubtotal } from "../../redux/slices/cartSlice";
import { formatVND } from "../../utils";

const CheckoutBar = ({ onOpenCart, hidden }) => {
  const cartItems = useSelector((state) => state.cart.items);
  const subtotal = useSelector(getSubtotal);
  const total = useSelector(getTotalPrice);
  const appliedReward = useSelector((state) => state.rewards.appliedReward);

  const getRewardDiscountAmount = () => {
    if (!appliedReward) return 0;
    if (appliedReward.type === "free_dish") {
      const prices = (cartItems || []).map(
        (item) => item.pricePerQuantity || item.price / (item.quantity || 1)
      );
      return prices.length > 0 ? Math.min(...prices) : 0;
    }
    if (appliedReward.type === "percentage_discount") {
      return Math.round(subtotal * (appliedReward.discountPercent || 0) / 100);
    }
    return 0;
  };

  const totalWithReward = Math.max(0, total - getRewardDiscountAmount());
  const itemCount = cartItems?.length || 0;

  if (hidden || itemCount === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-20 z-[45] border-t border-[#343434] bg-[#1a1a1a]/95 px-4 py-3 backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[#ababab]">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
          <p className="text-lg font-bold text-[#f6b100]">
            {formatVND(totalWithReward)}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCart}
          className="min-h-[48px] rounded-lg bg-[#f6b100] px-5 text-sm font-semibold text-[#1f1f1f] transition-colors hover:bg-[#e09900] active:scale-[0.98]"
        >
          View cart
        </button>
      </div>
    </div>
  );
};

CheckoutBar.propTypes = {
  onOpenCart: PropTypes.func.isRequired,
  hidden: PropTypes.bool,
};

CheckoutBar.defaultProps = {
  hidden: false,
};

export default CheckoutBar;
