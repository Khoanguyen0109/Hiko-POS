import { addDays } from "date-fns";
import { format } from "date-fns-tz";
import { parseVietnamTime, VIETNAM_TIMEZONE } from "./dateUtils.js";

export interface ShiftTemplateTimes {
  startTime: string;
  endTime: string;
}

export interface ShiftPeriod {
  periodStart: Date;
  periodEnd: Date;
}

interface OrderForPaymentAggregate {
  orderStatus: string;
  paymentMethod?: string | null;
  thirdPartyVendor?: string;
  bills?: { totalWithTax?: number };
}

export interface ShiftPaymentTotals {
  expectedCash: number;
  expectedBanking: number;
  expectedCard: number;
  orderCount: number;
}

/**
 * Build UTC period boundaries for a scheduled shift on a given calendar date (Vietnam TZ).
 */
export function getShiftPeriod(
  scheduleDate: Date,
  shiftTemplate: ShiftTemplateTimes
): ShiftPeriod {
  const dateStr = format(new Date(scheduleDate), "yyyy-MM-dd", {
    timeZone: VIETNAM_TIMEZONE,
  });

  const periodStart = parseVietnamTime(
    `${dateStr} ${shiftTemplate.startTime}`,
    "yyyy-MM-dd HH:mm"
  );

  const [startHour, startMin] = shiftTemplate.startTime.split(":").map(Number);
  const [endHour, endMin] = shiftTemplate.endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  let endDateStr = dateStr;
  if (endMinutes <= startMinutes) {
    const nextDay = addDays(parseVietnamTime(dateStr, "yyyy-MM-dd"), 1);
    endDateStr = format(nextDay, "yyyy-MM-dd", { timeZone: VIETNAM_TIMEZONE });
  }

  const periodEnd = parseVietnamTime(
    `${endDateStr} ${shiftTemplate.endTime}`,
    "yyyy-MM-dd HH:mm"
  );
  periodEnd.setSeconds(59, 999);

  return { periodStart, periodEnd };
}

/**
 * Sum payment totals from completed orders (mirrors Home.jsx rules).
 */
export function aggregateShiftPayments(
  orders: OrderForPaymentAggregate[]
): ShiftPaymentTotals {
  let expectedCash = 0;
  let expectedBanking = 0;
  let expectedCard = 0;
  let orderCount = 0;

  for (const order of orders) {
    if (order.orderStatus !== "completed") continue;

    const amount = order.bills?.totalWithTax || 0;
    orderCount += 1;

    if (order.paymentMethod === "Cash") {
      expectedCash += amount;
    } else if (order.paymentMethod === "Banking") {
      const vendor = order.thirdPartyVendor || "None";
      if (vendor === "None") {
        expectedBanking += amount;
      }
    } else if (order.paymentMethod === "Card") {
      expectedCard += amount;
    }
  }

  return { expectedCash, expectedBanking, expectedCard, orderCount };
}

/**
 * Compare counted vs expected amounts; returns balanced or mismatch.
 * For cash, `countedCash` is shift-collected cash (total in drawer minus opening check-in).
 */
export function resolveCheckoutStatus(
  expectedCash: number,
  expectedBanking: number,
  countedCash: number,
  countedBanking: number,
  toleranceVnd = 0
): "balanced" | "mismatch" {
  const cashOk = Math.abs(countedCash - expectedCash) <= toleranceVnd;
  const bankingOk = Math.abs(countedBanking - expectedBanking) <= toleranceVnd;
  return cashOk && bankingOk ? "balanced" : "mismatch";
}
