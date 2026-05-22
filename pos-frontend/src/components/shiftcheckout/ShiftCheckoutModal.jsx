import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import { MdClose, MdWarning, MdCheckCircle } from "react-icons/md";
import {
  fetchShiftCheckoutPreview,
  submitShiftCheckout,
  fetchMyShiftCheckouts,
  clearShiftCheckoutError,
  clearPreview,
} from "../../redux/slices/shiftCheckoutSlice";
import { formatVND } from "../../utils";
import { getTodayDate } from "../../utils";
import FullScreenLoader from "../shared/FullScreenLoader";

const TOLERANCE = 0;

const ShiftCheckoutModal = ({
  isOpen,
  onClose,
  scheduleId,
  memberId,
  refreshDate,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const { preview, previewLoading, submitLoading, error } = useSelector(
    (state) => state.shiftCheckout
  );

  const [countedCash, setCountedCash] = useState("");
  const [countedBanking, setCountedBanking] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen && scheduleId) {
      dispatch(fetchShiftCheckoutPreview({ scheduleId, memberId }));
      setCountedCash("");
      setCountedBanking("");
      setNotes("");
    }
    if (!isOpen) {
      dispatch(clearPreview());
    }
  }, [isOpen, scheduleId, memberId, dispatch]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearShiftCheckoutError());
    }
  }, [error, dispatch]);

  const expected = preview || {};
  const existing = expected.existingCheckout;
  const checkInRecord = expected.checkIn;

  const countedCashNum = parseFloat(countedCash) || 0;
  const countedBankingNum = parseFloat(countedBanking) || 0;

  const cashDiff = countedCashNum - (expected.expectedCash || 0);
  const bankingDiff = countedBankingNum - (expected.expectedBanking || 0);

  const hasMismatch = useMemo(() => {
    if (!countedCash && !countedBanking && countedCash !== 0) return false;
    return (
      Math.abs(cashDiff) > TOLERANCE || Math.abs(bankingDiff) > TOLERANCE
    );
  }, [cashDiff, bankingDiff, countedCash, countedBanking]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (existing) {
      enqueueSnackbar("Checkout already submitted for this shift", {
        variant: "info",
      });
      return;
    }

    if (hasMismatch && notes.trim().length < 3) {
      enqueueSnackbar("Please add notes explaining the difference (min 3 characters)", {
        variant: "warning",
      });
      return;
    }

    try {
      const result = await dispatch(
        submitShiftCheckout({
          scheduleId,
          memberId: memberId || undefined,
          countedCash: countedCashNum,
          countedBanking: countedBankingNum,
          notes: notes.trim(),
        })
      ).unwrap();

      const status = result.data?.status;
      enqueueSnackbar(result.message || "Checkout submitted", {
        variant: status === "balanced" ? "success" : "warning",
      });

      dispatch(
        fetchMyShiftCheckouts({ date: refreshDate || getTodayDate() })
      );
      onSuccess?.();
      onClose();
    } catch {
      // error handled via slice
    }
  };

  if (!isOpen) return null;

  const shift = expected.schedule?.shiftTemplate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#262626] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#383838]">
        <div className="flex items-center justify-between p-4 border-b border-[#383838]">
          <div>
            <h2 className="text-lg font-semibold text-[#f5f5f5]">Shift checkout</h2>
            {shift && (
              <p className="text-sm text-[#ababab]">
                {shift.name} · {shift.startTime} – {shift.endTime}
                {expected.member?.name && (
                  <span className="block text-[#f5f5f5] mt-0.5">
                    Staff: {expected.member.name}
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#ababab] hover:text-white p-1"
            aria-label="Close"
          >
            <MdClose size={22} />
          </button>
        </div>

        {(previewLoading || submitLoading) && <FullScreenLoader />}

        {existing ? (
          <div className="p-6 space-y-3">
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                existing.status === "balanced"
                  ? "bg-green-900/30 text-green-400"
                  : "bg-amber-900/30 text-amber-400"
              }`}
            >
              {existing.status === "balanced" ? (
                <MdCheckCircle size={20} />
              ) : (
                <MdWarning size={20} />
              )}
              <span className="font-medium capitalize">{existing.status}</span>
            </div>
            <p className="text-sm text-[#ababab]">
              Submitted {formatVND(existing.countedCash)} cash ·{" "}
              {formatVND(existing.countedBanking)} banking
            </p>
            {existing.notes && (
              <p className="text-sm text-[#f5f5f5]">Notes: {existing.notes}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {checkInRecord && (
              <div className="p-3 bg-emerald-900/20 border border-emerald-700/40 rounded-lg text-sm">
                <p className="text-emerald-300">
                  Opening cash at check-in:{" "}
                  <span className="font-semibold">
                    {formatVND(checkInRecord.openingCash)}
                  </span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 p-4 bg-[#1f1f1f] rounded-lg">
              <div>
                <p className="text-xs text-[#ababab] uppercase mb-1">Expected cash</p>
                <p className="text-[#f6b100] font-semibold">
                  {formatVND(expected.expectedCash || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#ababab] uppercase mb-1">Expected banking</p>
                <p className="text-[#8B5CF6] font-semibold">
                  {formatVND(expected.expectedBanking || 0)}
                </p>
              </div>
              <p className="col-span-2 text-xs text-[#ababab]">
                {expected.orderCount ?? 0} completed orders in this shift window
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#ababab] mb-1">Counted cash</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="w-full bg-[#1f1f1f] border border-[#383838] rounded-lg px-3 py-2 text-[#f5f5f5]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#ababab] mb-1">Counted banking</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={countedBanking}
                  onChange={(e) => setCountedBanking(e.target.value)}
                  className="w-full bg-[#1f1f1f] border border-[#383838] rounded-lg px-3 py-2 text-[#f5f5f5]"
                  required
                />
              </div>
            </div>

            {(countedCash !== "" || countedBanking !== "") && (
              <div className="text-sm space-y-1">
                <p className={cashDiff !== 0 ? "text-amber-400" : "text-[#ababab]"}>
                  Cash difference: {formatVND(cashDiff)}
                </p>
                <p className={bankingDiff !== 0 ? "text-amber-400" : "text-[#ababab]"}>
                  Banking difference: {formatVND(bankingDiff)}
                </p>
              </div>
            )}

            {hasMismatch && (
              <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-700/40 rounded-lg text-amber-300 text-sm">
                <MdWarning size={18} className="shrink-0 mt-0.5" />
                <span>Totals do not match the system. Add notes before submitting.</span>
              </div>
            )}

            <div>
              <label className="block text-sm text-[#ababab] mb-1">
                Notes{hasMismatch ? " (required)" : ""}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-[#1f1f1f] border border-[#383838] rounded-lg px-3 py-2 text-[#f5f5f5] resize-none"
                placeholder="Optional notes for this shift..."
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading || previewLoading}
              className="w-full py-3 bg-[#f6b100] text-[#1f1f1f] font-semibold rounded-lg hover:bg-[#e5a600] disabled:opacity-50"
            >
              Submit checkout
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

ShiftCheckoutModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  scheduleId: PropTypes.string,
  memberId: PropTypes.string,
  refreshDate: PropTypes.string,
  onSuccess: PropTypes.func,
};

export default ShiftCheckoutModal;
