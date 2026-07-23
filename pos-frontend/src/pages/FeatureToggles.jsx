import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/shared/BackButton";
import { useV2Ui } from "../hooks/useV2Ui";
import { V2_UI_STORAGE_KEY } from "../utils/featureFlags";

const V2_FEATURES = [
  "Mobile-first bottom navigation",
  "POS cart drawer with inline checkout",
  "Color-coded order cards",
  "Storage stock cards on mobile",
  "Schedule view switcher (compact, week, calendar)",
];

const FeatureToggles = () => {
  const navigate = useNavigate();
  const { v2UiEnabled, setV2UiEnabled } = useV2Ui();

  useEffect(() => {
    document.title = "POS | V2 UI";
  }, []);

  return (
    <section className="bg-[#1f1f1f] min-h-screen pb-20">
      <div className="px-4 sm:px-8 pt-6">
        <div className="flex items-center gap-3 mb-8">
          <BackButton onClick={() => navigate(-1)} />
          <h1 className="text-[#f5f5f5] text-xl sm:text-2xl font-semibold">V2 UI</h1>
        </div>

        <div className="bg-[#262626] rounded-lg p-6 border border-[#343434] max-w-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[#f5f5f5] font-medium">Enable V2 UI</p>
              <p className="text-[#ababab] text-sm mt-1">
                Switch to the mobile-first POS experience
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={v2UiEnabled}
              onClick={() => setV2UiEnabled(!v2UiEnabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                v2UiEnabled ? "bg-brand" : "bg-[#343434]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  v2UiEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-[#343434]">
            <p className="text-[#f5f5f5] text-sm font-medium mb-3">V2 includes</p>
            <ul className="space-y-2">
              {V2_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-[#ababab]">
                  <span className="text-brand mt-0.5">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-xs text-[#ababab]">
            Storage key:{" "}
            <code className="text-brand bg-[#1f1f1f] px-1.5 py-0.5 rounded">
              {V2_UI_STORAGE_KEY}
            </code>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeatureToggles;
