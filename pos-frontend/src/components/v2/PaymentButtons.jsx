import PropTypes from "prop-types";
import { MdPayments, MdAccountBalance, MdMoneyOff } from "react-icons/md";

const PaymentButtons = ({ onPay, onNotPay, disabled, loading }) => {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onPay("Cash")}
          disabled={disabled || loading}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-[#f5f5f5] transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
        >
          <MdPayments size={20} />
          {loading ? "Processing..." : "Cash"}
        </button>
        <button
          type="button"
          onClick={() => onPay("Banking")}
          disabled={disabled || loading}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#025cca] px-4 text-sm font-semibold text-[#f5f5f5] transition-colors hover:bg-[#0248a3] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
        >
          <MdAccountBalance size={20} />
          {loading ? "Processing..." : "Banking"}
        </button>
      </div>
      <button
        type="button"
        onClick={onNotPay}
        disabled={disabled || loading}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#262626] px-4 text-sm font-semibold text-[#f5f5f5] transition-colors hover:bg-[#343434] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
      >
        <MdMoneyOff size={20} />
        {loading ? "Processing..." : "Not Pay"}
      </button>
    </div>
  );
};

PaymentButtons.propTypes = {
  onPay: PropTypes.func.isRequired,
  onNotPay: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
};

PaymentButtons.defaultProps = {
  disabled: false,
  loading: false,
};

export default PaymentButtons;
