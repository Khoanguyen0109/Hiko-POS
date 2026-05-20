import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import {
  MdAnalytics,
  MdCheckCircle,
  MdWarning,
  MdAccountBalanceWallet,
  MdPeople,
  MdDelete,
} from "react-icons/md";
import {
  fetchShiftCheckoutList,
  deleteShiftCheckout,
  clearShiftCheckoutError,
} from "../../redux/slices/shiftCheckoutSlice";
import { fetchMembers } from "../../redux/slices/memberSlice";
import { formatVND, getTodayDate } from "../../utils";
import { getDateRangeByPeriodVietnam, getLocalDateString } from "../../utils/dateUtils";

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
  return null;
};

const ShiftCheckoutDashboard = ({ dateFilter, customDateRange }) => {
  const dispatch = useDispatch();
  const { listCheckouts, listSummary, listLoading, listError, deleteLoading } =
    useSelector((state) => state.shiftCheckout);
  const { members } = useSelector((state) => state.members);

  const [statusFilter, setStatusFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");

  const dateRange = useMemo(() => {
    const today = getTodayDate();
    let startDate;
    let endDate;

    switch (dateFilter) {
      case "today":
        startDate = endDate = today;
        break;
      case "week": {
        const { start } = getDateRangeByPeriodVietnam("thisWeek");
        startDate = start;
        endDate = today;
        break;
      }
      case "month": {
        const { start } = getDateRangeByPeriodVietnam("thisMonth");
        startDate = start;
        endDate = today;
        break;
      }
      case "custom":
        if (customDateRange.startDate && customDateRange.endDate) {
          startDate = customDateRange.startDate;
          endDate = customDateRange.endDate;
        } else {
          startDate = endDate = today;
        }
        break;
      default:
        startDate = endDate = today;
    }

    return { startDate, endDate };
  }, [dateFilter, customDateRange]);

  useEffect(() => {
    dispatch(fetchMembers());
  }, [dispatch]);

  useEffect(() => {
    const params = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    };
    if (statusFilter !== "all") params.status = statusFilter;
    if (memberFilter !== "all") params.memberId = memberFilter;

    dispatch(fetchShiftCheckoutList(params));
  }, [dispatch, dateRange, statusFilter, memberFilter]);

  useEffect(() => {
    if (listError) {
      enqueueSnackbar(listError, { variant: "error" });
      dispatch(clearShiftCheckoutError());
    }
  }, [listError, dispatch]);

  const handleDelete = async (checkout) => {
    const memberName = checkout.member?.name || "this member";
    const shiftName = checkout.shiftTemplate?.name || "shift";
    if (
      !window.confirm(
        `Delete checkout for ${memberName} (${shiftName})? They can submit again after deletion.`
      )
    ) {
      return;
    }

    try {
      await dispatch(deleteShiftCheckout(checkout._id)).unwrap();
      enqueueSnackbar("Shift checkout deleted", { variant: "success" });
    } catch {
      // error via listError
    }
  };

  if (listLoading || deleteLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100] mx-auto mb-4" />
        <p className="text-[#ababab] text-lg">Loading shift checkouts...</p>
      </div>
    );
  }

  if (listError) {
    return (
      <div className="container mx-auto px-4 md:px-6 text-center py-12">
        <MdAnalytics className="mx-auto text-6xl text-red-500 mb-4" />
        <p className="text-red-400 text-lg mb-2">Error loading shift checkouts</p>
        <p className="text-[#ababab] text-sm">{listError}</p>
      </div>
    );
  }

  const summary = listSummary || {
    totalCount: 0,
    balancedCount: 0,
    mismatchCount: 0,
    totalCashDifference: 0,
    totalBankingDifference: 0,
  };

  return (
    <div className="container mx-auto px-4 md:px-6">
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
            <div className="flex items-center justify-between mb-2">
              <MdAccountBalanceWallet className="text-xl text-[#f6b100]" />
            </div>
            <h3 className="text-xl font-bold text-[#f5f5f5]">{summary.totalCount}</h3>
            <p className="text-[#ababab] text-sm">Total checkouts</p>
          </div>
          <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
            <div className="flex items-center justify-between mb-2">
              <MdCheckCircle className="text-xl text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-[#f5f5f5]">{summary.balancedCount}</h3>
            <p className="text-[#ababab] text-sm">Balanced</p>
          </div>
          <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
            <div className="flex items-center justify-between mb-2">
              <MdWarning className="text-xl text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-[#f5f5f5]">{summary.mismatchCount}</h3>
            <p className="text-[#ababab] text-sm">Mismatches</p>
          </div>
          <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
            <p className="text-[#f5f5f5] font-semibold text-sm">
              {formatVND(summary.totalCashDifference)}
            </p>
            <p className="text-[#ababab] text-xs">Cash variance</p>
            <p className="text-[#f5f5f5] font-semibold text-sm mt-2">
              {formatVND(summary.totalBankingDifference)}
            </p>
            <p className="text-[#ababab] text-xs">Banking variance</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-[#262626] rounded-lg p-4 border border-[#343434]">
          <div className="flex-1">
            <label className="block text-xs text-[#ababab] mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#1f1f1f] border border-[#383838] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm"
            >
              <option value="all">All</option>
              <option value="balanced">Balanced</option>
              <option value="mismatch">Mismatch</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-[#ababab] mb-1 flex items-center gap-1">
              <MdPeople size={14} /> Member
            </label>
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="w-full bg-[#1f1f1f] border border-[#383838] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm"
            >
              <option value="all">All members</option>
              {(members || []).map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {listCheckouts.length === 0 ? (
          <div className="text-center py-12 bg-[#262626] rounded-lg border border-[#343434]">
            <MdAnalytics className="mx-auto text-6xl text-[#ababab] mb-4" />
            <p className="text-[#ababab] text-lg">No shift checkouts in this period</p>
            <p className="text-[#ababab] text-sm mt-2">
              {dateRange.startDate} — {dateRange.endDate}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#343434]">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#262626] text-[#ababab] uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">Expected</th>
                  <th className="px-4 py-3">Counted</th>
                  <th className="px-4 py-3">Diff</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#383838]">
                {listCheckouts.map((c) => (
                  <tr key={c._id} className="bg-[#262626] text-[#f5f5f5]">
                    <td className="px-4 py-3 whitespace-nowrap text-[#ababab]">
                      {c.shiftDate
                        ? getLocalDateString(new Date(c.shiftDate))
                        : "—"}
                    </td>
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
                    <td className="px-4 py-3 max-w-[200px] text-[#ababab] text-xs">
                      {c.notes || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        disabled={deleteLoading}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete checkout"
                        aria-label="Delete checkout"
                      >
                        <MdDelete size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

ShiftCheckoutDashboard.propTypes = {
  dateFilter: PropTypes.string.isRequired,
  customDateRange: PropTypes.shape({
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
};

export default ShiftCheckoutDashboard;
