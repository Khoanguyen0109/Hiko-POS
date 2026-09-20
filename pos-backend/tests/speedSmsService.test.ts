import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  mapSpeedSmsError,
  sendSpeedSms,
} from "../services/speedSmsService.js";
import { toSpeedSmsPhone } from "../utils/phoneOtpUtils.js";

describe("toSpeedSmsPhone", () => {
  it("keeps 10-digit 09x numbers", () => {
    expect(toSpeedSmsPhone("0912345678")).toBe("0912345678");
  });

  it("rejects non-10-digit phones", () => {
    expect(() => toSpeedSmsPhone("912345678")).toThrow(/10-digit/);
  });
});

describe("mapSpeedSmsError", () => {
  it("maps invalid phone and empty balance", () => {
    expect(mapSpeedSmsError("105", "x")).toEqual({
      status: 400,
      message: "Phone number invalid",
    });
    expect(mapSpeedSmsError("300", "x")).toEqual({
      status: 503,
      message: "SpeedSMS account balance is not enough",
    });
  });

  it("falls back to 502 for unknown codes", () => {
    expect(mapSpeedSmsError("500", "Internal error")).toEqual({
      status: 502,
      message: "Internal error",
    });
  });
});

describe("sendSpeedSms", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("posts JSON with Basic auth and sms_type 4", async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ status: "success", code: "00", data: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    global.fetch = fetchMock;

    const payload = await sendSpeedSms({
      accessToken: "test-token",
      apiUrl: "https://api.speedsms.vn/index.php",
      to: ["0912345678"],
      content: "Hiko: ma xac thuc 123456",
      smsType: 4,
      sender: "Verify",
    });

    expect(payload.status).toBe("success");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.speedsms.vn/index.php/sms/send");
    expect(init?.method).toBe("POST");

    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe(
      `Basic ${Buffer.from("test-token:x").toString("base64")}`
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      to: ["0912345678"],
      content: "Hiko: ma xac thuc 123456",
      sms_type: 4,
      sender: "Verify",
    });
  });
});
