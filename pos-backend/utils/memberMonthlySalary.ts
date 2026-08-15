import type {
  AssignedStoreInfo,
  MemberMonthlySalarySummary,
  MemberSalaryExtraWorkDetail,
  MemberSalaryShiftDetail,
  MemberStoreSalaryBlock
} from "../types/salary.js";

const VALID_STATUSES = ["scheduled", "confirmed", "completed"];

type MemberLike = {
  _id: unknown;
  name: unknown;
  role: unknown;
  salary?: number;
};

type ScheduleLike = {
  store: unknown;
  date: Date | string;
  shiftTemplate?: {
    name?: string;
    startTime?: string;
    endTime?: string;
    durationHours?: number;
    color?: string;
  } | null;
  assignedMembers?: Array<{ member: unknown; status?: string }>;
};

type ExtraWorkLike = {
  store: unknown;
  date: Date | string;
  durationHours?: number;
  workType?: string;
  description?: string;
  hourlyRate?: number;
  paymentAmount?: number;
  isApproved?: boolean;
  isPaid?: boolean;
};

type TicketLike = {
  store: unknown;
  score?: number;
};

export type BuildMemberMonthlySalaryInput = {
  member: MemberLike;
  year: number;
  month: number;
  assignedStores: AssignedStoreInfo[];
  schedules: ScheduleLike[];
  extraWork: ExtraWorkLike[];
  tickets: TicketLike[];
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function idOf(value: unknown): string {
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

type StoreAcc = {
  totalShifts: number;
  regularHours: number;
  extraWorkHours: number;
  extraWorkPayment: number;
  totalTickets: number;
  totalTicketScore: number;
};

function emptyAcc(): StoreAcc {
  return {
    totalShifts: 0,
    regularHours: 0,
    extraWorkHours: 0,
    extraWorkPayment: 0,
    totalTickets: 0,
    totalTicketScore: 0
  };
}

function toSummary(acc: StoreAcc, hourlyRate: number): MemberMonthlySalarySummary {
  const regularSalary = acc.regularHours * hourlyRate;
  return {
    totalShifts: acc.totalShifts,
    regularHours: roundMoney(acc.regularHours),
    extraWorkHours: roundMoney(acc.extraWorkHours),
    totalHours: roundMoney(acc.regularHours + acc.extraWorkHours),
    hourlyRate,
    regularSalary: roundMoney(regularSalary),
    extraWorkPayment: roundMoney(acc.extraWorkPayment),
    totalSalary: roundMoney(regularSalary + acc.extraWorkPayment),
    totalTickets: acc.totalTickets,
    totalTicketScore: acc.totalTicketScore
  };
}

export function buildMemberMonthlySalary(input: BuildMemberMonthlySalaryInput) {
  const { member, year, month, assignedStores, schedules, extraWork, tickets } = input;
  const hourlyRate = member.salary || 0;
  const memberId = String(member._id);
  const storeById = new Map(assignedStores.map((store) => [store.id, store]));
  const perStore = new Map<string, StoreAcc>(
    assignedStores.map((store) => [store.id, emptyAcc()])
  );

  const shifts: MemberSalaryShiftDetail[] = [];
  for (const schedule of schedules) {
    const storeId = idOf(schedule.store);
    const acc = perStore.get(storeId);
    if (!acc) {
      continue;
    }

    const memberAssignment = (schedule.assignedMembers || []).find((assignment) => {
      return idOf(assignment.member) === memberId;
    });

    if (
      !memberAssignment ||
      !schedule.shiftTemplate ||
      !VALID_STATUSES.includes(memberAssignment.status || "")
    ) {
      continue;
    }

    const hours = schedule.shiftTemplate.durationHours || 0;
    acc.totalShifts += 1;
    acc.regularHours += hours;
    shifts.push({
      date: schedule.date,
      shiftName: schedule.shiftTemplate.name || "",
      startTime: schedule.shiftTemplate.startTime || "",
      endTime: schedule.shiftTemplate.endTime || "",
      hours,
      status: memberAssignment.status || "",
      color: schedule.shiftTemplate.color,
      storeId,
      storeName: storeById.get(storeId)?.name || ""
    });
  }

  const extraWorkDetails: MemberSalaryExtraWorkDetail[] = [];
  for (const entry of extraWork) {
    const storeId = idOf(entry.store);
    const acc = perStore.get(storeId);
    if (!acc) {
      continue;
    }

    acc.extraWorkHours += entry.durationHours || 0;
    acc.extraWorkPayment += entry.paymentAmount || 0;
    extraWorkDetails.push({
      date: entry.date,
      durationHours: entry.durationHours || 0,
      workType: entry.workType || "",
      description: entry.description || "",
      hourlyRate: entry.hourlyRate || 0,
      paymentAmount: entry.paymentAmount || 0,
      isApproved: Boolean(entry.isApproved),
      isPaid: Boolean(entry.isPaid),
      storeId,
      storeName: storeById.get(storeId)?.name || ""
    });
  }

  for (const ticket of tickets) {
    const storeId = idOf(ticket.store);
    const acc = perStore.get(storeId);
    if (!acc) {
      continue;
    }
    acc.totalTickets += 1;
    acc.totalTicketScore += ticket.score || 0;
  }

  const storeBlocks: MemberStoreSalaryBlock[] = assignedStores.map((store) => ({
    store,
    summary: toSummary(perStore.get(store.id) || emptyAcc(), hourlyRate)
  }));

  const combined: MemberMonthlySalarySummary = {
    totalShifts: 0,
    regularHours: 0,
    extraWorkHours: 0,
    totalHours: 0,
    hourlyRate,
    regularSalary: 0,
    extraWorkPayment: 0,
    totalSalary: 0,
    totalTickets: 0,
    totalTicketScore: 0
  };

  for (const block of storeBlocks) {
    combined.totalShifts += block.summary.totalShifts;
    combined.regularHours += block.summary.regularHours;
    combined.extraWorkHours += block.summary.extraWorkHours;
    combined.totalHours += block.summary.totalHours;
    combined.regularSalary += block.summary.regularSalary;
    combined.extraWorkPayment += block.summary.extraWorkPayment;
    combined.totalSalary += block.summary.totalSalary;
    combined.totalTickets += block.summary.totalTickets;
    combined.totalTicketScore += block.summary.totalTicketScore;
  }

  return {
    member: {
      id: member._id,
      name: member.name,
      role: member.role,
      hourlyRate
    },
    period: {
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleString("en-US", { month: "long" })
    },
    summary: {
      totalShifts: combined.totalShifts,
      regularHours: roundMoney(combined.regularHours),
      extraWorkHours: roundMoney(combined.extraWorkHours),
      totalHours: roundMoney(combined.totalHours),
      hourlyRate,
      regularSalary: roundMoney(combined.regularSalary),
      extraWorkPayment: roundMoney(combined.extraWorkPayment),
      totalSalary: roundMoney(combined.totalSalary),
      totalTickets: combined.totalTickets,
      totalTicketScore: combined.totalTicketScore
    },
    stores: storeBlocks,
    shifts,
    extraWork: extraWorkDetails
  };
}
