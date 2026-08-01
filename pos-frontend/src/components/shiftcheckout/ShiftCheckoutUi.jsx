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

const detailRowClass =
  "grid grid-cols-2 gap-x-3 gap-y-1 border-b border-[#343434] py-2.5 last:border-0 sm:grid-cols-4";

const DetailCell = ({ label, value, accent }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wide text-[#6a6a6a]">{label}</p>
    <p className={`mt-0.5 text-sm font-semibold ${accent || "text-[#f5f5f5]"}`}>
      {value}
    </p>
  </div>
);

DetailCell.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  accent: PropTypes.string,
};

/** Full breakdown: opening cash, expected/counted cash & banking, drawer totals */
export const CheckoutFullDetail = ({
  checkout,
  checkIn,
  expectedCash: expectedCashProp,
  expectedBanking: expectedBankingProp,
  totalBill: totalBillProp,
  orderCount: orderCountProp,
}) => {
  const openingCash = checkIn?.openingCash ?? 0;
  const expectedCash = checkout?.expectedCash ?? expectedCashProp ?? 0;
  const expectedBanking = checkout?.expectedBanking ?? expectedBankingProp ?? 0;
  const totalBill = checkout ? getTotalBill(checkout) : totalBillProp ?? 0;
  const orderCount = checkout?.orderCount ?? orderCountProp ?? 0;

  const countedCash = checkout?.countedCash;
  const countedBanking = checkout?.countedBanking;
  const hasCounted = countedCash != null && countedBanking != null;
  const shiftCollected = hasCounted ? countedCash - openingCash : null;
  const expectedDrawer = openingCash + expectedCash;

  const cashDiff = checkout?.cashDifference;
  const bankingDiff = checkout?.bankingDifference;

  return (
    <div className="overflow-hidden rounded-xl border border-[#343434] bg-[#141414]">
      <div className="border-b border-[#343434] bg-[#1a1a1a] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6a6a6a]">
            Shift totals
          </p>
          <p className="text-sm font-bold text-[#f5f5f5]">
            {formatVND(totalBill)}
            {orderCount != null ? (
              <span className="ml-1 text-xs font-normal text-[#6a6a6a]">
                ({orderCount} orders)
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="px-4 py-1">
        {checkIn ? (
          <div className={detailRowClass}>
            <DetailCell
              label="Opening cash"
              value={formatVND(openingCash)}
              accent="text-emerald-400"
            />
            <DetailCell
              label="Expected shift cash"
              value={formatVND(expectedCash)}
              accent="text-brand"
            />
            <DetailCell
              label="Expected in drawer"
              value={formatVND(expectedDrawer)}
              accent="text-brand"
            />
            <DetailCell
              label="Expected banking"
              value={formatVND(expectedBanking)}
              accent="text-[#8B5CF6]"
            />
          </div>
        ) : (
          <div className={detailRowClass}>
            <DetailCell
              label="Expected shift cash"
              value={formatVND(expectedCash)}
              accent="text-brand"
            />
            <DetailCell
              label="Expected banking"
              value={formatVND(expectedBanking)}
              accent="text-[#8B5CF6]"
            />
          </div>
        )}

        {hasCounted ? (
          <div className={`${detailRowClass} bg-[#1a1a1a]/50 -mx-4 px-4`}>
            <DetailCell
              label="Counted in drawer"
              value={formatVND(countedCash)}
            />
            <DetailCell
              label="Shift cash collected"
              value={formatVND(shiftCollected)}
            />
            <DetailCell
              label="Counted banking"
              value={formatVND(countedBanking)}
            />
            <DetailCell
              label="Cash / banking diff"
              value={`${cashDiff === 0 ? "Match" : formatVND(cashDiff)} · ${bankingDiff === 0 ? "Match" : formatVND(bankingDiff)}`}
              accent={
                cashDiff === 0 && bankingDiff === 0
                  ? "text-green-400"
                  : "text-amber-400"
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

CheckoutFullDetail.propTypes = {
  checkout: PropTypes.object,
  checkIn: PropTypes.object,
  expectedCash: PropTypes.number,
  expectedBanking: PropTypes.number,
  totalBill: PropTypes.number,
  orderCount: PropTypes.number,
};
