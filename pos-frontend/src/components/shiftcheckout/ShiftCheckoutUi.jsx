import PropTypes from "prop-types";
import {
  MdCheckCircle,
  MdWarning,
  MdLogin,
  MdReceipt,
  MdPayments,
  MdAccountBalance,
} from "react-icons/md";
import { formatVND } from "../../utils";

export const CheckoutStatusBadge = ({ status }) => {
  if (status === "balanced") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-800 bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-400">
        <MdCheckCircle size={14} /> Balanced
      </span>
    );
  }
  if (status === "mismatch") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-800 bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-400">
        <MdWarning size={14} /> Mismatch
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[#343434] bg-[#262626] px-2.5 py-0.5 text-xs font-medium text-[#ababab]">
      Not submitted
    </span>
  );
};

CheckoutStatusBadge.propTypes = {
  status: PropTypes.string,
};

export const CheckInStatusBadge = ({ status }) => {
  if (status === "checked_in") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-800 bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
        <MdLogin size={14} /> Checked in
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[#343434] bg-[#262626] px-2.5 py-0.5 text-xs font-medium text-[#ababab]">
      Not checked in
    </span>
  );
};

CheckInStatusBadge.propTypes = {
  status: PropTypes.string,
};

const metricCardClass =
  "rounded-lg border border-[#343434] bg-[#1a1a1a] p-3 min-w-0";

export const MetricCard = ({ icon: Icon, label, value, sub, accent = "text-[#f5f5f5]" }) => (
  <div className={metricCardClass}>
    <div className="mb-1.5 flex items-center gap-1.5">
      {Icon ? <Icon size={14} className="shrink-0 text-[#6a6a6a]" /> : null}
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-[#6a6a6a]">
        {label}
      </p>
    </div>
    <p className={`truncate text-sm font-semibold sm:text-base ${accent}`}>
      {value}
    </p>
    {sub ? <p className="mt-0.5 truncate text-xs text-[#6a6a6a]">{sub}</p> : null}
  </div>
);

MetricCard.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  sub: PropTypes.string,
  accent: PropTypes.string,
};

export const ShiftMetricsGrid = ({
  totalBill,
  orderCount,
  expectedCash,
  expectedBanking,
  countedCash,
  countedBanking,
  showCounted = false,
  compact = false,
}) => {
  const cols = showCounted ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className={`grid gap-2 ${cols} ${compact ? "" : "mt-3"}`}>
      <MetricCard
        icon={MdReceipt}
        label="Total bill"
        value={formatVND(totalBill)}
        sub={orderCount != null ? `${orderCount} orders` : undefined}
        accent="text-[#f5f5f5]"
      />
      <MetricCard
        icon={MdPayments}
        label="Expected cash"
        value={formatVND(expectedCash)}
        sub={`Banking ${formatVND(expectedBanking)}`}
        accent="text-brand"
      />
      {showCounted ? (
        <MetricCard
          icon={MdAccountBalance}
          label="Counted"
          value={formatVND(countedCash)}
          sub={`Banking ${formatVND(countedBanking)}`}
          accent="text-[#f5f5f5]"
        />
      ) : (
        <MetricCard
          icon={MdAccountBalance}
          label="Expected banking"
          value={formatVND(expectedBanking)}
          accent="text-[#8B5CF6]"
        />
      )}
    </div>
  );
};

ShiftMetricsGrid.propTypes = {
  totalBill: PropTypes.number.isRequired,
  orderCount: PropTypes.number,
  expectedCash: PropTypes.number.isRequired,
  expectedBanking: PropTypes.number.isRequired,
  countedCash: PropTypes.number,
  countedBanking: PropTypes.number,
  showCounted: PropTypes.bool,
  compact: PropTypes.bool,
};

export const DiffPill = ({ label, value }) => {
  const isZero = value === 0;
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-[#141414] px-3 py-2">
      <span className="text-xs text-[#ababab]">{label}</span>
      <span
        className={`text-sm font-semibold ${
          isZero ? "text-green-400" : "text-amber-400"
        }`}
      >
        {isZero ? "Match" : formatVND(value)}
      </span>
    </div>
  );
};

DiffPill.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
};

export const getTotalBill = (checkoutOrPreview) =>
  checkoutOrPreview?.totalBill ??
  (checkoutOrPreview?.expectedCash ?? 0) +
    (checkoutOrPreview?.expectedBanking ?? 0);
