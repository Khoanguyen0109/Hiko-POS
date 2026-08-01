import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import {
  MdWarning,
  MdCheckCircle,
  MdEdit,
  MdLogin,
} from "react-icons/md";
import BottomSheet from "../shared/BottomSheet";
import {
  fetchShiftCheckoutPreview,
  submitShiftCheckout,
  updateShiftCheckout,
  fetchMyShiftCheckouts,
  clearShiftCheckoutError,
  clearPreview,
} from "../../redux/slices/shiftCheckoutSlice";
import {
  CheckoutFullDetail,
  DiffPill,
  getTotalBill,
} from "./ShiftCheckoutUi";
import { formatVND } from "../../utils";
import FullScreenLoader from "../shared/FullScreenLoader";

const TOLERANCE = 0;

const SectionTitle = ({ children }) => (
  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6a6a6a]">
    {children}
  </h3>
);

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
};

const ShiftCheckoutModal = ({
  isOpen,
  onClose,
  scheduleId,
  memberId,
  refreshDate,
  onSuccess,
  canEditCheckout = false,
}) => {
  const dispatch = useDispatch();
  const { preview, previewLoading, submitLoading, updateLoading, error } =
    useSelector((state) => state.shiftCheckout);

  const [countedCash, setCountedCash] = useState("");
  const [countedBanking, setCountedBanking] = useState("");
  const [openingCashInput, setOpeningCashInput] = useState("");
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
      setOpeningCashInput("");
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
      setOpeningCashInput(
        checkInRecord?.openingCash != null
          ? String(checkInRecord.openingCash)
          : ""
      );
      setNotes(existing.notes || "");
    } else if (!existing) {
      setCountedCash("");
      setCountedBanking("");
      setOpeningCashInput("");
      setNotes("");
    }
  }, [existing, editMode, checkInRecord]);

  const countedCashNum = parseFloat(countedCash) || 0;
  const countedBankingNum = parseFloat(countedBanking) || 0;
  const openingCashNum =
    openingCashInput !== ""
      ? parseFloat(openingCashInput) || 0
      : (checkInRecord?.openingCash ?? 0);
  const shiftCollectedCash = countedCashNum - openingCashNum;

  const expectedCash = existing?.expectedCash ?? expected.expectedCash ?? 0;
  const expectedBanking =
    existing?.expectedBanking ?? expected.expectedBanking ?? 0;
  const orderCount = existing?.orderCount ?? expected.orderCount ?? 0;
  const totalBill = getTotalBill(existing || expected);

  const cashDiff = shiftCollectedCash - expectedCash;
  const bankingDiff = countedBankingNum - expectedBanking;

  const hasMismatch = useMemo(() => {
    if (!countedCash && !countedBanking && countedCash !== 0) return false;
    return (
      Math.abs(cashDiff) > TOLERANCE || Math.abs(bankingDiff) > TOLERANCE
    );
  }, [cashDiff, bankingDiff, countedCash, countedBanking]);

  const refreshLists = async () => {
    onSuccess?.();
    if (refreshDate) {
      await dispatch(fetchMyShiftCheckouts({ date: refreshDate })).unwrap();
    }
  };

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
        const payload = {
          id: existing._id,
          countedCash: countedCashNum,
          countedBanking: countedBankingNum,
          notes: notes.trim(),
        };
        if (
          canEditCheckout &&
          checkInRecord &&
          openingCashInput !== ""
        ) {
          payload.openingCash = openingCashNum;
        }
        result = await dispatch(updateShiftCheckout(payload)).unwrap();
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

      await refreshLists();
      setEditMode(false);
      await dispatch(
        fetchShiftCheckoutPreview({ scheduleId, memberId })
      ).unwrap();
    } catch {
      // error handled via slice
    }
  };

  const shift = expected.schedule?.shiftTemplate;
  const title = (
    <div>
      <h2 className="text-lg font-semibold text-[#f5f5f5]">
        {existing && !editMode ? "Checkout details" : "Shift checkout"}
      </h2>
      {shift ? (
        <p className="text-sm text-[#ababab]">
          {shift.name} · {shift.startTime} – {shift.endTime}
          {expected.member?.name ? (
            <span className="mt-0.5 block text-[#f5f5f5]">
              Staff: {expected.member.name}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );

  const isBusy = previewLoading || submitLoading || updateLoading;

  const renderCheckoutForm = () => (
    <form onSubmit={handleSubmit} className="space-y-5">
      <CheckoutFullDetail
        checkout={existing && editMode ? existing : null}
        checkIn={checkInRecord}
        expectedCash={expectedCash}
        expectedBanking={expectedBanking}
        totalBill={totalBill}
        orderCount={orderCount}
      />

      {editMode && canEditCheckout && checkInRecord ? (
        <div>
          <SectionTitle>Opening cash (admin edit)</SectionTitle>
          <input
            type="number"
            min="0"
            step="1000"
            value={openingCashInput}
            onChange={(e) => setOpeningCashInput(e.target.value)}
            className="w-full rounded-lg border border-[#343434] bg-[#141414] px-3 py-2.5 text-[#f5f5f5] outline-none focus:border-brand"
            required
          />
          <p className="mt-1 text-xs text-[#6a6a6a]">
            Cash in drawer at shift start (check-in)
          </p>
        </div>
      ) : checkInRecord && !editMode ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-800/40 bg-emerald-900/15 px-3 py-2.5 text-sm text-emerald-300">
          <MdLogin size={18} className="shrink-0" />
          <span>
            Opening cash:{" "}
            <strong>{formatVND(checkInRecord.openingCash)}</strong>
          </span>
        </div>
      ) : null}

      <div>
        <SectionTitle>
          {editMode ? "Update counted amounts" : "Your count"}
        </SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-[#ababab]">
              Total cash in drawer
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              className="w-full rounded-lg border border-[#343434] bg-[#141414] px-3 py-2.5 text-[#f5f5f5] outline-none focus:border-brand"
              placeholder="Opening + shift sales"
              required
            />
            {countedCash !== "" ? (
              <p className="mt-1 text-xs text-[#6a6a6a]">
                Shift collected: {formatVND(shiftCollectedCash)}
                {checkInRecord || openingCashInput !== ""
                  ? ` (drawer ${formatVND(countedCashNum)} − opening ${formatVND(openingCashNum)})`
                  : ""}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#ababab]">
              Counted banking
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={countedBanking}
              onChange={(e) => setCountedBanking(e.target.value)}
              className="w-full rounded-lg border border-[#343434] bg-[#141414] px-3 py-2.5 text-[#f5f5f5] outline-none focus:border-brand"
              required
            />
          </div>
        </div>
      </div>

      {countedCash !== "" || countedBanking !== "" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <DiffPill label="Cash diff" value={cashDiff} />
          <DiffPill label="Banking diff" value={bankingDiff} />
        </div>
      ) : null}

      {hasMismatch ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-700/40 bg-amber-900/20 p-3 text-sm text-amber-300">
          <MdWarning size={18} className="mt-0.5 shrink-0" />
          <span>Totals do not match. Add notes before submitting.</span>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm text-[#ababab]">
          Notes{hasMismatch ? " (required)" : ""}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-[#343434] bg-[#141414] px-3 py-2.5 text-[#f5f5f5] outline-none focus:border-brand"
          placeholder="Optional notes for this shift..."
        />
      </div>

      <div className="flex gap-2 pb-1">
        {editMode ? (
          <button
            type="button"
            onClick={() => setEditMode(false)}
            className="flex-1 rounded-lg bg-[#343434] py-3 font-semibold text-[#f5f5f5] transition-colors hover:bg-[#454545]"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isBusy}
          className="flex-1 rounded-lg bg-brand py-3 font-semibold text-[#f5f5f5] transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {editMode ? "Save changes" : "Submit checkout"}
        </button>
      </div>
    </form>
  );

  const renderSubmittedView = () => (
    <div className="space-y-4">
      <div
        className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${
          existing.status === "balanced"
            ? "border-green-800/50 bg-green-900/20 text-green-400"
            : "border-amber-800/50 bg-amber-900/20 text-amber-400"
        }`}
      >
        {existing.status === "balanced" ? (
          <MdCheckCircle size={22} />
        ) : (
          <MdWarning size={22} />
        )}
        <div>
          <p className="font-semibold capitalize">{existing.status}</p>
          <p className="text-xs opacity-80">Checkout submitted</p>
        </div>
      </div>

      <CheckoutFullDetail checkout={existing} checkIn={checkInRecord} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <DiffPill label="Cash difference" value={existing.cashDifference} />
        <DiffPill
          label="Banking difference"
          value={existing.bankingDifference}
        />
      </div>

      {existing.notes ? (
        <div className="rounded-lg border border-[#343434] bg-[#141414] p-3">
          <SectionTitle>Notes</SectionTitle>
          <p className="text-sm text-[#f5f5f5]">{existing.notes}</p>
        </div>
      ) : null}

      <div className="flex gap-2">
        {canEditCheckout ? (
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#343434] bg-[#262626] py-3 font-semibold text-[#f5f5f5] transition-colors hover:bg-[#343434]"
          >
            <MdEdit size={18} />
            Edit checkout
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg bg-brand py-3 font-semibold text-[#f5f5f5] transition-colors hover:bg-brand-hover"
        >
          Done
        </button>
      </div>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      bodyClassName="p-4 sm:p-6"
    >
      {isBusy ? <FullScreenLoader /> : null}

      {existing && !editMode
        ? renderSubmittedView()
        : !canManage && !editMode
          ? (
            <div className="space-y-4">
              <CheckoutFullDetail
                checkIn={checkInRecord}
                expectedCash={expectedCash}
                expectedBanking={expectedBanking}
                totalBill={totalBill}
                orderCount={orderCount}
              />
              <p className="py-4 text-center text-sm text-[#ababab]">
                Checkout not submitted yet.
              </p>
            </div>
          )
          : renderCheckoutForm()}
    </BottomSheet>
  );
};

ShiftCheckoutModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  scheduleId: PropTypes.string,
  memberId: PropTypes.string,
  refreshDate: PropTypes.string,
  onSuccess: PropTypes.func,
  canEditCheckout: PropTypes.bool,
};

export default ShiftCheckoutModal;
