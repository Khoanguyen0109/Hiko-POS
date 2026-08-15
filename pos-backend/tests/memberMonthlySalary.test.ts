import { describe, expect, it } from "@jest/globals";
import { buildMemberMonthlySalary } from "../utils/memberMonthlySalary.js";

const stores = [
  { id: "s1", name: "Store One", code: "S1" },
  { id: "s2", name: "Store Two", code: "S2" }
];

const member = { _id: "m1", name: "Ada", role: "User", salary: 10 };

const morning = {
  name: "Morning",
  startTime: "08:00",
  endTime: "16:00",
  durationHours: 8,
  color: "#4ECDC4"
};

describe("buildMemberMonthlySalary", () => {
  it("sums two stores and keeps a zero-activity store", () => {
    const result = buildMemberMonthlySalary({
      member,
      year: 2026,
      month: 8,
      assignedStores: stores,
      schedules: [
        {
          store: "s1",
          date: new Date("2026-08-02"),
          shiftTemplate: morning,
          assignedMembers: [{ member: "m1", status: "completed" }]
        }
      ],
      extraWork: [
        {
          store: "s1",
          date: new Date("2026-08-03"),
          durationHours: 2,
          workType: "overtime",
          description: "Close",
          hourlyRate: 10,
          paymentAmount: 20,
          isApproved: true,
          isPaid: false
        }
      ],
      tickets: [
        { store: "s1", score: 5 },
        { store: "s2", score: 3 }
      ]
    });

    expect(result.summary.totalShifts).toBe(1);
    expect(result.summary.regularHours).toBe(8);
    expect(result.summary.extraWorkHours).toBe(2);
    expect(result.summary.totalHours).toBe(10);
    expect(result.summary.regularSalary).toBe(80);
    expect(result.summary.extraWorkPayment).toBe(20);
    expect(result.summary.totalSalary).toBe(100);
    expect(result.summary.totalTickets).toBe(2);
    expect(result.summary.totalTicketScore).toBe(8);

    expect(result.stores).toHaveLength(2);
    expect(result.stores[0].store.name).toBe("Store One");
    expect(result.stores[0].summary.totalSalary).toBe(100);
    expect(result.stores[0].summary.totalTickets).toBe(1);
    expect(result.stores[0].summary.totalTicketScore).toBe(5);
    expect(result.stores[1].summary.totalSalary).toBe(0);
    expect(result.stores[1].summary.totalTickets).toBe(1);
    expect(result.stores[1].summary.totalTicketScore).toBe(3);

    expect(result.summary.totalSalary).toBe(
      result.stores[0].summary.totalSalary + result.stores[1].summary.totalSalary
    );
    expect(result.summary.totalTicketScore).toBe(
      result.stores[0].summary.totalTicketScore + result.stores[1].summary.totalTicketScore
    );

    expect(result.shifts[0].storeName).toBe("Store One");
    expect(result.extraWork[0].storeName).toBe("Store One");
  });

  it("ignores absent shifts and tickets at stores the member is not assigned to", () => {
    const result = buildMemberMonthlySalary({
      member,
      year: 2026,
      month: 8,
      assignedStores: [stores[0]],
      schedules: [
        {
          store: "s1",
          date: new Date("2026-08-02"),
          shiftTemplate: morning,
          assignedMembers: [{ member: "m1", status: "absent" }]
        }
      ],
      extraWork: [],
      tickets: [{ store: "s9", score: 99 }]
    });

    expect(result.summary.totalShifts).toBe(0);
    expect(result.summary.totalSalary).toBe(0);
    expect(result.summary.totalTickets).toBe(0);
    expect(result.summary.totalTicketScore).toBe(0);
    expect(result.shifts).toEqual([]);
  });

  it("returns empty lists and zero totals when there are no assigned stores", () => {
    const result = buildMemberMonthlySalary({
      member,
      year: 2026,
      month: 8,
      assignedStores: [],
      schedules: [],
      extraWork: [],
      tickets: []
    });

    expect(result.stores).toEqual([]);
    expect(result.shifts).toEqual([]);
    expect(result.extraWork).toEqual([]);
    expect(result.summary.totalSalary).toBe(0);
    expect(result.summary.totalTickets).toBe(0);
    expect(result.period.monthName).toBe("August");
  });
});
