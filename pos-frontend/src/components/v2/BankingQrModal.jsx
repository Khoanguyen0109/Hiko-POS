import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { MdClose } from "react-icons/md";
import { formatVND } from "../../utils";

const DEFAULT_QR_SRC = "/bank-qr.png";

const BankingQrModal = ({ isOpen, onClose, amount, qrSrc = DEFAULT_QR_SRC }) => {
  const [imageSrc, setImageSrc] = useState(qrSrc || DEFAULT_QR_SRC);

  useEffect(() => {
    setImageSrc(qrSrc || DEFAULT_QR_SRC);
  }, [qrSrc]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close banking payment"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="banking-qr-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[#343434] bg-[#1a1a1a] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#343434] px-4 py-3">
          <h2 id="banking-qr-title" className="text-base font-semibold text-[#f5f5f5]">
            Banking payment
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-[#ababab] hover:bg-[#262626] hover:text-[#f5f5f5]"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <p className="text-xs text-[#ababab]">Amount to transfer</p>
          <p className="mt-1 text-2xl font-bold text-brand">{formatVND(amount)}</p>
          <div className="mt-4 overflow-hidden rounded-xl border border-[#343434] bg-white p-2">
            <img
              src={imageSrc}
              alt="Bank transfer QR code"
              className="mx-auto max-h-[min(60dvh,480px)] w-full object-contain"
              onError={() => {
                if (imageSrc !== DEFAULT_QR_SRC) {
                  setImageSrc(DEFAULT_QR_SRC);
                }
              }}
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-[#343434] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#262626] text-sm font-semibold text-[#f5f5f5] transition-colors hover:bg-[#343434]"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

BankingQrModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  amount: PropTypes.number.isRequired,
  qrSrc: PropTypes.string,
};

export default BankingQrModal;
