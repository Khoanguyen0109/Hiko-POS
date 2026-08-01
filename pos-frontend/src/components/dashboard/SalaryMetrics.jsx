import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSalarySummary } from '../../redux/slices/salarySlice';
import { 
  MdPeople as PeopleIcon, 
  MdAttachMoney as MoneyIcon,
  MdAccessTime as TimeIcon,
  MdTrendingUp as TrendingUpIcon,
  MdWork as WorkIcon,
  MdConfirmationNumber as TicketIcon
} from 'react-icons/md';

const SalaryMetrics = ({ dateFilter, customDateRange }) => {
  const dispatch = useDispatch();
  const { summaryData, loading, error } = useSelector(state => state.salary);
  
  // Prepare API parameters based on date filter
  const getApiParams = () => {
    const params = {};
    
    if (dateFilter === "custom" && customDateRange.startDate && customDateRange.endDate) {
      // Use explicit date range for custom filter
      params.startDate = customDateRange.startDate;
      params.endDate = customDateRange.endDate;
    } else if (dateFilter !== "custom") {
      // Use period-based filtering (today, week, month)
      params.period = dateFilter;
    } else {
      // Fallback to current month if custom range is incomplete
      params.period = "month";
    }
    
    return params;
  };

  useEffect(() => {
    const params = getApiParams();
    dispatch(fetchSalarySummary(params));
  }, [dispatch, dateFilter, customDateRange]);

  const stores = summaryData?.stores;
  const membersSummary = summaryData?.membersSummary;

  const storeColumns = useMemo(
    () => (stores || []).map((block) => block.store),
    [stores]
  );

  const memberRows = useMemo(() => {
    if (membersSummary?.length) {
      return [...membersSummary].sort((a, b) => b.totalSalary - a.totalSalary);
    }

    const memberMap = new Map();

    for (const storeBlock of stores || []) {
      const storeId = String(storeBlock.store?.id);

      for (const entry of storeBlock.members || []) {
        const memberId = String(entry.member?.id);
        if (!memberId) continue;

        if (!memberMap.has(memberId)) {
          memberMap.set(memberId, {
            member: entry.member,
            storeSalaries: {},
            totalHours: 0,
            totalTickets: 0,
            totalTicketScore: 0,
            totalSalary: 0,
          });
        }

        const row = memberMap.get(memberId);
        row.storeSalaries[storeId] = entry.summary?.totalSalary || 0;
        row.totalHours += entry.summary?.totalHours || 0;
        row.totalTickets += entry.tickets?.count || 0;
        row.totalTicketScore += entry.tickets?.totalScore || 0;
        row.totalSalary += entry.summary?.totalSalary || 0;
      }
    }

    return [...memberMap.values()].sort(
      (a, b) => b.totalSalary - a.totalSalary
    );
  }, [stores, membersSummary]);

  const emptyColSpan = 1 + storeColumns.length + 3;

  // Format currency (no dollar sign, as per previous requirements)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format hours
  const formatHours = (hours) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(hours || 0);
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          <span className="ml-2 text-[#ababab]">Loading salary summary...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-6">
        <div className="text-center py-8">
          <MoneyIcon size={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#f5f5f5] mb-2">Error loading salary data</h3>
          <p className="text-[#ababab]">{error}</p>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-6">
        <div className="text-center py-8">
          <MoneyIcon size={48} className="text-[#ababab] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#f5f5f5] mb-2">No salary data</h3>
          <p className="text-[#ababab]">Salary summary will appear here once you have member schedules and extra work entries.</p>
        </div>
      </div>
    );
  }

  const { period, overallSummary } = summaryData;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MoneyIcon size={24} className="text-brand" />
          <div>
            <h2 className="text-xl font-semibold text-[#f5f5f5]">Salary Summary</h2>
            <p className="text-sm text-[#ababab]">
              All stores ·{' '}
              {period?.monthName && period?.year 
                ? `${period.monthName} ${period.year}`
                : period?.startDateString && period?.endDateString
                ? `${period.startDateString} to ${period.endDateString}`
                : 'Current Period'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Total Members */}
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <PeopleIcon className="text-xl sm:text-2xl text-[#4ECDC4]" />
            <span className="text-[#ababab] text-xs sm:text-sm">Total</span>
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
            {overallSummary?.totalMembers || 0}
          </h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Active Members</p>
        </div>

        {/* Total Hours */}
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <TimeIcon className="text-xl sm:text-2xl text-[#10B981]" />
            <span className="text-[#ababab] text-xs sm:text-sm">Total</span>
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
            {formatHours(overallSummary?.totalHours || 0)}
          </h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Hours Worked</p>
        </div>

        {/* Total Salary */}
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <MoneyIcon className="text-xl sm:text-2xl text-brand" />
            <span className="text-[#ababab] text-xs sm:text-sm">Total</span>
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-brand mb-1">
            {formatCurrency(overallSummary?.totalSalary || 0)}
          </h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Total Salary</p>
        </div>

        {/* Average Salary */}
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <TrendingUpIcon className="text-xl sm:text-2xl text-[#8B5CF6]" />
            <span className="text-[#ababab] text-xs sm:text-sm">Average</span>
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
            {overallSummary?.totalMembers > 0 
              ? formatCurrency((overallSummary?.totalSalary || 0) / overallSummary.totalMembers)
              : '0'
            }
          </h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Per Member</p>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Regular Hours */}
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
          <div className="flex items-center gap-2 mb-2">
            <WorkIcon className="text-lg text-[#4ECDC4]" />
            <h4 className="text-sm font-medium text-[#f5f5f5]">Regular Hours</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#f5f5f5] mb-1">
            {formatHours(overallSummary?.totalRegularHours || 0)}
          </p>
          <p className="text-xs text-[#ababab]">
            Regular Salary: {formatCurrency(overallSummary?.totalRegularSalary || 0)}
          </p>
        </div>

        {/* Extra Work Hours */}
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
          <div className="flex items-center gap-2 mb-2">
            <TimeIcon className="text-lg text-brand" />
            <h4 className="text-sm font-medium text-[#f5f5f5]">Extra Work Hours</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#f5f5f5] mb-1">
            {formatHours(overallSummary?.totalExtraWorkHours || 0)}
          </p>
          <p className="text-xs text-[#ababab]">
            Extra Payment: {formatCurrency(overallSummary?.totalExtraWorkPayment || 0)}
          </p>
        </div>

        {/* Total Hours Breakdown */}
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUpIcon className="text-lg text-[#10B981]" />
            <h4 className="text-sm font-medium text-[#f5f5f5]">Total Hours</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#f5f5f5] mb-1">
            {formatHours(overallSummary?.totalHours || 0)}
          </p>
          <p className="text-xs text-[#ababab]">
            Combined regular + extra work
          </p>
        </div>

        {/* Total Tickets */}
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
          <div className="flex items-center gap-2 mb-2">
            <TicketIcon className="text-lg text-[#8B5CF6]" />
            <h4 className="text-sm font-medium text-[#f5f5f5]">Total Tickets</h4>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#f5f5f5] mb-1">
            {overallSummary?.totalTickets || 0}
          </p>
          <p className="text-xs text-[#ababab]">
            Member tickets in selected period
          </p>
        </div>
      </div>

      {/* Member Breakdown */}
      <div className="bg-[#262626] rounded-lg border border-[#343434]">
        <div className="p-4 sm:p-5 lg:p-6 border-b border-[#343434]">
          <h3 className="text-lg font-semibold text-[#f5f5f5]">Member Breakdown</h3>
          <p className="text-sm text-[#ababab] mt-1">
            One row per member — store columns show salary per location
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-[#ababab] uppercase tracking-wider sticky left-0 bg-[#1a1a1a] z-10">
                  Member
                </th>
                {storeColumns.map((store) => (
                  <th
                    key={store.id}
                    className="px-4 py-3 text-right text-xs sm:text-sm font-medium text-[#ababab] uppercase tracking-wider whitespace-nowrap"
                    title={store.name}
                  >
                    {store.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs sm:text-sm font-medium text-[#ababab] uppercase tracking-wider whitespace-nowrap">
                  Total Hours
                </th>
                <th className="px-4 py-3 text-right text-xs sm:text-sm font-medium text-[#ababab] uppercase tracking-wider whitespace-nowrap">
                  Total Tickets
                </th>
                <th className="px-4 py-3 text-right text-xs sm:text-sm font-medium text-[#ababab] uppercase tracking-wider whitespace-nowrap">
                  Total Salary
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343434]">
              {memberRows.length > 0 ? (
                memberRows.map((row) => (
                  <tr
                    key={row.member.id}
                    className="hover:bg-[#1a1a1a]/50 transition-colors"
                  >
                    <td className="px-4 py-3 sm:py-4 sticky left-0 bg-[#262626] z-10">
                      <p className="text-sm sm:text-base font-medium text-[#f5f5f5]">
                        {row.member.name}
                      </p>
                      <p className="text-xs text-[#ababab] mt-0.5">
                        {formatCurrency(row.member.hourlyRate || 0)}/hr
                      </p>
                    </td>
                    {storeColumns.map((store) => {
                      const storeId = String(store.id);
                      const salary = row.storeSalaries[storeId];
                      const hasStore = Object.prototype.hasOwnProperty.call(
                        row.storeSalaries,
                        storeId
                      );

                      return (
                        <td
                          key={store.id}
                          className="px-4 py-3 sm:py-4 text-right whitespace-nowrap"
                        >
                          <p className={`text-sm ${hasStore ? 'text-[#f5f5f5]' : 'text-[#ababab]'}`}>
                            {hasStore ? formatCurrency(salary) : '—'}
                          </p>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 sm:py-4 text-right whitespace-nowrap">
                      <p className="text-sm font-medium text-[#f5f5f5]">
                        {formatHours(row.totalHours)}
                      </p>
                    </td>
                    <td className="px-4 py-3 sm:py-4 text-right whitespace-nowrap">
                      <p className="text-sm font-medium text-[#f5f5f5]">
                        {row.totalTickets ?? 0}
                      </p>
                    </td>
                    <td className="px-4 py-3 sm:py-4 text-right whitespace-nowrap">
                      <p className="text-sm sm:text-base font-bold text-brand">
                        {formatCurrency(row.totalSalary)}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={emptyColSpan} className="px-4 py-8 text-center text-[#ababab]">
                    <PeopleIcon size={32} className="mx-auto mb-2 text-[#ababab]" />
                    <p>No member salary data available</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryMetrics;

