import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import {
  MdAccountBalanceWallet,
  MdCalendarToday,
  MdCheckCircle,
  MdWarning,
  MdAccessTime,
  MdDelete,
  MdLogin,
} from "react-icons/md";
import BackButton from "../components/shared/BackButton";
import ShiftCheckoutModal from "../components/shiftcheckout/ShiftCheckoutModal";
import ShiftCheckInModal from "../components/shiftcheckout/ShiftCheckInModal";
import FullScreenLoader from "../components/shared/FullScreenLoader";
import {
  fetchMyShiftCheckouts,
  fetchDayShiftCheckouts,
  deleteShiftCheckout,
  clearShiftCheckoutError,
} from "../redux/slices/shiftCheckoutSlice";
import { formatVND, getTodayDate } from "../utils";

const TABS = {
  MY_SHIFT: "my_shift",
  DAY: "day",
};

const shiftStartMinutes = (startTime) => {
  if (!startTime || typeof startTime !== "string") return 0;
  const [hours, minutes] = startTime.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const sortByShiftStartTimeAsc = (rows, getTemplate) =>
  [...rows].sort((a, b) => {
    const ta = shiftStartMinutes(getTemplate(a)?.startTime);
    const tb = shiftStartMinutes(getTemplate(b)?.startTime);
    if (ta !== tb) return ta - tb;
    const nameA = a.member?.name || "";
    const nameB = b.member?.name || "";
    return nameA.localeCompare(nameB);
  });

const statusBadge = (status) => {
  if (status === "balanced") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-900/40 text-green-400">
        <MdCheckCircle size={14} /> Balanced
      </span>
    );
  }
  if (status === "mismatch") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-400">
        <MdWarning size={14} /> Mismatch
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded bg-[#383838] text-[#ababab]">
      Not submitted
    </span>
  );
};

const ShiftCheckout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { role, _id: userId } = useSelector((state) => state.user);
  const activeStore = useSelector((state) => state.store.activeStore);
  const storeRole = activeStore?.role || activeStore?.storeRole || "";
  const isAdmin = role === "Admin";
  const canViewDay =
    isAdmin || storeRole === "Owner" || storeRole === "Manager";

  const {
    myShifts,
    loading,
    dayCheckouts,
    dayLoading,
    error,
    deleteLoading,
    checkInLoading,
  } = useSelector((state) => state.shiftCheckout);

  const [activeTab, setActiveTab] = useState(TABS.MY_SHIFT);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [dayDate, setDayDate] = useState(getTodayDate());
  const [modalOpen, setModalOpen] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [selectedMemberName, setSelectedMemberName] = useState("");
  const [selectedShiftName, setSelectedShiftName] = useState("");

  useEffect(() => {
    document.title = "POS | Shift Checkout";
  }, []);

  useEffect(() => {
    const scheduleId = location.state?.scheduleId;
    if (scheduleId) {
      setSelectedScheduleId(scheduleId);
      setSelectedMemberId(location.state?.memberId || null);
      setModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (activeTab === TABS.MY_SHIFT) {
      dispatch(fetchMyShiftCheckouts({ date: selectedDate }));
    }
  }, [dispatch, activeTab, selectedDate]);

  useEffect(() => {
    if (activeTab === TABS.DAY && canViewDay) {
      dispatch(fetchDayShiftCheckouts(dayDate));
    }
  }, [dispatch, activeTab, dayDate, canViewDay]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearShiftCheckoutError());
    }
  }, [error, dispatch]);

  const openCheckIn = (row) => {
    const tpl = row.schedule?.shiftTemplate;
    setSelectedScheduleId(row.schedule._id);
    setSelectedMemberId(row.member?._id || null);
    setSelectedMemberName(row.member?.name || "");
    setSelectedShiftName(tpl?.name || tpl?.shortName || "Shift");
    setCheckInModalOpen(true);
  };

  const openCheckout = (scheduleId, memberId = null) => {
    setSelectedScheduleId(scheduleId);
    setSelectedMemberId(memberId);
    setModalOpen(true);
  };

  const checkInBadge = (status) => {
    if (status === "checked_in") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400">
          <MdLogin size={14} /> Checked in
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-[#383838] text-[#ababab]">
        Not checked in
      </span>
    );
  };

  const sortedMyShifts = useMemo(
    () =>
      sortByShiftStartTimeAsc(
        myShifts,
        (row) => row.schedule?.shiftTemplate
      ),
    [myShifts]
  );

  const sortedDayCheckouts = useMemo(
    () =>
      sortByShiftStartTimeAsc(
        dayCheckouts,
        (c) => c.shiftTemplate
      ),
    [dayCheckouts]
  );

  const handleDeleteCheckout = async (checkout) => {
    const memberName = checkout.member?.name || "this member";
    if (
      !window.confirm(
        `Delete checkout for ${memberName}? They can submit again after deletion.`
      )
    ) {
      return;
    }
    try {
      await dispatch(deleteShiftCheckout(checkout._id)).unwrap();
      enqueueSnackbar("Shift checkout deleted", { variant: "success" });
      dispatch(fetchDayShiftCheckouts(dayDate));
    } catch {
      // error handled via slice
    }
  };

  return (
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-80px)] pb-24 px-4 md:px-8 overflow-x-hidden">
      <div className="flex items-center gap-3 py-4 sm:py-6">
        <BackButton />
        <div className="flex items-center gap-2 min-w-0">
          <MdAccountBalanceWallet className="text-[#f6b100] shrink-0" size={24} />
          <h1 className="text-xl sm:text-2xl font-bold text-[#f5f5f5] truncate">Shift checkout</h1>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-[#383838]">
        <button
          type="button"
          onClick={() => setActiveTab(TABS.MY_SHIFT)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === TABS.MY_SHIFT
              ? "border-[#f6b100] text-[#f6b100]"
              : "border-transparent text-[#ababab]"
          }`}
        >
          All shifts
        </button>
        {canViewDay && (
          <button
            type="button"
            onClick={() => setActiveTab(TABS.DAY)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === TABS.DAY
                ? "border-[#f6b100] text-[#f6b100]"
                : "border-transparent text-[#ababab]"
            }`}
          >
            Day
          </button>
        )}
      </div>

      {activeTab === TABS.MY_SHIFT && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <MdCalendarToday className="text-[#ababab]" size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#262626] border border-[#383838] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm"
            />
          </div>

          {(loading || checkInLoading) && <FullScreenLoader />}

          {!loading && sortedMyShifts.length === 0 && (
            <p className="text-[#ababab] py-8 text-center">
              No shifts scheduled for this date.
            </p>
          )}

          {sortedMyShifts.map((row) => {
            const tpl = row.schedule?.shiftTemplate;
            const checkout = row.checkout;
            const checkIn = row.checkIn;
            const preview = row.expectedPreview;
            const memberId = row.member?._id;
            const isOwnShift =
              row.isOwnShift ?? String(memberId) === String(userId);
            const isCheckedIn = row.checkInStatus === "checked_in";
            const rowKey = memberId
              ? `${row.schedule._id}-${memberId}`
              : row.schedule._id;

            return (
              <div
                key={rowKey}
                className={`bg-[#262626] border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  isOwnShift ? "border-[#f6b100]/40" : "border-[#383838]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#f5f5f5]">
                      {tpl?.name || tpl?.shortName || "Shift"}
                      {row.member?.name && (
                        <span className="text-[#ababab] font-normal text-sm ml-2">
                          — {row.member.name}
                        </span>
                      )}
                    </p>
                    {isOwnShift && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[#f6b100]/20 text-[#f6b100]">
                        Your shift
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#ababab] flex items-center gap-1 mt-1">
                    <MdAccessTime size={14} />
                    {tpl?.startTime} – {tpl?.endTime}
                  </p>
                  {!checkout && preview && (
                    <p className="text-xs text-[#ababab] mt-2">
                      Expected: {formatVND(preview.expectedCash)} cash ·{" "}
                      {formatVND(preview.expectedBanking)} banking (
                      {preview.orderCount} orders)
                    </p>
                  )}
                  {checkIn && (
                    <p className="text-xs text-emerald-400/90 mt-2">
                      Opening cash: {formatVND(checkIn.openingCash)}
                    </p>
                  )}
                  {checkout && (
                    <p className="text-xs text-[#ababab] mt-2">
                      Total cash: {formatVND(checkout.countedCash)} ·{" "}
                      {formatVND(checkout.countedBanking)} banking
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {checkInBadge(row.checkInStatus)}
                    {statusBadge(row.checkoutStatus)}
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwnShift && !isCheckedIn && (
                      <button
                        type="button"
                        onClick={() => openCheckIn(row)}
                        className="px-4 py-2 text-sm font-medium bg-[#10B981] text-white rounded-lg hover:bg-[#059669]"
                      >
                        Check in
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openCheckout(row.schedule._id, memberId)}
                      disabled={isOwnShift && !isCheckedIn && !checkout}
                      title={
                        isOwnShift && !isCheckedIn && !checkout
                          ? "Check in before checking out"
                          : undefined
                      }
                      className="px-4 py-2 text-sm font-medium bg-[#f6b100] text-[#1f1f1f] rounded-lg hover:bg-[#e5a600] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isOwnShift && !checkout ? "Check out" : "View"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === TABS.DAY && canViewDay && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MdCalendarToday className="text-[#ababab]" size={18} />
            <input
              type="date"
              value={dayDate}
              onChange={(e) => setDayDate(e.target.value)}
              className="bg-[#262626] border border-[#383838] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm"
            />
          </div>

          {dayLoading && <FullScreenLoader />}

          {!dayLoading && sortedDayCheckouts.length === 0 && (
            <p className="text-[#ababab] py-8 text-center">
              No shift checkouts for this date.
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border border-[#383838]">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#262626] text-[#ababab] uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">Expected</th>
                  <th className="px-4 py-3">Counted</th>
                  <th className="px-4 py-3">Diff</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  {isAdmin && <th className="px-4 py-3 w-12" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#383838]">
                {sortedDayCheckouts.map((c) => (
                  <tr key={c._id} className="bg-[#262626] text-[#f5f5f5]">
                    <td className="px-4 py-3">{c.member?.name || "—"}</td>
                    <td className="px-4 py-3">
                      {c.shiftTemplate?.name}
                      <span className="block text-xs text-[#ababab]">
                        {c.shiftTemplate?.startTime} – {c.shiftTemplate?.endTime}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="block">{formatVND(c.expectedCash)} cash</span>
                      <span className="block text-[#ababab]">
                        {formatVND(c.expectedBanking)} banking
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="block">{formatVND(c.countedCash)} cash</span>
                      <span className="block text-[#ababab]">
                        {formatVND(c.countedBanking)} banking
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-amber-400">
                      {formatVND(c.cashDifference)} / {formatVND(c.bankingDifference)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-[#ababab]">
                      {c.notes || "—"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDeleteCheckout(c)}
                          disabled={deleteLoading}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg"
                          title="Delete checkout"
                          aria-label="Delete checkout"
                        >
                          <MdDelete size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ShiftCheckInModal
        isOpen={checkInModalOpen}
        onClose={() => {
          setCheckInModalOpen(false);
          setSelectedScheduleId(null);
          setSelectedMemberId(null);
          setSelectedMemberName("");
          setSelectedShiftName("");
        }}
        scheduleId={selectedScheduleId}
        memberId={selectedMemberId}
        memberName={selectedMemberName}
        shiftName={selectedShiftName}
        refreshDate={selectedDate}
        onSuccess={() =>
          dispatch(fetchMyShiftCheckouts({ date: selectedDate }))
        }
      />

      <ShiftCheckoutModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedScheduleId(null);
          setSelectedMemberId(null);
        }}
        scheduleId={selectedScheduleId}
        memberId={selectedMemberId}
        refreshDate={selectedDate}
        onSuccess={() =>
          dispatch(fetchMyShiftCheckouts({ date: selectedDate }))
        }
      />
    </section>
  );
};

export default ShiftCheckout;
