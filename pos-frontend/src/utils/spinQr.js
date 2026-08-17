import QRCode from "qrcode";
import hikoLogo from "../assets/images/hiko-matcha-logo.png";

export const SPIN_BASE_URL = "https://hikomatcha.vn/spin";

const QR_SIZE = 1024;
const LOGO_RATIO = 0.2;
const LOGO_PAD = 16;
const LOGO_RADIUS = 20;

export const getSpinUrl = (slug) => `${SPIN_BASE_URL}/${slug}`;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load Hiko logo"));
    image.src = src;
  });

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
};

const drawContainedImage = (ctx, image, x, y, size) => {
  const scale = Math.min(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const dx = x + (size - width) / 2;
  const dy = y + (size - height) / 2;
  ctx.drawImage(image, dx, dy, width, height);
};

const canvasToBlob = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create QR PNG"));
          return;
        }
        resolve(blob);
      },
      "image/png"
    );
  });

const triggerDownload = (blob, filename) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

export const downloadSpinQr = async (slug) => {
  if (!slug) {
    throw new Error("Campaign slug is required");
  }

  const canvas = await QRCode.toCanvas(getSpinUrl(slug), {
    errorCorrectionLevel: "H",
    width: QR_SIZE,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to draw QR code");
  }

  const logo = await loadImage(hikoLogo);
  const logoSize = QR_SIZE * LOGO_RATIO;
  const x = (canvas.width - logoSize) / 2;
  const y = (canvas.height - logoSize) / 2;

  ctx.fillStyle = "#ffffff";
  drawRoundedRect(
    ctx,
    x - LOGO_PAD,
    y - LOGO_PAD,
    logoSize + LOGO_PAD * 2,
    logoSize + LOGO_PAD * 2,
    LOGO_RADIUS
  );
  drawContainedImage(ctx, logo, x, y, logoSize);

  const blob = await canvasToBlob(canvas);
  triggerDownload(blob, `hiko-spin-${slug}.png`);
};
