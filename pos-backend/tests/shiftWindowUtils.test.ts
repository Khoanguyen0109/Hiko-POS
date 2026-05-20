// @ts-nocheck
import { describe, it, expect } from "@jest/globals";
import {
  aggregateShiftPayments,
  getShiftPeriod,
  resolveCheckoutStatus,
} from "../utils/shiftWindowUtils.js";
import { parseVietnamTime } from "../utils/dateUtils.js";

describe("getShiftPeriod", () => {
  it("returns same-day period for morning shift", () => {
    const scheduleDate = parseVietnamTime("2026-05-20", "yyyy-MM-dd");
    const { periodStart, periodEnd } = getShiftPeriod(scheduleDate, {
      startTime: "07:00",
      endTime: "12:30",
    });

    expect(periodStart).toBeInstanceOf(Date);
    expect(periodEnd.getTime()).toBeGreaterThan(periodStart.getTime());
  });

  it("extends end to next calendar day for overnight shift", () => {
    const scheduleDate = parseVietnamTime("2026-05-20", "yyyy-MM-dd");
    const { periodStart, periodEnd } = getShiftPeriod(scheduleDate, {
      startTime: "22:00",
      endTime: "06:00",
    });

    expect(periodEnd.getTime()).toBeGreaterThan(periodStart.getTime());
    const hoursSpan =
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
    expect(hoursSpan).toBeGreaterThan(6);
    expect(hoursSpan).toBeLessThanOrEqual(9);
  });
});

describe("aggregateShiftPayments", () => {
  it("sums cash and banking excluding third-party banking", () => {
    const totals = aggregateShiftPayments([
      {
        orderStatus: "completed",
        paymentMethod: "Cash",
        bills: { totalWithTax: 100000 },
      },
      {
        orderStatus: "completed",
        paymentMethod: "Banking",
        thirdPartyVendor: "None",
        bills: { totalWithTax: 50000 },
      },
      {
        orderStatus: "completed",
        paymentMethod: "Banking",
        thirdPartyVendor: "Grab",
        bills: { totalWithTax: 30000 },
      },
      {
        orderStatus: "progress",
        paymentMethod: "Cash",
        bills: { totalWithTax: 99999 },
      },
    ]);

    expect(totals.expectedCash).toBe(100000);
    expect(totals.expectedBanking).toBe(50000);
    expect(totals.orderCount).toBe(3);
  });
});

describe("resolveCheckoutStatus", () => {
  it("returns balanced when within tolerance", () => {
    expect(resolveCheckoutStatus(100, 50, 100, 50, 0)).toBe("balanced");
  });

  it("returns mismatch when cash differs", () => {
    expect(resolveCheckoutStatus(100, 50, 99, 50, 0)).toBe("mismatch");
  });
});
