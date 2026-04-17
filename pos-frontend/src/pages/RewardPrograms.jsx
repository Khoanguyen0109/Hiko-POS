import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdCardGiftcard,
} from "react-icons/md";
import { enqueueSnackbar } from "notistack";
import {
  fetchRewardPrograms,
  createRewardProgram,
  editRewardProgram,
  removeRewardProgram,
  toggleProgramStatus,
} from "../redux/slices/rewardSlice";
import { fetchCategories } from "../redux/slices/categorySlice";

const EMPTY_FORM = {
  name: "",
  description: "",
  type: "percentage_discount",
  dishThreshold: "",
  discountPercent: "",
  maxFreeDishValue: "",
  priority: 0,
  eligibleCategories: [],
};

const RewardPrograms = () => {
  const dispatch = useDispatch();
  const { programs, programsLoading, programsError } = useSelector(
    (s) => s.rewards
  );
  const categories = useSelector((s) => s.categories?.items || []);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchRewardPrograms());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (programsError) {
      enqueueSnackbar(programsError, { variant: "error" });
    }
  }, [programsError]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name || "",
      description: p.description || "",
      type: p.type || "percentage_discount",
      dishThreshold: p.dishThreshold ?? "",
      discountPercent: p.discountPercent ?? "",
      maxFreeDishValue: p.maxFreeDishValue ?? "",
      priority: p.priority ?? 0,
      eligibleCategories: (p.eligibleCategories || []).map((c) =>
        typeof c === "string" ? c : c._id
      ),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      dishThreshold: Number(form.dishThreshold),
      priority: Number(form.priority),
      eligibleCategories: form.eligibleCategories || [],
    };
    if (form.type === "percentage_discount") {
      payload.discountPercent = Number(form.discountPercent);
    }
    if (form.type === "free_dish" && form.maxFreeDishValue) {
      payload.maxFreeDishValue = Number(form.maxFreeDishValue);
    }

    let result;
    if (editingId) {
      result = await dispatch(editRewardProgram({ id: editingId, ...payload }));
    } else {
      result = await dispatch(createRewardProgram(payload));
    }

    setSubmitting(false);

    if (!result.error) {
      enqueueSnackbar(
        editingId ? "Program updated!" : "Program created!",
        { variant: "success" }
      );
      closeModal();
    } else {
      enqueueSnackbar(result.payload || "Operation failed", {
        variant: "error",
      });
    }
  };

  const handleToggle = useCallback(
    async (id) => {
      const result = await dispatch(toggleProgramStatus(id));
      if (!result.error) {
        enqueueSnackbar("Status toggled!", { variant: "success" });
      } else {
        enqueueSnackbar(result.payload || "Toggle failed", {
          variant: "error",
        });
      }
    },
    [dispatch]
  );

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this reward program?")) return;
      const result = await dispatch(removeRewardProgram(id));
      if (!result.error) {
        enqueueSnackbar("Program deleted!", { variant: "success" });
      } else {
        enqueueSnackbar(result.payload || "Delete failed", {
          variant: "error",
        });
      }
    },
    [dispatch]
  );

  return (
    <div className="bg-[#1f1f1f] min-h-screen pb-20">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-[#f5f5f5] text-2xl font-bold flex items-center gap-2">
            <MdCardGiftcard className="text-[#f6b100]" size={28} />
            Reward Programs
          </h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#f6b100] text-[#1a1a1a] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#e5a200] transition-colors"
          >
            <MdAdd size={18} />
            New Program
          </button>
        </div>

        {/* Loading */}
        {programsLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f6b100] mx-auto mb-3" />
            <p className="text-[#ababab] text-sm">Loading programs…</p>
          </div>
        )}

        {/* Empty state */}
        {!programsLoading && programs.length === 0 && (
          <div className="text-center py-16">
            <MdCardGiftcard
              size={48}
              className="text-[#6a6a6a] mx-auto mb-3"
            />
            <p className="text-[#ababab] text-lg font-medium">
              No reward programs yet
            </p>
            <p className="text-[#6a6a6a] text-sm mt-1">
              Create one to start rewarding your customers.
            </p>
          </div>
        )}

        {/* Program cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((p) => (
            <div
              key={p._id}
              className="bg-[#262626] rounded-xl border border-[#343434] p-4 flex flex-col gap-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {p.type === "free_dish" ? "🍜" : "🎫"}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[#f5f5f5] font-semibold text-sm truncate">
                      {p.name}
                    </h3>
                    <p className="text-[#ababab] text-xs capitalize">
                      {p.type?.replace("_", " ")}
                    </p>
                  </div>
                </div>
                {/* Active toggle */}
                <button
                  onClick={() => handleToggle(p._id)}
                  className={`flex-shrink-0 w-11 h-6 rounded-full relative transition-colors duration-200 ${
                    p.isActive !== false
                      ? "bg-green-500"
                      : "bg-[#4a4a4a]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      p.isActive !== false
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#1f1f1f] rounded-lg px-3 py-2">
                  <p className="text-[#6a6a6a]">Threshold</p>
                  <p className="text-[#f5f5f5] font-bold">
                    {p.dishThreshold} dishes
                  </p>
                </div>
                {p.type === "percentage_discount" && (
                  <div className="bg-[#1f1f1f] rounded-lg px-3 py-2">
                    <p className="text-[#6a6a6a]">Discount</p>
                    <p className="text-[#f6b100] font-bold">
                      {p.discountPercent}%
                    </p>
                  </div>
                )}
                {p.type === "free_dish" && (
                  <div className="bg-[#1f1f1f] rounded-lg px-3 py-2">
                    <p className="text-[#6a6a6a]">Max Value</p>
                    <p className="text-[#f6b100] font-bold">
                      {p.maxFreeDishValue || "—"}
                    </p>
                  </div>
                )}
              </div>

              {p.eligibleCategories?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.eligibleCategories.map((cat) => (
                    <span
                      key={cat._id || cat}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1f1f1f] text-[#ababab] border border-[#343434]"
                    >
                      {cat.color && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                      {cat.name || cat}
                    </span>
                  ))}
                </div>
              )}

              {p.description && (
                <p className="text-[#6a6a6a] text-xs line-clamp-2">
                  {p.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[#343434]">
                <button
                  onClick={() => openEdit(p)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#ababab] hover:bg-[#343434] hover:text-[#f5f5f5] transition-colors"
                >
                  <MdEdit size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#ababab] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <MdDelete size={14} /> Delete
                </button>
                <span
                  className={`ml-auto text-[10px] font-semibold uppercase tracking-wide ${
                    p.isActive !== false ? "text-green-400" : "text-[#6a6a6a]"
                  }`}
                >
                  {p.isActive !== false ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#262626] rounded-xl border border-[#343434] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#343434]">
              <h2 className="text-[#f5f5f5] font-semibold text-lg">
                {editingId ? "Edit Program" : "New Reward Program"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-[#343434] transition-colors"
              >
                <MdClose size={20} className="text-[#ababab]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-[#ababab] text-xs mb-1.5">
                  Name
                </label>
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-[#1f1f1f] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
                />
              </div>

              <div>
                <label className="block text-[#ababab] text-xs mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  value={form.description}
                  onChange={handleChange}
                  className="w-full bg-[#1f1f1f] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100] resize-none"
                />
              </div>

              <div>
                <label className="block text-[#ababab] text-xs mb-1.5">
                  Type
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full bg-[#1f1f1f] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
                >
                  <option value="percentage_discount">
                    Percentage Discount
                  </option>
                  <option value="free_dish">Free Dish</option>
                </select>
              </div>

              <div>
                <label className="block text-[#ababab] text-xs mb-1.5">
                  Eligible Categories
                </label>
                <p className="text-[#6a6a6a] text-[11px] mb-2">
                  Leave empty to count all dishes. Select categories to only
                  count dishes from those categories.
                </p>
                <div className="flex flex-wrap gap-2 p-2 bg-[#1f1f1f] border border-[#343434] rounded-lg min-h-[40px]">
                  {categories.map((cat) => {
                    const isSelected = form.eligibleCategories.includes(
                      cat._id
                    );
                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            eligibleCategories: isSelected
                              ? prev.eligibleCategories.filter(
                                  (id) => id !== cat._id
                                )
                              : [...prev.eligibleCategories, cat._id],
                          }))
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-[#f6b100] text-[#1a1a1a]"
                            : "bg-[#262626] text-[#ababab] hover:bg-[#343434]"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color || "#6a6a6a" }}
                        />
                        {cat.name}
                      </button>
                    );
                  })}
                  {categories.length === 0 && (
                    <span className="text-[#6a6a6a] text-xs">
                      No categories available
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ababab] text-xs mb-1.5">
                    Dish Threshold
                  </label>
                  <input
                    name="dishThreshold"
                    type="number"
                    required
                    min={1}
                    value={form.dishThreshold}
                    onChange={handleChange}
                    className="w-full bg-[#1f1f1f] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
                  />
                </div>

                {form.type === "percentage_discount" && (
                  <div>
                    <label className="block text-[#ababab] text-xs mb-1.5">
                      Discount %
                    </label>
                    <input
                      name="discountPercent"
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={form.discountPercent}
                      onChange={handleChange}
                      className="w-full bg-[#1f1f1f] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
                    />
                  </div>
                )}

                {form.type === "free_dish" && (
                  <div>
                    <label className="block text-[#ababab] text-xs mb-1.5">
                      Max Value (opt.)
                    </label>
                    <input
                      name="maxFreeDishValue"
                      type="number"
                      min={0}
                      value={form.maxFreeDishValue}
                      onChange={handleChange}
                      className="w-full bg-[#1f1f1f] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[#ababab] text-xs mb-1.5">
                  Priority
                </label>
                <input
                  name="priority"
                  type="number"
                  min={0}
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full bg-[#1f1f1f] border border-[#343434] rounded-lg px-3 py-2 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[#ababab] hover:bg-[#343434] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#f6b100] text-[#1a1a1a] hover:bg-[#e5a200] transition-colors disabled:opacity-50"
                >
                  {submitting
                    ? "Saving…"
                    : editingId
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardPrograms;
