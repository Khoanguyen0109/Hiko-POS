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

/** One member row in multi-member salary range report. */
export interface SalaryMemberBlock {
  member: {
    id: unknown;
    name: unknown;
    role: unknown;
    hourlyRate: number;
  };
  summary: {
    totalShifts: number;
    regularHours: number;
    extraWorkHours: number;
    totalHours: number;
    hourlyRate: number;
    regularSalary: number;
    extraWorkPayment: number;
    totalSalary: number;
  };
}
