import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import { MdWarning, MdCheckCircle, MdEdit } from "react-icons/md";
import BottomSheet from "../shared/BottomSheet";
import {
  fetchShiftCheckoutPreview,
  submitShiftCheckout,
  updateShiftCheckout,
  fetchMyShiftCheckouts,
  clearShiftCheckoutError,
  clearPreview,
} from "../../redux/slices/shiftCheckoutSlice";
import { formatVND } from "../../utils";
import FullScreenLoader from "../shared/FullScreenLoader";

const TOLERANCE = 0;

const CheckoutSummary = ({ checkout, checkIn, expected }) => {
  const openingCash = checkIn?.openingCash ?? 0;
  const expectedCash = checkout?.expectedCash ?? expected?.expectedCash ?? 0;
  const expectedBanking =
    checkout?.expectedBanking ?? expected?.expectedBanking ?? 0;
  const totalBill =
    checkout?.totalBill ??
    expected?.totalBill ??
    expectedCash + expectedBanking;
  const orderCount = checkout?.orderCount ?? expected?.orderCount ?? 0;
  const expectedTotalCash = expectedCash + openingCash;

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-[#1f1f1f] rounded-lg">
      <div className="col-span-2">
        <p className="text-xs text-[#ababab] uppercase mb-1">Total bill (shift)</p>
        <p className="text-[#f5f5f5] font-semibold text-lg">
          {formatVND(totalBill)}
        </p>
        <p className="text-xs text-[#ababab] mt-1">
          {orderCount} completed orders
        </p>
      </div>
      <div>
        <p className="text-xs text-[#ababab] uppercase mb-1">Expected shift cash</p>
        <p className="text-brand font-semibold">{formatVND(expectedCash)}</p>
      </div>
      <div>
        <p className="text-xs text-[#ababab] uppercase mb-1">Expected banking</p>
        <p className="text-[#8B5CF6] font-semibold">
          {formatVND(expectedBanking)}
        </p>
      </div>
      {checkIn && (
        <div className="col-span-2">
          <p className="text-xs text-[#ababab] uppercase mb-1">
            Expected total cash in drawer
          </p>
          <p className="text-brand font-semibold">
            {formatVND(expectedTotalCash)}
          </p>
        </div>
      )}
    </div>
  );
};

CheckoutSummary.propTypes = {
  checkout: PropTypes.object,
  checkIn: PropTypes.object,
  expected: PropTypes.object,
};

const ShiftCheckoutModal = ({
  isOpen,
  onClose,
  scheduleId,
  memberId,
  refreshDate,
  onSuccess,
  isAdmin = false,
}) => {
  const dispatch = useDispatch();
  const { preview, previewLoading, submitLoading, updateLoading, error } =
    useSelector((state) => state.shiftCheckout);

  const [countedCash, setCountedCash] = useState("");
  const [countedBanking, setCountedBanking] = useState("");
  const [notes, setNotes] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (isOpen && scheduleId) {
      dispatch(fetchShiftCheckoutPreview({ scheduleId, memberId }));
      setEditMode(false);
    }
    if (!isOpen) {
      dispatch(clearPreview());
      setCountedCash("");
      setCountedBanking("");
      setNotes("");
      setEditMode(false);
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
  const canManage = Boolean(preview?.canManage);

  useEffect(() => {
    if (existing && editMode) {
      setCountedCash(String(existing.countedCash ?? ""));
      setCountedBanking(String(existing.countedBanking ?? ""));
      setNotes(existing.notes || "");
    } else if (!existing) {
      setCountedCash("");
      setCountedBanking("");
      setNotes("");
    }
  }, [existing, editMode]);

  const countedCashNum = parseFloat(countedCash) || 0;
  const countedBankingNum = parseFloat(countedBanking) || 0;
  const openingCash = checkInRecord?.openingCash ?? 0;
  const shiftCollectedCash = countedCashNum - openingCash;

  const expectedCash = existing?.expectedCash ?? expected.expectedCash ?? 0;
  const expectedBanking =
    existing?.expectedBanking ?? expected.expectedBanking ?? 0;
  const expectedTotalCash = expectedCash + openingCash;

  const cashDiff = shiftCollectedCash - expectedCash;
  const bankingDiff = countedBankingNum - expectedBanking;

  const hasMismatch = useMemo(() => {
    if (!countedCash && !countedBanking && countedCash !== 0) return false;
    return (
      Math.abs(cashDiff) > TOLERANCE || Math.abs(bankingDiff) > TOLERANCE
    );
  }, [cashDiff, bankingDiff, countedCash, countedBanking]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (existing && !editMode) {
      return;
    }

    if (hasMismatch && notes.trim().length < 3) {
      enqueueSnackbar(
        "Please add notes explaining the difference (min 3 characters)",
        { variant: "warning" }
      );
      return;
    }

    try {
      let result;
      if (existing && editMode) {
        result = await dispatch(
          updateShiftCheckout({
            id: existing._id,
            countedCash: countedCashNum,
            countedBanking: countedBankingNum,
            notes: notes.trim(),
          })
        ).unwrap();
      } else {
        result = await dispatch(
          submitShiftCheckout({
            scheduleId,
            memberId: memberId || undefined,
            countedCash: countedCashNum,
            countedBanking: countedBankingNum,
            notes: notes.trim(),
          })
        ).unwrap();
      }

      const status = result.data?.status;
      enqueueSnackbar(result.message || "Checkout saved", {
        variant: status === "balanced" ? "success" : "warning",
      });

      if (refreshDate) {
        await dispatch(fetchMyShiftCheckouts({ date: refreshDate })).unwrap();
      }
      onSuccess?.();
      onClose();
    } catch {
      // error handled via slice
    }
  };

  const shift = expected.schedule?.shiftTemplate;
  const title = (
    <div>
      <h2 className="text-lg font-semibold text-[#f5f5f5]">Shift checkout</h2>
      {shift && (
        <p className="text-sm text-[#ababab]">
          {shift.name} · {shift.startTime} – {shift.endTime}
          {expected.member?.name && (
            <span className="mt-0.5 block text-[#f5f5f5]">
              Staff: {expected.member.name}
            </span>
          )}
        </p>
      )}
    </div>
  );

  const isBusy = previewLoading || submitLoading || updateLoading;

  const renderCheckoutForm = () => (
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

      <CheckoutSummary
        checkout={existing}
        checkIn={checkInRecord}
        expected={expected}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[#ababab] mb-1">
            Total cash in drawer
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={countedCash}
            onChange={(e) => setCountedCash(e.target.value)}
            className="w-full bg-[#1f1f1f] border border-[#383838] rounded-lg px-3 py-2 text-[#f5f5f5]"
            placeholder="Check-in cash + shift sales"
            required
          />
          {countedCash !== "" && checkInRecord && (
            <p className="text-xs text-[#ababab] mt-1">
              Shift cash collected: {formatVND(shiftCollectedCash)}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm text-[#ababab] mb-1">
            Counted banking
          </label>
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
          <p
            className={cashDiff !== 0 ? "text-amber-400" : "text-[#ababab]"}
          >
            Cash difference: {formatVND(cashDiff)}
          </p>
          <p
            className={bankingDiff !== 0 ? "text-amber-400" : "text-[#ababab]"}
          >
            Banking difference: {formatVND(bankingDiff)}
          </p>
        </div>
      )}

      {hasMismatch && (
        <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-700/40 rounded-lg text-amber-300 text-sm">
          <MdWarning size={18} className="shrink-0 mt-0.5" />
          <span>
            Totals do not match the system. Add notes before submitting.
          </span>
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

      <div className="flex gap-2">
        {editMode && (
          <button
            type="button"
            onClick={() => setEditMode(false)}
            className="flex-1 py-3 bg-[#383838] text-[#f5f5f5] font-semibold rounded-lg hover:bg-[#454545]"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isBusy}
          className="flex-1 py-3 bg-brand text-[#f5f5f5] font-semibold rounded-lg hover:bg-brand-hover disabled:opacity-50"
        >
          {editMode ? "Save changes" : "Submit checkout"}
        </button>
      </div>
    </form>
  );

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="md"
        bodyClassName="p-4 sm:p-6"
      >
        {isBusy && <FullScreenLoader />}

        {existing && !editMode ? (
          <div className="p-6 space-y-4">
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

            <CheckoutSummary
              checkout={existing}
              checkIn={checkInRecord}
              expected={expected}
            />

            <div className="grid grid-cols-2 gap-4 p-4 bg-[#262626] rounded-lg border border-[#383838]">
              <div>
                <p className="text-xs text-[#ababab] uppercase mb-1">
                  Counted cash
                </p>
                <p className="text-[#f5f5f5] font-semibold">
                  {formatVND(existing.countedCash)}
                </p>
                {checkInRecord && (
                  <p className="text-xs text-[#ababab] mt-1">
                    Shift collected:{" "}
                    {formatVND(existing.countedCash - openingCash)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-[#ababab] uppercase mb-1">
                  Counted banking
                </p>
                <p className="text-[#f5f5f5] font-semibold">
                  {formatVND(existing.countedBanking)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#ababab] uppercase mb-1">
                  Cash difference
                </p>
                <p
                  className={
                    existing.cashDifference !== 0
                      ? "text-amber-400 font-semibold"
                      : "text-[#ababab]"
                  }
                >
                  {formatVND(existing.cashDifference)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#ababab] uppercase mb-1">
                  Banking difference
                </p>
                <p
                  className={
                    existing.bankingDifference !== 0
                      ? "text-amber-400 font-semibold"
                      : "text-[#ababab]"
                  }
                >
                  {formatVND(existing.bankingDifference)}
                </p>
              </div>
            </div>

            {existing.notes && (
              <div className="p-3 bg-[#1f1f1f] rounded-lg">
                <p className="text-xs text-[#ababab] uppercase mb-1">Notes</p>
                <p className="text-sm text-[#f5f5f5]">{existing.notes}</p>
              </div>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#383838] text-[#f5f5f5] font-semibold rounded-lg hover:bg-[#454545]"
              >
                <MdEdit size={18} />
                Edit checkout
              </button>
            )}
          </div>
        ) : !canManage && !editMode ? (
          <div className="p-6 space-y-4">
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
            <CheckoutSummary checkIn={checkInRecord} expected={expected} />
            <p className="text-sm text-[#ababab] text-center">
              Checkout not submitted yet.
            </p>
          </div>
        ) : (
          renderCheckoutForm()
        )}
      </BottomSheet>
    </>
  );
};

ShiftCheckoutModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  scheduleId: PropTypes.string,
  memberId: PropTypes.string,
  refreshDate: PropTypes.string,
  onSuccess: PropTypes.func,
  isAdmin: PropTypes.bool,
};

export default ShiftCheckoutModal;
