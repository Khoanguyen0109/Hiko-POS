import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MdStar,
  MdAdd,
  MdEdit,
  MdDelete,
  MdFilterList,
  MdLeaderboard,
  MdPerson,
} from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import TicketModal from "../components/tickets/TicketModal";
import { fetchTickets, fetchTicketSummary, removeTicket, clearTicketError } from "../redux/slices/ticketSlice";
import { fetchStoreMembers } from "../redux/slices/storeSlice";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 3 }, (_, i) => currentYear - i);

const Tickets = () => {
  const dispatch = useDispatch();
  const { role } = useSelector((s) => s.user);
  const activeStore = useSelector((s) => s.store.activeStore);
  const storeMembers = useSelector((s) => s.store.storeMembers);
  const { tickets, pagination, loading, error, summary, summaryLoading, summaryError } = useSelector((s) => s.tickets);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState("leaderboard"); // "leaderboard" | "tickets"

  const [modalOpen,    setModalOpen]    = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [deletingId,   setDeletingId]   = useState(null);

  const storeRole = activeStore?.role || activeStore?.storeRole || "";
  const canManage = role === "Admin" || storeRole === "Owner" || storeRole === "Manager";

  const members = storeMembers?.map((sm) => ({
    _id: sm.user?._id || sm.user,
    name: sm.user?.name || sm.name || "Unknown",
    role: sm.role,
  })).filter((m) => m._id) || [];

  // Fetch storeMembers if not already loaded (needed for the create modal)
  useEffect(() => {
    if (activeStore?._id && (!storeMembers || storeMembers.length === 0)) {
      dispatch(fetchStoreMembers(activeStore._id));
    }
  }, [dispatch, activeStore, storeMembers]);

  const loadData = useCallback(() => {
    dispatch(fetchTicketSummary({ month, year }));
    if (activeTab === "tickets") {
      dispatch(fetchTickets({ month, year }));
    }
  }, [dispatch, month, year, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Surface fetch errors via snackbar
  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearTicketError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (summaryError) {
      enqueueSnackbar(summaryError, { variant: "error" });
      dispatch(clearTicketError());
    }
  }, [summaryError, dispatch]);

  const handleDelete = async (ticketId) => {
    if (!window.confirm("Delete this ticket?")) return;
    setDeletingId(ticketId);
    const result = await dispatch(removeTicket(ticketId));
    setDeletingId(null);
    if (!result.error) {
      enqueueSnackbar("Ticket deleted!", { variant: "success" });
    } else {
      enqueueSnackbar(result.payload || "Failed to delete", { variant: "error" });
    }
  };

  const openCreate = () => { setSelectedTicket(null); setModalOpen(true); };
  const openEdit   = (t) => { setSelectedTicket(t);   setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setSelectedTicket(null); loadData(); };

  if (!canManage) {
    return (
      <div className="bg-[#1f1f1f] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MdStar size={48} className="text-[#6a6a6a] mx-auto mb-3" />
          <p className="text-[#ababab] text-lg font-medium">Access Denied</p>
          <p className="text-[#6a6a6a] text-sm mt-1">Only Owners and Managers can manage tickets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1f1f1f] min-h-screen pb-20">
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-[#f5f5f5] text-2xl font-bold flex items-center gap-2">
          <MdStar className="text-[#f6b100]" size={28} />
          Tickets
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#f6b100] text-[#1a1a1a] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#e5a200] transition-colors"
        >
          <MdAdd size={18} />
          New Ticket
        </button>
      </div>

      {/* Month/Year filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <MdFilterList className="text-[#ababab]" size={20} />
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="bg-[#1f1f1f] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-[#1f1f1f] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#1f1f1f] rounded-xl border border-[#343434] p-4">
            <p className="text-[#ababab] text-xs font-medium uppercase tracking-wide">Members</p>
            <p className="text-[#f5f5f5] text-2xl font-bold mt-1">{summary.members?.length ?? 0}</p>
          </div>
          <div className="bg-[#1f1f1f] rounded-xl border border-[#343434] p-4">
            <p className="text-[#ababab] text-xs font-medium uppercase tracking-wide">Monthly Tickets</p>
            <p className="text-[#f5f5f5] text-2xl font-bold mt-1">
              {summary.members?.reduce((s, m) => s + m.monthlyCount, 0) ?? 0}
            </p>
          </div>
          <div className="bg-[#1f1f1f] rounded-xl border border-[#343434] p-4">
            <p className="text-[#ababab] text-xs font-medium uppercase tracking-wide">Monthly Score</p>
            <p className="text-[#f6b100] text-2xl font-bold mt-1">
              {summary.members?.reduce((s, m) => s + m.monthlyScore, 0) ?? 0}
            </p>
          </div>
          <div className="bg-[#1f1f1f] rounded-xl border border-[#343434] p-4">
            <p className="text-[#ababab] text-xs font-medium uppercase tracking-wide">All-Time Score</p>
            <p className="text-[#f6b100] text-2xl font-bold mt-1">
              {summary.members?.reduce((s, m) => s + m.allTimeScore, 0) ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1f1f1f] rounded-lg p-1 w-fit border border-[#343434]">
        {[
          { key: "leaderboard", label: "Leaderboard", icon: <MdLeaderboard size={16} /> },
          { key: "tickets",     label: "Tickets",     icon: <MdStar size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === "tickets") dispatch(fetchTickets({ month, year }));
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[#f6b100] text-[#1a1a1a]"
                : "text-[#ababab] hover:text-[#f5f5f5]"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard tab */}
      {activeTab === "leaderboard" && (
        <div className="bg-[#1f1f1f] rounded-xl border border-[#343434] overflow-hidden">
          <div className="p-4 border-b border-[#343434]">
            <h2 className="text-[#f5f5f5] font-semibold text-sm">
              {MONTHS[month - 1]} {year} — Score Leaderboard
            </h2>
          </div>
          {summaryLoading ? (
            <div className="p-8 text-center text-[#ababab] text-sm">Loading…</div>
          ) : !summary?.members?.length ? (
            <div className="p-8 text-center text-[#ababab] text-sm">No tickets this month.</div>
          ) : (
            <div className="divide-y divide-[#343434]">
              {summary.members.map((m, idx) => (
                <div key={m.memberId} className="flex items-center gap-4 px-4 py-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    idx === 0 ? "bg-[#f6b100] text-[#1a1a1a]" :
                    idx === 1 ? "bg-[#9ca3af] text-[#1a1a1a]" :
                    idx === 2 ? "bg-[#cd7f32] text-white" : "bg-[#262626] text-[#ababab]"
                  }`}>{idx + 1}</span>
                  <MdPerson size={20} className="text-[#6a6a6a] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f5f5f5] text-sm font-medium truncate">{m.memberName}</p>
                    <p className="text-[#6a6a6a] text-xs">{m.memberRole}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#f6b100] font-bold">{m.monthlyScore} pts</p>
                    <p className="text-[#6a6a6a] text-xs">all-time: {m.allTimeScore}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tickets tab */}
      {activeTab === "tickets" && (
        <div className="bg-[#1f1f1f] rounded-xl border border-[#343434] overflow-hidden">
          <div className="p-4 border-b border-[#343434]">
            <h2 className="text-[#f5f5f5] font-semibold text-sm">
              {MONTHS[month - 1]} {year} — All Tickets ({pagination?.total ?? 0})
            </h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-[#ababab] text-sm">Loading…</div>
          ) : !tickets.length ? (
            <div className="p-8 text-center text-[#ababab] text-sm">No tickets found.</div>
          ) : (
            <div className="divide-y divide-[#343434]">
              {tickets.map((t) => (
                <div key={t._id} className="flex items-start gap-3 px-4 py-3">
                  <MdStar size={18} className="text-[#f6b100] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f5f5f5] text-sm font-medium truncate">{t.title}</p>
                    <p className="text-[#ababab] text-xs mt-0.5">
                      {t.member?.name || "—"} · {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                    {t.note && <p className="text-[#6a6a6a] text-xs mt-0.5 truncate">{t.note}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[#f6b100] font-bold text-sm">+{t.score}</span>
                    <button
                      onClick={() => openEdit(t)}
                      className="p-1.5 rounded-lg text-[#ababab] hover:bg-[#262626] hover:text-[#f5f5f5] transition-colors"
                    >
                      <MdEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id)}
                      disabled={deletingId === t._id}
                      className="p-1.5 rounded-lg text-[#ababab] hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <MdDelete size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <TicketModal
        isOpen={modalOpen}
        onClose={closeModal}
        ticket={selectedTicket}
        members={members}
      />
    </div>
    </div>
  );
};

export default Tickets;
