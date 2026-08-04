import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  MdCheckCircle,
  MdErrorOutline,
  MdQrCodeScanner,
  MdRefresh,
  MdSearch,
} from "react-icons/md";
import FeaturePageHeader from "../components/shared/FeaturePageHeader";
import { validateVoucher, redeemVoucher } from "../https";
import { ROUTES } from "../constants";

const SCANNER_ELEMENT_ID = "redeem-reward-qr-reader";

const STATUS_LABELS = {
  active: "Active",
  redeemed: "Already redeemed",
  expired: "Expired",
};

const statusBadgeClass = (status, valid) => {
  if (valid) return "bg-emerald-500/15 text-emerald-400";
  if (status === "redeemed") return "bg-amber-500/15 text-amber-400";
  return "bg-red-500/15 text-red-400";
};

const rewardTypeLabel = (rewardType, discountPercent, freeDish) => {
  if (rewardType === "percentage_discount") {
    return `${discountPercent ?? 0}% discount`;
  }
  if (rewardType === "free_product") {
    return freeDish?.name ? `Free: ${freeDish.name}` : "Free product";
  }
  return rewardType;
};

const extractErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

const PreviewCard = ({ preview, onConfirm, onCancel, isRedeeming }) => {
  const canRedeem = preview.valid && preview.status === "active";

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-[#343434] bg-[#262626] p-5 shadow-lg">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6a6a6a]">
            Voucher preview
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#f5f5f5]">
            {preview.rewardLabel}
          </h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(
            preview.status,
            preview.valid
          )}`}
        >
          {STATUS_LABELS[preview.status] || preview.status}
        </span>
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-[#343434] pb-3">
          <dt className="text-[#ababab]">Reward type</dt>
          <dd className="text-right text-[#f5f5f5]">
            {rewardTypeLabel(
              preview.rewardType,
              preview.discountPercent,
              preview.freeDish
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-[#343434] pb-3">
          <dt className="text-[#ababab]">Voucher code</dt>
          <dd className="font-mono text-[#f5f5f5]">{preview.voucherCode}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-[#343434] pb-3">
          <dt className="text-[#ababab]">Customer phone</dt>
          <dd className="text-[#f5f5f5]">{preview.phoneMasked || "—"}</dd>
        </div>
        {preview.campaignName ? (
          <div className="flex justify-between gap-4 border-b border-[#343434] pb-3">
            <dt className="text-[#ababab]">Campaign</dt>
            <dd className="text-right text-[#f5f5f5]">{preview.campaignName}</dd>
          </div>
        ) : null}
        {preview.expiresAt ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[#ababab]">Expires</dt>
            <dd className="text-[#f5f5f5]">
              {new Date(preview.expiresAt).toLocaleDateString()}
            </dd>
          </div>
        ) : null}
      </dl>

      {!canRedeem ? (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          This voucher cannot be redeemed.
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={isRedeeming}
          className="flex-1 rounded-lg border border-[#343434] px-4 py-2.5 text-sm font-medium text-[#ababab] transition-colors hover:bg-[#1a1a1a] hover:text-[#f5f5f5] disabled:opacity-50"
        >
          Scan another
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canRedeem || isRedeeming}
          className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-[#f5f5f5] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRedeeming ? "Redeeming…" : "Confirm redeem"}
        </button>
      </div>
    </div>
  );
};

PreviewCard.propTypes = {
  preview: PropTypes.shape({
    valid: PropTypes.bool.isRequired,
    status: PropTypes.string.isRequired,
    rewardLabel: PropTypes.string.isRequired,
    rewardType: PropTypes.string.isRequired,
    discountPercent: PropTypes.number,
    freeDish: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      price: PropTypes.number,
    }),
    voucherCode: PropTypes.string.isRequired,
    phoneMasked: PropTypes.string,
    expiresAt: PropTypes.string,
    campaignName: PropTypes.string,
  }).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isRedeeming: PropTypes.bool.isRequired,
};

const RedeemReward = () => {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const isProcessingScanRef = useRef(false);

  const [viewState, setViewState] = useState("scanning");
  const [preview, setPreview] = useState(null);
  const [qrToken, setQrToken] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // Scanner may already be stopped.
    } finally {
      scannerRef.current = null;
    }
  }, []);

  const handleValidate = useCallback(async (token) => {
    const trimmed = token.trim();
    if (!trimmed) {
      setErrorMessage("Enter a QR token or voucher code.");
      setViewState("error");
      return;
    }

    setIsValidating(true);
    setErrorMessage("");

    try {
      const { data } = await validateVoucher(trimmed);
      setQrToken(trimmed);
      setPreview(data.data);
      setViewState("preview");
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setViewState("error");
    } finally {
      setIsValidating(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError("");

    try {
      await stopScanner();

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (isProcessingScanRef.current) return;
          isProcessingScanRef.current = true;

          try {
            await stopScanner();
            await handleValidate(decodedText.trim());
          } finally {
            isProcessingScanRef.current = false;
          }
        },
        undefined
      );
    } catch (error) {
      setCameraError(
        error?.message ||
          "Unable to access camera. Use manual entry below or check permissions."
      );
    }
  }, [stopScanner, handleValidate]);

  const handleManualSubmit = (event) => {
    event.preventDefault();
    void handleValidate(manualCode);
  };

  const handleConfirmRedeem = async () => {
    if (!qrToken || !preview?.valid) return;

    setIsRedeeming(true);
    setErrorMessage("");

    try {
      const { data } = await redeemVoucher(qrToken);
      setSuccessData(data.data);
      setViewState("success");
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setViewState("error");
    } finally {
      setIsRedeeming(false);
    }
  };

  const resetToScanning = useCallback(async () => {
    setPreview(null);
    setQrToken("");
    setManualCode("");
    setErrorMessage("");
    setSuccessData(null);
    setViewState("scanning");
  }, []);

  useEffect(() => {
    if (viewState !== "scanning") {
      void stopScanner();
      return undefined;
    }

    void startScanner();

    return () => {
      void stopScanner();
    };
  }, [viewState, startScanner, stopScanner]);

  return (
    <div className="min-h-screen bg-[#141414] pb-8">
      <FeaturePageHeader
        title="Redeem Reward"
        onBack={() => navigate(ROUTES.ROOT)}
      />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {viewState === "scanning" ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#343434] bg-[#1a1a1a] p-4">
              <div className="mb-3 flex items-center gap-2 text-[#f5f5f5]">
                <MdQrCodeScanner size={20} className="text-brand" />
                <h2 className="text-sm font-medium">Scan customer QR code</h2>
              </div>

              <div
                id={SCANNER_ELEMENT_ID}
                className="overflow-hidden rounded-lg border border-[#343434] bg-black [&_video]:rounded-lg"
              />

              {cameraError ? (
                <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                  {cameraError}
                </p>
              ) : null}

              {isValidating ? (
                <p className="mt-3 text-center text-sm text-[#ababab]">
                  Validating voucher…
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-[#343434] bg-[#1a1a1a] p-4">
              <p className="mb-3 text-sm font-medium text-[#f5f5f5]">
                Manual entry
              </p>
              <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(event) => setManualCode(event.target.value)}
                  placeholder="QR token or voucher code"
                  className="flex-1 rounded-lg border border-[#343434] bg-[#262626] px-3 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#6a6a6a] outline-none focus:border-brand"
                />
                <button
                  type="submit"
                  disabled={isValidating || !manualCode.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-[#f5f5f5] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <MdSearch size={18} />
                  Look up
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {viewState === "preview" && preview ? (
          <PreviewCard
            preview={preview}
            onConfirm={handleConfirmRedeem}
            onCancel={resetToScanning}
            isRedeeming={isRedeeming}
          />
        ) : null}

        {viewState === "success" && successData ? (
          <div className="mx-auto w-full max-w-md rounded-xl border border-emerald-500/30 bg-[#262626] p-6 text-center">
            <MdCheckCircle size={56} className="mx-auto text-emerald-400" />
            <h2 className="mt-4 text-xl font-semibold text-[#f5f5f5]">
              Voucher redeemed
            </h2>
            <p className="mt-2 text-sm text-[#ababab]">
              {successData.rewardLabel}
            </p>
            <p className="mt-1 font-mono text-sm text-brand">
              {successData.voucherCode}
            </p>
            <button
              type="button"
              onClick={resetToScanning}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-[#f5f5f5] transition-opacity hover:opacity-90"
            >
              <MdRefresh size={18} />
              Scan next voucher
            </button>
          </div>
        ) : null}

        {viewState === "error" ? (
          <div className="mx-auto w-full max-w-md rounded-xl border border-red-500/30 bg-[#262626] p-6 text-center">
            <MdErrorOutline size={56} className="mx-auto text-red-400" />
            <h2 className="mt-4 text-xl font-semibold text-[#f5f5f5]">
              Unable to proceed
            </h2>
            <p className="mt-2 text-sm text-[#ababab]">{errorMessage}</p>
            <button
              type="button"
              onClick={resetToScanning}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#343434] px-5 py-2.5 text-sm font-medium text-[#f5f5f5] transition-colors hover:bg-[#1a1a1a]"
            >
              <MdRefresh size={18} />
              Try again
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default RedeemReward;
