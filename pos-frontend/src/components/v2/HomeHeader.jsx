import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROUTES } from "../../constants";
import { useSecretTap } from "../../hooks/useSecretTap";
import { useV2Ui } from "../../hooks/useV2Ui";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const HomeHeader = () => {
  const navigate = useNavigate();
  const { name } = useSelector((state) => state.user);
  const { v2UiEnabled } = useV2Ui();

  const handleUnlock = useCallback(() => {
    navigate(ROUTES.FEATURE_TOGGLES);
  }, [navigate]);

  const { onTap } = useSecretTap({
    requiredTaps: 5,
    resetMs: 3000,
    onUnlock: handleUnlock,
  });

  const greeting = getGreeting();
  const displayName = name?.trim() || "there";

  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-6 sm:px-8">
      <button
        type="button"
        onClick={onTap}
        className="text-left"
        aria-label={`${greeting}, ${displayName}`}
      >
        <p className="text-sm text-[#ababab]">{greeting}</p>
        <h1 className="text-2xl font-semibold text-[#f5f5f5]">{displayName}</h1>
      </button>

      {v2UiEnabled ? (
        <span className="shrink-0 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
          V2
        </span>
      ) : null}
    </div>
  );
};

export default HomeHeader;
