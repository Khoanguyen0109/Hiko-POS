import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import {
  MdAccountBalanceWallet,
  MdCalendarToday,
  MdDelete,
  MdEdit,
  MdSchedule,
  MdViewDay,
} from "react-icons/md";
import FeaturePageHeader from "../components/shared/FeaturePageHeader";
import ShiftCheckoutModal from "../components/shiftcheckout/ShiftCheckoutModal";
import ShiftCheckInModal from "../components/shiftcheckout/ShiftCheckInModal";
import ShiftCheckoutCard from "../components/shiftcheckout/ShiftCheckoutCard";
import LoadingState from "../components/shared/LoadingState";
import EmptyState from "../components/shared/EmptyState";
import {
  fetchMyShiftCheckouts,
  fetchDayShiftCheckouts,
  deleteShiftCheckout,
  clearShiftCheckoutError,
} from "../redux/slices/shiftCheckoutSlice";
import {
  CheckoutStatusBadge,
  getTotalBill,
} from "../components/shiftcheckout/ShiftCheckoutUi";
import { formatVND, getTodayDate } from "../utils";

const TABS = {
  MY_SHIFT: "my_shift",
  DAY: "day",
};

const thClass =
  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#ababab]";
const tdClass = "px-4 py-3 text-sm text-[#f5f5f5]";

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

const DatePicker = ({ value, onChange }) => (
  <label className="flex items-center gap-2 rounded-lg border border-[#343434] bg-[#141414] px-3 py-2">
    <MdCalendarToday className="shrink-0 text-[#6a6a6a]" size={18} />
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent text-sm text-[#f5f5f5] outline-none"
    />
  </label>
);

DatePicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

const SummaryStrip = ({ items }) => (
  <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
    {items.map((item) => (
      <div
        key={item.label}
        className="rounded-xl border border-[#343434] bg-[#262626] px-4 py-3"
      >
        <p className="text-[10px] font-medium uppercase tracking-wide text-[#6a6a6a]">
          {item.label}
        </p>
        <p className={`mt-1 text-lg font-semibold ${item.accent || "text-[#f5f5f5]"}`}>
          {item.value}
        </p>
      </div>
    ))}
  </div>
);

SummaryStrip.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      accent: PropTypes.string,
    })
  ).isRequired,
};

const DayCheckoutRow = ({
  checkout,
  canEditCheckout,
  canDeleteCheckout,
  onEdit,
  onDelete,
  deleteLoading,
}) => {
  const cashOk = checkout.cashDifference === 0;
  const bankingOk = checkout.bankingDifference === 0;

  return (
    <tr className="bg-[#1f1f1f] transition-colors hover:bg-[#262626]">
      <td className={`${tdClass} sticky left-0 z-[1] bg-[#1f1f1f] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
        <span className="font-medium">{checkout.member?.name || "—"}</span>
      </td>
      <td className={tdClass}>
        <span className="font-medium">{checkout.shiftTemplate?.name}</span>
        <span className="mt-0.5 block text-xs text-[#6a6a6a]">
          {checkout.shiftTemplate?.startTime} – {checkout.shiftTemplate?.endTime}
        </span>
      </td>
      <td className={tdClass}>
        <span className="font-semibold text-[#f5f5f5]">
          {formatVND(getTotalBill(checkout))}
        </span>
        <span className="block text-xs text-[#6a6a6a]">
          {checkout.orderCount ?? 0} orders
        </span>
      </td>
      <td className={tdClass}>
        <span className="text-brand">{formatVND(checkout.expectedCash)}</span>
        <span className="block text-xs text-[#6a6a6a]">
          {formatVND(checkout.expectedBanking)} banking
        </span>
      </td>
      <td className={tdClass}>
        <span>{formatVND(checkout.countedCash)}</span>
        <span className="block text-xs text-[#6a6a6a]">
          {formatVND(checkout.countedBanking)} banking
        </span>
      </td>
      <td className={tdClass}>
        <span className={cashOk ? "text-green-400" : "text-amber-400"}>
          {cashOk ? "Match" : formatVND(checkout.cashDifference)}
        </span>
        <span
          className={`block text-xs ${bankingOk ? "text-green-400/80" : "text-amber-400/80"}`}
        >
          {bankingOk ? "Match" : formatVND(checkout.bankingDifference)}
        </span>
      </td>
      <td className={tdClass}>
        <CheckoutStatusBadge status={checkout.status} />
      </td>
      <td className={`${tdClass} max-w-[180px] truncate text-[#ababab]`}>
        {checkout.notes || "—"}
      </td>
      {canEditCheckout || canDeleteCheckout ? (
        <td className={`${tdClass} text-right`}>
          <div className="flex items-center justify-end gap-1">
            {canEditCheckout ? (
              <button
                type="button"
                onClick={() => onEdit(checkout)}
                className="rounded-lg p-2 text-brand transition-colors hover:bg-brand-20"
                title="View / edit"
                aria-label="View or edit checkout"
              >
                <MdEdit size={18} />
              </button>
            ) : null}
            {canDeleteCheckout ? (
              <button
                type="button"
                onClick={() => onDelete(checkout)}
                disabled={deleteLoading}
                className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-50"
                title="Delete checkout"
                aria-label="Delete checkout"
              >
                <MdDelete size={18} />
              </button>
            ) : null}
          </div>
        </td>
      ) : null}
    </tr>
  );
};

DayCheckoutRow.propTypes = {
  checkout: PropTypes.object.isRequired,
  canEditCheckout: PropTypes.bool,
  canDeleteCheckout: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  deleteLoading: PropTypes.bool,
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
  const canEditCheckout = canViewDay;

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

  const sortedMyShifts = useMemo(
    () =>
      sortByShiftStartTimeAsc(myShifts, (row) => row.schedule?.shiftTemplate),
    [myShifts]
  );

  const sortedDayCheckouts = useMemo(
    () => sortByShiftStartTimeAsc(dayCheckouts, (c) => c.shiftTemplate),
    [dayCheckouts]
  );

  const daySummary = useMemo(() => {
    let totalBill = 0;
    let balanced = 0;
    let mismatch = 0;
    for (const c of sortedDayCheckouts) {
      totalBill += getTotalBill(c);
      if (c.status === "balanced") balanced += 1;
      else if (c.status === "mismatch") mismatch += 1;
    }
    return { totalBill, balanced, mismatch, count: sortedDayCheckouts.length };
  }, [sortedDayCheckouts]);

  const openCheckoutFromDay = (checkout) => {
    const scheduleId = checkout.schedule?._id || checkout.schedule;
    const memberId = checkout.member?._id || checkout.member;
    if (scheduleId) {
      openCheckout(String(scheduleId), memberId ? String(memberId) : null);
    }
  };

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

  const tabs = [
    { id: TABS.MY_SHIFT, label: "All shifts", icon: MdSchedule },
    ...(canViewDay
      ? [{ id: TABS.DAY, label: "Day overview", icon: MdViewDay }]
      : []),
  ];

  const activeDate = activeTab === TABS.DAY ? dayDate : selectedDate;
  const setActiveDate =
    activeTab === TABS.DAY ? setDayDate : setSelectedDate;
  const isListLoading =
    activeTab === TABS.DAY ? dayLoading : loading || checkInLoading;

  return (
    <section className="min-h-[calc(100vh-80px)] bg-[#1f1f1f] pb-24">
      <FeaturePageHeader
        title="Shift checkout"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div className="max-w-xs">
          <DatePicker value={activeDate} onChange={setActiveDate} />
        </div>
      </FeaturePageHeader>

      <div className="px-4 py-4 sm:px-6">
        {activeTab === TABS.DAY && canViewDay && sortedDayCheckouts.length > 0 ? (
          <SummaryStrip
            items={[
              { label: "Checkouts", value: daySummary.count },
              {
                label: "Total bill",
                value: formatVND(daySummary.totalBill),
                accent: "text-brand",
              },
              {
                label: "Balanced",
                value: daySummary.balanced,
                accent: "text-green-400",
              },
              {
                label: "Mismatch",
                value: daySummary.mismatch,
                accent: "text-amber-400",
              },
            ]}
          />
        ) : null}

        {isListLoading ? (
          <LoadingState message="Loading shifts..." />
        ) : activeTab === TABS.MY_SHIFT ? (
          sortedMyShifts.length === 0 ? (
            <EmptyState
              icon={MdAccountBalanceWallet}
              variant="rich"
              title="No shifts today"
              message="No shifts are scheduled for this date."
            />
          ) : (
            <div className="mx-auto max-w-3xl space-y-3">
              {sortedMyShifts.map((row) => {
                const tpl = row.schedule?.shiftTemplate;
                const checkout = row.checkout;
                const memberId = row.member?._id;
                const isOwnShift =
                  row.isOwnShift ?? String(memberId) === String(userId);
                const isCheckedIn = row.checkInStatus === "checked_in";
                const rowKey = memberId
                  ? `${row.schedule._id}-${memberId}`
                  : row.schedule._id;

                return (
                  <ShiftCheckoutCard
                    key={rowKey}
                    shiftName={tpl?.name || tpl?.shortName || "Shift"}
                    memberName={row.member?.name}
                    startTime={tpl?.startTime}
                    endTime={tpl?.endTime}
                    shiftColor={tpl?.color}
                    isOwnShift={isOwnShift}
                    checkInStatus={row.checkInStatus}
                    checkoutStatus={row.checkoutStatus}
                    checkIn={row.checkIn}
                    checkout={checkout}
                    expectedPreview={row.expectedPreview}
                    showCheckInButton={isOwnShift && !isCheckedIn}
                    checkoutDisabled={isOwnShift && !isCheckedIn && !checkout}
                    checkoutLabel={
                      isOwnShift && !checkout ? "Check out" : "View details"
                    }
                    onCheckIn={() => openCheckIn(row)}
                    onCheckout={() =>
                      openCheckout(row.schedule._id, memberId)
                    }
                  />
                );
              })}
            </div>
          )
        ) : sortedDayCheckouts.length === 0 ? (
          <EmptyState
            icon={MdViewDay}
            variant="rich"
            title="No checkouts yet"
            message="No shift checkouts have been submitted for this date."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#343434]">
            <table className="w-full min-w-[960px] text-left">
              <thead className="bg-[#262626]">
                <tr>
                  <th className={`${thClass} sticky left-0 z-[2] bg-[#262626]`}>
                    Member
                  </th>
                  <th className={thClass}>Shift</th>
                  <th className={thClass}>Total bill</th>
                  <th className={thClass}>Expected</th>
                  <th className={thClass}>Counted</th>
                  <th className={thClass}>Diff</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Notes</th>
                  {(canEditCheckout || isAdmin) ? (
                    <th className={`${thClass} text-right`}>Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#343434]">
                {sortedDayCheckouts.map((c) => (
                  <DayCheckoutRow
                    key={c._id}
                    checkout={c}
                    canEditCheckout={canEditCheckout}
                    canDeleteCheckout={isAdmin}
                    onEdit={openCheckoutFromDay}
                    onDelete={handleDeleteCheckout}
                    deleteLoading={deleteLoading}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
        refreshDate={activeTab === TABS.DAY ? dayDate : selectedDate}
        canEditCheckout={canEditCheckout}
        onSuccess={() => {
          dispatch(fetchMyShiftCheckouts({ date: selectedDate }));
          if (activeTab === TABS.DAY && canViewDay) {
            dispatch(fetchDayShiftCheckouts(dayDate));
          }
        }}
      />
    </section>
  );
};

export default ShiftCheckout;
