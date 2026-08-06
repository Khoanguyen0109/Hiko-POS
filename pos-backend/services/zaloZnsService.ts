import createHttpError from "http-errors";
import config from "../config/config.js";
import { toZnsPhone } from "../utils/phoneOtpUtils.js";

const ZALO_OA_TOKEN_URL = "https://oauth.zaloapp.com/v4/oa/access_token";
const ZNS_TEMPLATE_URL = "https://business.openapi.zalo.me/message/template";

interface ZaloTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: string;
  error?: number | string;
  error_name?: string;
  error_description?: string;
  message?: string;
}

interface ZnsSendResponse {
  error?: number;
  message?: string;
  data?: {
    msg_id?: string;
    sent_time?: string;
  };
}

let cachedAccessToken = config.zaloAccessToken;
let cachedRefreshToken = config.zaloRefreshToken;

function assertZaloConfigured(): void {
  if (
    !config.zaloAppId ||
    !config.zaloSecretKey ||
    !config.znsOtpTemplateId ||
    (!cachedAccessToken && !cachedRefreshToken)
  ) {
    throw createHttpError(
      503,
      "Zalo ZNS is not configured. Set ZALO_* and ZNS_OTP_* env vars."
    );
  }
}

async function refreshAccessToken(): Promise<string> {
  if (!cachedRefreshToken) {
    throw createHttpError(503, "Zalo refresh token is missing");
  }

  const body = new URLSearchParams({
    refresh_token: cachedRefreshToken,
    app_id: config.zaloAppId,
    grant_type: "refresh_token",
  });

  const response = await fetch(ZALO_OA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: config.zaloSecretKey,
    },
    body,
  });

  const payload = (await response.json()) as ZaloTokenResponse;

  if (!payload.access_token) {
    const detail =
      payload.error_description ||
      payload.message ||
      payload.error_name ||
      "Unknown error";
    throw createHttpError(502, `Failed to refresh Zalo access token: ${detail}`);
  }

  cachedAccessToken = payload.access_token;
  if (payload.refresh_token) {
    cachedRefreshToken = payload.refresh_token;
  }

  return cachedAccessToken;
}

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  return refreshAccessToken();
}

async function sendTemplateOnce(
  accessToken: string,
  phone84: string,
  otp: string
): Promise<ZnsSendResponse> {
  const templateData: Record<string, string> = {
    [config.znsOtpParamName]: otp,
  };

  const response = await fetch(ZNS_TEMPLATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: accessToken,
    },
    body: JSON.stringify({
      phone: phone84,
      template_id: config.znsOtpTemplateId,
      template_data: templateData,
      tracking_id: `otp-${phone84}-${Date.now()}`,
    }),
  });

  return (await response.json()) as ZnsSendResponse;
}

export class ZaloZnsService {
  /** Exposed for tests / ops inspection (never log tokens). */
  static getCachedTokenState(): { hasAccess: boolean; hasRefresh: boolean } {
    return {
      hasAccess: Boolean(cachedAccessToken),
      hasRefresh: Boolean(cachedRefreshToken),
    };
  }

  static resetCachedTokensForTests(): void {
    cachedAccessToken = config.zaloAccessToken;
    cachedRefreshToken = config.zaloRefreshToken;
  }

  static async sendOtp(phone10: string, otp: string): Promise<void> {
    if (config.znsOtpDryRun) {
      return;
    }

    assertZaloConfigured();
    const phone84 = toZnsPhone(phone10);
    let accessToken = await getAccessToken();
    let result = await sendTemplateOnce(accessToken, phone84, otp);

    // Auth-ish failures: refresh once and retry
    if (result.error && result.error !== 0) {
      const message = (result.message || "").toLowerCase();
      const maybeAuth =
        result.error === -124 ||
        result.error === -216 ||
        message.includes("access token") ||
        message.includes("expired") ||
        message.includes("invalid token");

      if (maybeAuth && cachedRefreshToken) {
        accessToken = await refreshAccessToken();
        result = await sendTemplateOnce(accessToken, phone84, otp);
      }
    }

    if (result.error && result.error !== 0) {
      throw createHttpError(
        502,
        result.message || "Failed to send ZNS OTP"
      );
    }
  }
}
