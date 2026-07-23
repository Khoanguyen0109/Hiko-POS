import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdPeople, MdSearch, MdEdit } from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import { fetchCustomers, editCustomer } from "../redux/slices/customersSlice";
import BottomSheet from "../components/shared/BottomSheet";

const Customers = () => {
  const dispatch = useDispatch();
  const { items: customers, loading, error } = useSelector(
    (s) => s.customersData
  );

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", nickname: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
    }
  }, [error]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        (c.phone && c.phone.includes(q)) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.nickname && c.nickname.toLowerCase().includes(q))
    );
  }, [customers, search]);

  const getInitials = (c) => {
    const n = c.name || c.nickname || c.phone || "?";
    return n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const openDetail = (c) => {
    setSelectedCustomer(c);
    setEditForm({ name: c.name || "", nickname: c.nickname || "" });
  };

  const closeDetail = () => {
    setSelectedCustomer(null);
  };

  const handleSave = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    const result = await dispatch(
      editCustomer({
        customerId: selectedCustomer._id,
        name: editForm.name.trim(),
        nickname: editForm.nickname.trim(),
      })
    );
    setSaving(false);
    if (!result.error) {
      enqueueSnackbar("Customer updated!", { variant: "success" });
      setSelectedCustomer({ ...selectedCustomer, ...editForm });
    } else {
      enqueueSnackbar(result.payload || "Update failed", { variant: "error" });
    }
  };

  return (
    <div className="bg-[#1f1f1f] min-h-screen pb-20">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-[#f5f5f5] text-2xl font-bold flex items-center gap-2">
            <MdPeople className="text-brand" size={28} />
            Customers
            {!loading && (
              <span className="text-sm font-normal text-[#ababab] ml-2">
                ({customers.length})
              </span>
            )}
          </h1>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <MdSearch
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a6a]"
          />
          <input
            type="text"
            placeholder="Search by phone or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#262626] border border-[#343434] rounded-lg text-[#f5f5f5] text-sm focus:outline-none focus:border-brand placeholder-[#6a6a6a]"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand mx-auto mb-3" />
            <p className="text-[#ababab] text-sm">Loading customers…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <MdPeople size={48} className="text-[#6a6a6a] mx-auto mb-3" />
            <p className="text-[#ababab] text-lg font-medium">
              {search ? "No matches found" : "No customers yet"}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-[#262626] rounded-xl border border-[#343434] overflow-hidden">
            {/* Desktop header */}
            <div className="hidden md:grid md:grid-cols-[48px_1fr_1fr_100px_80px] gap-4 px-4 py-3 border-b border-[#343434] text-[#6a6a6a] text-xs uppercase tracking-wider font-semibold">
              <span />
              <span>Name</span>
              <span>Phone</span>
              <span className="text-right">Dishes</span>
              <span />
            </div>

            <div className="divide-y divide-[#343434]">
              {filtered.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center gap-3 px-4 py-3 md:grid md:grid-cols-[48px_1fr_1fr_100px_80px] md:gap-4"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-brand-20 text-brand flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {getInitials(c)}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0 md:flex-none">
                    <p className="text-[#f5f5f5] text-sm font-medium truncate">
                      {c.name || c.nickname || "—"}
                    </p>
                    <p className="text-[#6a6a6a] text-xs md:hidden">
                      {c.phone}
                    </p>
                  </div>

                  {/* Phone (desktop) */}
                  <p className="hidden md:block text-[#ababab] text-sm">
                    {c.phone}
                  </p>

                  {/* Dish count */}
                  <p className="text-brand font-bold text-sm text-right flex-shrink-0">
                    {c.totalDishCount ?? 0}
                  </p>

                  {/* View btn */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => openDetail(c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5] transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedCustomer && (
        <BottomSheet
          isOpen={Boolean(selectedCustomer)}
          onClose={closeDetail}
          title="Customer Details"
          size="sm"
          bodyClassName="p-4 sm:p-6"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDetail}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#ababab] transition-colors hover:bg-[#343434]"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-[#f5f5f5] transition-colors hover:bg-brand-hover disabled:opacity-50"
              >
                <MdEdit size={14} />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
              {/* Info card */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-20 text-brand flex items-center justify-center text-lg font-bold">
                  {getInitials(selectedCustomer)}
                </div>
                <div>
                  <p className="text-[#f5f5f5] font-medium">
                    {selectedCustomer.phone}
                  </p>
                  <p className="text-[#6a6a6a] text-xs">
                    {selectedCustomer.totalDishCount ?? 0} dishes ordered
                  </p>
                </div>
              </div>

              {/* Edit fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[#ababab] text-xs mb-1.5">
                    Name
                  </label>
                  <input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full bg-[#1f1f1f] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[#ababab] text-xs mb-1.5">
                    Nickname
                  </label>
                  <input
                    value={editForm.nickname}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, nickname: e.target.value }))
                    }
                    className="w-full bg-[#1f1f1f] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default Customers;
