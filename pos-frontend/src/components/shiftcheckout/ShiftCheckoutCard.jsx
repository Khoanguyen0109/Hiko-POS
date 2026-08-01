import PropTypes from "prop-types";
import { MdAccessTime } from "react-icons/md";
import { formatVND } from "../../utils";
import {
  CheckoutStatusBadge,
  CheckInStatusBadge,
  ShiftMetricsGrid,
  getTotalBill,
} from "./ShiftCheckoutUi";

const ShiftCheckoutCard = ({
  shiftName,
  memberName,
  startTime,
  endTime,
  shiftColor,
  isOwnShift,
  checkInStatus,
  checkoutStatus,
  checkIn,
  checkout,
  expectedPreview,
  onCheckIn,
  onCheckout,
  showCheckInButton,
  checkoutDisabled,
  checkoutLabel,
}) => {
  const accentColor = isOwnShift ? "var(--color-brand, #f97316)" : shiftColor || "#f97316";

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-[#262626] transition-colors hover:border-[#454545] ${
        isOwnShift ? "border-brand/50" : "border-[#343434]"
      }`}
      style={{ boxShadow: `inset 3px 0 0 0 ${accentColor}` }}
    >
      <div className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-[#f5f5f5]">
                {shiftName}
              </h3>
              {isOwnShift ? (
                <span className="rounded-full bg-brand-20 px-2 py-0.5 text-xs font-medium text-brand">
                  Your shift
                </span>
              ) : null}
            </div>
            {memberName ? (
              <p className="mt-0.5 truncate text-sm text-[#ababab]">
                {memberName}
              </p>
            ) : null}
            <p className="mt-1 flex items-center gap-1 text-sm text-[#6a6a6a]">
              <MdAccessTime size={14} className="shrink-0" />
              {startTime} – {endTime}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CheckInStatusBadge status={checkInStatus} />
            <CheckoutStatusBadge status={checkoutStatus} />
          </div>
        </div>

        {checkIn ? (
          <div className="mt-3 rounded-lg border border-emerald-800/40 bg-emerald-900/15 px-3 py-2 text-sm text-emerald-300">
            Opening cash:{" "}
            <span className="font-semibold">{formatVND(checkIn.openingCash)}</span>
          </div>
        ) : null}

        {checkout ? (
          <>
            <ShiftMetricsGrid
              totalBill={getTotalBill(checkout)}
              orderCount={checkout.orderCount}
              expectedCash={checkout.expectedCash}
              expectedBanking={checkout.expectedBanking}
              countedCash={checkout.countedCash}
              countedBanking={checkout.countedBanking}
              showCounted
            />
            {checkIn ? (
              <p className="mt-2 text-xs text-[#6a6a6a]">
                Shift collected:{" "}
                <span className="text-[#ababab]">
                  {formatVND(checkout.countedCash - checkIn.openingCash)}
                </span>
                {" · "}
                Expected drawer:{" "}
                <span className="text-[#ababab]">
                  {formatVND(checkIn.openingCash + checkout.expectedCash)}
                </span>
              </p>
            ) : null}
          </>
        ) : expectedPreview ? (
          <ShiftMetricsGrid
            totalBill={getTotalBill(expectedPreview)}
            orderCount={expectedPreview.orderCount}
            expectedCash={expectedPreview.expectedCash}
            expectedBanking={expectedPreview.expectedBanking}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[#343434] bg-[#1f1f1f] px-4 py-3">
        {showCheckInButton ? (
          <button
            type="button"
            onClick={onCheckIn}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Check in
          </button>
        ) : null}
        <button
          type="button"
          onClick={onCheckout}
          disabled={checkoutDisabled}
          title={checkoutDisabled ? "Check in before checking out" : undefined}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-[#f5f5f5] transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {checkoutLabel}
        </button>
      </div>
    </article>
  );
};

ShiftCheckoutCard.propTypes = {
  shiftName: PropTypes.string.isRequired,
  memberName: PropTypes.string,
  startTime: PropTypes.string,
  endTime: PropTypes.string,
  shiftColor: PropTypes.string,
  isOwnShift: PropTypes.bool,
  checkInStatus: PropTypes.string,
  checkoutStatus: PropTypes.string,
  checkIn: PropTypes.object,
  checkout: PropTypes.object,
  expectedPreview: PropTypes.object,
  onCheckIn: PropTypes.func,
  onCheckout: PropTypes.func,
  showCheckInButton: PropTypes.bool,
  checkoutDisabled: PropTypes.bool,
  checkoutLabel: PropTypes.string.isRequired,
};

export default ShiftCheckoutCard;
