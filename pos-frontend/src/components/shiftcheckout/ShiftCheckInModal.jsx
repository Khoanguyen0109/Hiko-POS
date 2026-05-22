import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import { MdClose, MdLogin } from "react-icons/md";
import {
  submitShiftCheckIn,
  fetchMyShiftCheckouts,
  clearShiftCheckoutError,
} from "../../redux/slices/shiftCheckoutSlice";
import { formatVND } from "../../utils";
import FullScreenLoader from "../shared/FullScreenLoader";

const ShiftCheckInModal = ({
  isOpen,
  onClose,
  scheduleId,
  memberId,
  memberName,
  shiftName,
  refreshDate,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const { checkInLoading, error } = useSelector((state) => state.shiftCheckout);

  const [openingCash, setOpeningCash] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setOpeningCash("");
      setNotes("");
    }
  }, [isOpen, scheduleId]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearShiftCheckoutError());
    }
  }, [error, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(openingCash);
    if (Number.isNaN(amount) || amount < 0) {
      enqueueSnackbar("Enter a valid opening cash amount", { variant: "warning" });
      return;
    }

    try {
      await dispatch(
        submitShiftCheckIn({
          scheduleId,
          memberId: memberId || undefined,
          openingCash: amount,
          notes: notes.trim(),
        })
      ).unwrap();

      enqueueSnackbar("Checked in — opening cash recorded", {
        variant: "success",
      });
      if (refreshDate) {
        dispatch(fetchMyShiftCheckouts({ date: refreshDate }));
      }
      onSuccess?.();
      onClose();
    } catch {
      // handled via slice
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#262626] rounded-xl w-full max-w-md border border-[#383838]">
        <div className="flex items-center justify-between p-4 border-b border-[#383838]">
          <div className="flex items-center gap-2">
            <MdLogin className="text-[#10B981]" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-[#f5f5f5]">Check in</h2>
              {shiftName && (
                <p className="text-sm text-[#ababab]">
                  {shiftName}
                  {memberName && ` · ${memberName}`}
                </p>
              )}
            </div>
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

        {checkInLoading && <FullScreenLoader />}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-[#ababab]">
            Count the cash in the drawer before your shift starts and enter the
            total below.
          </p>

          <div>
            <label className="block text-sm text-[#ababab] mb-1">
              Opening cash (VND)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              className="w-full bg-[#1f1f1f] border border-[#383838] rounded-lg px-3 py-2 text-[#f5f5f5] text-lg"
              required
              autoFocus
            />
            {openingCash !== "" && !Number.isNaN(parseFloat(openingCash)) && (
              <p className="text-xs text-[#ababab] mt-1">
                {formatVND(parseFloat(openingCash) || 0)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-[#ababab] mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-[#1f1f1f] border border-[#383838] rounded-lg px-3 py-2 text-[#f5f5f5] resize-none"
              placeholder="e.g. float from previous shift"
            />
          </div>

          <button
            type="submit"
            disabled={checkInLoading}
            className="w-full py-3 bg-[#10B981] text-white font-semibold rounded-lg hover:bg-[#059669] disabled:opacity-50"
          >
            Confirm check-in
          </button>
        </form>
      </div>
    </div>
  );
};

ShiftCheckInModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  scheduleId: PropTypes.string,
  memberId: PropTypes.string,
  memberName: PropTypes.string,
  shiftName: PropTypes.string,
  refreshDate: PropTypes.string,
  onSuccess: PropTypes.func,
};

export default ShiftCheckInModal;
