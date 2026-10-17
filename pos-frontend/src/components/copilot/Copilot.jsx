import { useEffect, useId, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MdChat, MdClose } from "react-icons/md";
import { ROUTES } from "../../constants";
import { useV2Ui } from "../../hooks/useV2Ui";
import { axiosWrapper } from "../../https/axiosWrapper";
import { baseApi } from "../../redux/api/baseApi";

const HIDDEN_PATHS = [ROUTES.AUTH, ROUTES.SELECT_STORE, ROUTES.MENU_ORDER];

const STAFF_PROMPTS = [
  { id: "stock", label: "How much rice is left?", kind: "read" },
  { id: "shifts", label: "What is my shift this week?", kind: "read" },
  { id: "import", label: "Import 5 kg rice", kind: "import" },
  { id: "export", label: "Export 2 kg chicken for production", kind: "export" },
];

const ADMIN_PROMPTS = [
  { id: "week", label: "Who is on Friday dinner?", kind: "read" },
  { id: "assign", label: "Assign Mai to Friday dinner", kind: "schedule" },
];

function promptsForRole(role) {
  if (role === "Admin") {
    return [...STAFF_PROMPTS, ...ADMIN_PROMPTS];
  }
  return STAFF_PROMPTS;
}

function errorText(error) {
  return error?.response?.data?.message || "The assistant could not answer.";
}

function Copilot() {
  const location = useLocation();
  const titleId = useId();
  const inputRef = useRef(null);
  const { v2UiEnabled } = useV2Ui();
  const dispatch = useDispatch();
  const role = useSelector((state) => state.user.role);
  const activeStore = useSelector((state) => state.store.activeStore);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [prompts, setPrompts] = useState(() => promptsForRole(role));
  const [messages, setMessages] = useState([]);
  const hidden =
    !activeStore || HIDDEN_PATHS.includes(location.pathname);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    if (desktop) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    axiosWrapper
      .get("/api/assistant/capabilities")
      .then((response) => {
        if (!cancelled && Array.isArray(response.data?.data)) {
          setPrompts(response.data.data);
        }
      })
      .catch(() => {
        if (!cancelled) setPrompts(promptsForRole(role));
      });
    return () => {
      cancelled = true;
    };
  }, [open, role]);

  if (hidden) return null;

  const send = async (text, shown) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setDraft("");
    setBusy(true);
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, role: "user", text: shown || trimmed },
    ]);
    try {
      const response = await axiosWrapper.post("/api/assistant/chat", { text: trimmed });
      const data = response.data?.data || {};
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: data.reply || "",
          slip: data.slip || null,
          choices: data.choices || null,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-assistant`, role: "assistant", text: errorText(error) },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const finishSlip = (id, text) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, slip: null, choices: null, text } : message
      )
    );
  };

  const confirmSlip = async (message) => {
    if (!message.slip?.draftId || message.slip.blocked || busy) return;
    setBusy(true);
    try {
      const response = await axiosWrapper.post("/api/assistant/commit", {
        draftId: message.slip.draftId,
      });
      finishSlip(message.id, response.data?.message || "Saved");
      dispatch(
        baseApi.util.invalidateTags([
          "StorageItem",
          "StorageImport",
          "StorageExport",
          "Schedule",
        ])
      );
    } catch (error) {
      finishSlip(message.id, errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const cancelSlip = async (message) => {
    if (busy) return;
    setBusy(true);
    try {
      if (message.slip?.draftId) {
        await axiosWrapper.post("/api/assistant/cancel", { draftId: message.slip.draftId });
      }
      finishSlip(message.id, "Canceled. Nothing was saved.");
    } catch (error) {
      finishSlip(message.id, errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const fabPosition = v2UiEnabled
    ? "bottom-[calc(env(safe-area-inset-bottom,0px)+4.75rem)] left-4 lg:bottom-4 lg:left-[72px]"
    : "bottom-4 left-[72px]";

  return (
    <>
      {open ? null : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`fixed z-30 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-[#f5f5f5] shadow-lg ${fabPosition}`}
          aria-label="Copilot"
        >
          <MdChat size={22} />
        </button>
      )}

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close copilot"
            className="absolute inset-0 bg-black/50 lg:bg-black/20"
            onClick={() => setOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl border border-[#343434] bg-[#1a1a1a] lg:inset-x-auto lg:bottom-4 lg:left-[72px] lg:h-[min(560px,70vh)] lg:w-[380px] lg:rounded-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex shrink-0 justify-center pt-3 lg:hidden">
              <div className="h-1 w-10 rounded-full bg-[#555]" />
            </div>
            <header className="flex shrink-0 items-center justify-between border-b border-[#343434] px-4 py-3">
              <div>
                <h2 id={titleId} className="text-base font-semibold text-[#f5f5f5]">
                  {activeStore.name}
                </h2>
                <p className="text-xs text-[#ababab]">{role || "Staff"}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-[#ababab] hover:bg-[#262626] hover:text-[#f5f5f5]"
                aria-label="Close"
              >
                <MdClose size={20} />
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
              {messages.length === 0 ? (
                <div className="flex flex-col gap-2">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      type="button"
                      disabled={busy}
                      onClick={() => send(prompt.label)}
                      className="min-h-[48px] rounded-lg border border-[#343434] bg-[#262626] px-3 text-left text-sm font-medium text-[#f5f5f5] hover:bg-[#343434]"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              ) : (
                messages.map((message) =>
                  message.role === "user" ? (
                    <p key={message.id} className="text-sm text-[#f5f5f5]">
                      {message.text}
                    </p>
                  ) : (
                    <div key={message.id} className="flex flex-col gap-2">
                      {message.text ? (
                        <p className="text-sm text-[#ababab]">{message.text}</p>
                      ) : null}
                      {message.slip ? (
                        <Slip
                          slip={message.slip}
                          busy={busy}
                          onConfirm={() => confirmSlip(message)}
                          onCancel={() => cancelSlip(message)}
                        />
                      ) : null}
                      {message.choices?.map((choice) => (
                        <button
                          key={choice.text}
                          type="button"
                          disabled={busy}
                          onClick={() => send(choice.text, choice.label)}
                          className="min-h-[48px] rounded-lg border border-[#343434] bg-[#262626] px-3 text-left text-sm font-medium text-[#f5f5f5] hover:bg-[#343434]"
                        >
                          {choice.label}
                        </button>
                      ))}
                    </div>
                  )
                )
              )}
            </div>

            {messages.length > 0 ? (
              <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-[#343434] px-4 py-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    disabled={busy}
                    onClick={() => send(prompt.label)}
                    className="shrink-0 rounded-full border border-[#343434] px-3 py-2 text-xs font-medium text-[#f5f5f5] hover:bg-[#262626]"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            ) : null}

            <form
              className="flex shrink-0 gap-2 border-t border-[#343434] px-4 py-3"
              onSubmit={(event) => {
                event.preventDefault();
                send(draft, null);
              }}
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about stock or the week"
                className="min-h-[48px] min-w-0 flex-1 rounded-lg border border-[#343434] bg-[#262626] px-3 text-sm text-[#f5f5f5] outline-none placeholder:text-[#666]"
              />
              <button
                type="submit"
                className="min-h-[48px] rounded-lg bg-brand px-4 text-sm font-semibold text-[#f5f5f5] disabled:opacity-50"
                disabled={!draft.trim() || busy}
              >
                Send
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function Slip({ slip, busy, onConfirm, onCancel }) {
  return (
    <div className="rounded-lg border border-[#343434] bg-[#262626] p-3">
      <p className="text-sm font-semibold text-[#f5f5f5]">{slip.title}</p>
      <dl className="mt-2 flex flex-col gap-1">
        {slip.rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-[#ababab]">{label}</dt>
            <dd className="text-right text-[#f5f5f5]">{value}</dd>
          </div>
        ))}
      </dl>
      {slip.blocked ? <p className="mt-2 text-xs text-[#ababab]">{slip.blocked}</p> : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={Boolean(slip.blocked) || busy}
          onClick={onConfirm}
          className="min-h-[48px] flex-1 rounded-lg bg-brand px-3 text-sm font-semibold text-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {slip.confirm}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[48px] rounded-lg border border-[#343434] px-3 text-sm font-semibold text-[#f5f5f5] hover:bg-[#343434]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

Slip.propTypes = {
  slip: PropTypes.shape({
    title: PropTypes.string.isRequired,
    confirm: PropTypes.string.isRequired,
    blocked: PropTypes.string,
    rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  }).isRequired,
  busy: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default Copilot;
