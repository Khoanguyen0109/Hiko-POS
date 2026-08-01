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
