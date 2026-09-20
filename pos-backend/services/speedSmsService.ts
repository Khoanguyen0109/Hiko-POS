import createHttpError from "http-errors";
import config from "../config/config.js";
import { toSpeedSmsPhone } from "../utils/phoneOtpUtils.js";

export interface SpeedSmsSendData {
  tranId?: number;
  totalSMS?: number;
  totalPrice?: number;
  invalidPhone?: string[];
}

export interface SpeedSmsSendResponse {
  status?: string;
  code?: string;
  message?: string;
  data?: SpeedSmsSendData;
}

export interface SpeedSmsSendRequest {
  accessToken: string;
  apiUrl: string;
  to: string[];
  content: string;
  smsType: number;
  sender: string;
}

function buildOtpContent(otp: string): string {
  return `Hiko: ma xac thuc ${otp}. Het han sau 5 phut. Khong chia se ma nay.`;
}

function basicAuthHeader(accessToken: string): string {
  return `Basic ${Buffer.from(`${accessToken}:x`).toString("base64")}`;
}

export function mapSpeedSmsError(
  code: string | undefined,
  fallbackMessage: string
): { status: number; message: string } {
  switch (code) {
    case "105":
      return { status: 400, message: "Phone number invalid" };
    case "101":
      return { status: 400, message: "Invalid or missing SpeedSMS parameters" };
    case "300":
      return { status: 503, message: "SpeedSMS account balance is not enough" };
    case "007":
      return { status: 503, message: "SpeedSMS IP is locked" };
    case "008":
      return { status: 503, message: "SpeedSMS account is blocked" };
    case "009":
      return { status: 503, message: "SpeedSMS account is not allowed to call the API" };
    default:
      return { status: 502, message: fallbackMessage };
  }
}

export async function sendSpeedSms(
  request: SpeedSmsSendRequest
): Promise<SpeedSmsSendResponse> {
  const response = await fetch(`${request.apiUrl.replace(/\/$/, "")}/sms/send`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(request.accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: request.to,
      content: request.content,
      sms_type: request.smsType,
      sender: request.sender,
    }),
  });

  let payload: SpeedSmsSendResponse = {};
  try {
    payload = (await response.json()) as SpeedSmsSendResponse;
  } catch {
    throw createHttpError(502, "SpeedSMS returned an invalid response");
  }

  return payload;
}

export class SpeedSmsService {
  static isConfigured(): boolean {
    return config.speedSmsEnabled && Boolean(config.speedSmsAccessToken);
  }

  static async sendOtp(phone10: string, otp: string): Promise<void> {
    if (config.znsOtpDryRun) {
      return;
    }

    if (!this.isConfigured()) {
      throw createHttpError(
        503,
        "SpeedSMS is not configured. Set SPEEDSMS_ACCESS_TOKEN."
      );
    }

    const phone = toSpeedSmsPhone(phone10);
    const payload = await sendSpeedSms({
      accessToken: config.speedSmsAccessToken,
      apiUrl: config.speedSmsApiUrl,
      to: [phone],
      content: buildOtpContent(otp),
      smsType: config.speedSmsType,
      sender: config.speedSmsSender,
    });

    const invalidPhones = payload.data?.invalidPhone ?? [];
    if (invalidPhones.includes(phone)) {
      throw createHttpError(400, "Phone number invalid");
    }

    if (payload.status === "success" && payload.code === "00") {
      return;
    }

    const mapped = mapSpeedSmsError(
      payload.code,
      payload.message || "Failed to send SpeedSMS OTP"
    );
    throw createHttpError(mapped.status, mapped.message);
  }
}
