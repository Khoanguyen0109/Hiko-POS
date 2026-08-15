/** Period metadata returned by salary reporting endpoints. */
export interface SalaryPeriodInfo {
  startDate: Date;
  endDate: Date;
  startDateString: string;
  endDateString: string;
  year?: number;
  month?: number;
  monthName?: string;
}

/** Salary totals for one member in a period. */
export interface SalaryMemberSummary {
  totalShifts: number;
  regularHours: number;
  extraWorkHours: number;
  totalHours: number;
  hourlyRate: number;
  regularSalary: number;
  extraWorkPayment: number;
  totalSalary: number;
}

/** Ticket totals for one member in a period. */
export interface SalaryMemberTickets {
  count: number;
  totalScore: number;
}

/** One member row in multi-member salary range report. */
export interface SalaryMemberBlock {
  member: {
    id: unknown;
    name: unknown;
    role: unknown;
    hourlyRate: number;
  };
  summary: SalaryMemberSummary;
  tickets?: SalaryMemberTickets;
}

/** Store-level salary summary block. */
export interface SalaryStoreBlock {
  store: {
    id: unknown;
    name: unknown;
    code: unknown;
  };
  summary: {
    totalMembers: number;
    totalRegularHours: number;
    totalExtraWorkHours: number;
    totalHours: number;
    totalRegularSalary: number;
    totalExtraWorkPayment: number;
    totalSalary: number;
    totalTickets: number;
  };
  members: SalaryMemberBlock[];
}

/** Pivoted member row for salary dashboard (one row per member, stores as columns). */
export interface SalaryMemberPivotRow {
  member: {
    id: unknown;
    name: unknown;
    role: unknown;
    hourlyRate: number;
  };
  storeSalaries: Record<string, number>;
  storeTickets: Record<string, number>;
  totalHours: number;
  totalTickets: number;
  totalTicketScore: number;
  totalSalary: number;
}

/** Store identity used on the member monthly salary payload. */
export interface AssignedStoreInfo {
  id: string;
  name: string;
  code: string;
}

/** Combined month totals for the logged-in member across assigned stores. */
export interface MemberMonthlySalarySummary {
  totalShifts: number;
  regularHours: number;
  extraWorkHours: number;
  totalHours: number;
  hourlyRate: number;
  regularSalary: number;
  extraWorkPayment: number;
  totalSalary: number;
  totalTickets: number;
  totalTicketScore: number;
}

/** One assigned store row on the member monthly salary payload. */
export interface MemberStoreSalaryBlock {
  store: AssignedStoreInfo;
  summary: MemberMonthlySalarySummary;
}

/** One shift row on the member monthly salary payload. */
export interface MemberSalaryShiftDetail {
  date: Date | string;
  shiftName: string;
  startTime: string;
  endTime: string;
  hours: number;
  status: string;
  color?: string;
  storeId: string;
  storeName: string;
}

/** One extra work row on the member monthly salary payload. */
export interface MemberSalaryExtraWorkDetail {
  date: Date | string;
  durationHours: number;
  workType: string;
  description: string;
  hourlyRate: number;
  paymentAmount: number;
  isApproved: boolean;
  isPaid: boolean;
  storeId: string;
  storeName: string;
}
