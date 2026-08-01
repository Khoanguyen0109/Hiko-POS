import React, { useEffect } from 'react';
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

  const { period, overallSummary, stores } = summaryData;

  const tableRows = (stores || []).flatMap((storeBlock) =>
    (storeBlock.members || []).map((member) => ({
      ...member,
      store: storeBlock.store,
    }))
  ).sort((a, b) => {
    const storeCompare = (a.store?.name || '').localeCompare(b.store?.name || '');
    if (storeCompare !== 0) return storeCompare;
    return (b.summary?.totalSalary || 0) - (a.summary?.totalSalary || 0);
  });

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
            Salary and tickets by store and member
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-[#ababab] uppercase tracking-wider">
                  Store
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-[#ababab] uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-[#ababab] uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-[#ababab] uppercase tracking-wider hidden sm:table-cell">
                  Regular
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-[#ababab] uppercase tracking-wider hidden sm:table-cell">
                  Extra Work
                </th>
                <th className="px-4 py-3 text-center text-xs sm:text-sm font-medium text-[#ababab] uppercase tracking-wider">
                  Tickets
                </th>
                <th className="px-4 py-3 text-right text-xs sm:text-sm font-medium text-[#ababab] uppercase tracking-wider">
                  Total Salary
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343434]">
              {tableRows.length > 0 ? (
                tableRows.map((row) => (
                  <tr
                    key={`${row.store?.id}-${row.member.id}`}
                    className="hover:bg-[#1a1a1a]/50 transition-colors"
                  >
                    <td className="px-4 py-3 sm:py-4">
                      <p className="text-sm font-medium text-[#f5f5f5]">
                        {row.store?.name}
                      </p>
                      <p className="text-xs text-[#ababab] mt-0.5">
                        {row.store?.code}
                      </p>
                    </td>
                    <td className="px-4 py-3 sm:py-4">
                      <div>
                        <p className="text-sm sm:text-base font-medium text-[#f5f5f5]">
                          {row.member.name}
                        </p>
                        <p className="text-xs text-[#ababab] mt-0.5">
                          {formatCurrency(row.member.hourlyRate || 0)}/hr
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:py-4">
                      <p className="text-sm sm:text-base font-medium text-[#f5f5f5]">
                        {formatHours(row.summary?.totalHours || 0)}
                      </p>
                      <p className="text-xs text-[#ababab] sm:hidden mt-0.5">
                        {row.summary?.totalShifts || 0} shifts
                      </p>
                    </td>
                    <td className="px-4 py-3 sm:py-4 hidden sm:table-cell">
                      <p className="text-sm text-[#f5f5f5]">
                        {formatHours(row.summary?.regularHours || 0)}h
                      </p>
                      <p className="text-xs text-[#ababab]">
                        {formatCurrency(row.summary?.regularSalary || 0)}
                      </p>
                    </td>
                    <td className="px-4 py-3 sm:py-4 hidden sm:table-cell">
                      <p className="text-sm text-[#f5f5f5]">
                        {formatHours(row.summary?.extraWorkHours || 0)}h
                      </p>
                      <p className="text-xs text-[#ababab]">
                        {formatCurrency(row.summary?.extraWorkPayment || 0)}
                      </p>
                    </td>
                    <td className="px-4 py-3 sm:py-4 text-center">
                      <p className="text-sm sm:text-base font-medium text-[#f5f5f5]">
                        {row.tickets?.count || 0}
                      </p>
                      <p className="text-xs text-[#ababab]">
                        {row.tickets?.totalScore || 0} pts
                      </p>
                    </td>
                    <td className="px-4 py-3 sm:py-4 text-right">
                      <p className="text-sm sm:text-base font-bold text-brand">
                        {formatCurrency(row.summary?.totalSalary || 0)}
                      </p>
                      <p className="text-xs text-[#ababab] sm:hidden mt-0.5">
                        {row.summary?.totalShifts || 0} shifts
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-[#ababab]">
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

