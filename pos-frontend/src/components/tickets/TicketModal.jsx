import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdStar, MdPerson } from "react-icons/md";
import BottomSheet from "../shared/BottomSheet";
import { enqueueSnackbar } from "notistack";
import PropTypes from "prop-types";
import { addTicket, editTicket, clearTicketError } from "../../redux/slices/ticketSlice";

const TicketModal = ({ isOpen, onClose, ticket, members }) => {
  const dispatch = useDispatch();
  const { createLoading, updateLoading, error } = useSelector((s) => s.tickets);
  const isEdit = Boolean(ticket);

  const [form, setForm] = useState({ memberId: "", title: "", score: "", note: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (ticket) {
      setForm({
        memberId: ticket.member?._id || ticket.member || "",
        title: ticket.title || "",
        score: String(ticket.score || ""),
        note: ticket.note || "",
      });
    } else {
      setForm({ memberId: "", title: "", score: "", note: "" });
    }
    setErrors({});
  }, [ticket, isOpen]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearTicketError());
    }
  }, [error, dispatch]);

  const validate = () => {
    const e = {};
    if (!isEdit && !form.memberId) e.memberId = "Please select a member";
    if (!form.title.trim()) e.title = "Title is required";
    if (form.title.trim().length > 200) e.title = "Title must be 200 characters or fewer";
    const s = Number(form.score);
    if (!form.score || !Number.isInteger(s) || s < 1) e.score = "Score must be a whole number ≥ 1";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }

    const payload = {
      title: form.title.trim(),
      score: Number(form.score),
      note: form.note.trim(),
    };

    if (isEdit) {
      const result = await dispatch(editTicket({ ticketId: ticket._id, ...payload }));
      if (!result.error) {
        enqueueSnackbar("Ticket updated!", { variant: "success" });
        onClose();
      }
    } else {
      const result = await dispatch(addTicket({ memberId: form.memberId, ...payload }));
      if (!result.error) {
        enqueueSnackbar("Ticket created!", { variant: "success" });
        onClose();
      }
    }
  };

  const loading = createLoading || updateLoading;
  const title = (
    <h2 className="flex items-center gap-2 text-lg font-semibold text-[#f5f5f5]">
      <MdStar className="text-[#f6b100]" />
      {isEdit ? "Edit Ticket" : "New Ticket"}
    </h2>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      bodyClassName="p-4 sm:p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member select — only on create */}
          {!isEdit && (
            <div>
              <label className="block text-[#ababab] text-sm mb-1.5 font-medium">
                <MdPerson className="inline mr-1.5" />
                Member
              </label>
              <select
                name="memberId"
                value={form.memberId}
                onChange={handleChange}
                className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2.5 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
              >
                <option value="">Select a member…</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
              {errors.memberId && <p className="text-red-400 text-xs mt-1">{errors.memberId}</p>}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[#ababab] text-sm mb-1.5 font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={200}
              placeholder="e.g. Excellent customer service"
              className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2.5 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Score */}
          <div>
            <label className="block text-[#ababab] text-sm mb-1.5 font-medium">
              Score <span className="text-[#6a6a6a] text-xs">(whole number ≥ 1)</span>
            </label>
            <input
              type="number"
              name="score"
              value={form.score}
              onChange={handleChange}
              min={1}
              step={1}
              placeholder="10"
              className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2.5 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100]"
            />
            {errors.score && <p className="text-red-400 text-xs mt-1">{errors.score}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="block text-[#ababab] text-sm mb-1.5 font-medium">
              Note <span className="text-[#6a6a6a] text-xs">(optional)</span>
            </label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              placeholder="Additional details…"
              className="w-full bg-[#262626] border border-[#343434] rounded-lg px-3 py-2.5 text-[#f5f5f5] text-sm focus:outline-none focus:border-[#f6b100] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-[#343434] text-[#ababab] text-sm font-medium hover:bg-[#262626] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#f6b100] text-[#1a1a1a] text-sm font-semibold hover:bg-[#e5a200] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
    </BottomSheet>
  );
};

TicketModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  ticket: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf([null])]),
  members: PropTypes.array.isRequired,
};

export default TicketModal;
