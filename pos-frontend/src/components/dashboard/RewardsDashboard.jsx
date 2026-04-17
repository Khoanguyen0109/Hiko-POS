import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdPeople, MdCardGiftcard, MdTrendingUp, MdLocalOffer } from "react-icons/md";
import { fetchRewardAnalytics } from "../../redux/slices/rewardSlice";

const PERIODS = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "ALL", value: "all" },
];

const RewardsDashboard = () => {
  const dispatch = useDispatch();
  const { analytics, analyticsLoading } = useSelector((s) => s.rewards);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    dispatch(fetchRewardAnalytics({ period }));
  }, [dispatch, period]);

  if (analyticsLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f6b100] mx-auto mb-4" />
        <p className="text-[#ababab] text-lg">Loading rewards analytics…</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <MdCardGiftcard className="mx-auto text-6xl text-[#ababab] mb-4" />
        <p className="text-[#ababab] text-lg">No analytics data available</p>
        <p className="text-[#ababab] text-sm mt-2">
          Create reward programs and customers first
        </p>
      </div>
    );
  }

  const {
    totalCustomers = 0,
    rewardsRedeemed = 0,
    retentionRate = null,
    totalDiscountGiven = 0,
    programPerformance = [],
    topCustomers = [],
  } = analytics;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === p.value
                ? "bg-[#f6b100] text-[#1f1f1f]"
                : "bg-[#262626] text-[#ababab] hover:bg-[#343434]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <MdPeople className="text-xl sm:text-2xl text-[#f6b100]" />
            <span className="text-[#ababab] text-xs sm:text-sm">Total</span>
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
            {totalCustomers}
          </h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Customers</p>
        </div>

        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <MdCardGiftcard className="text-xl sm:text-2xl text-[#10B981]" />
            <span className="text-[#ababab] text-xs sm:text-sm">Period</span>
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
            {rewardsRedeemed}
          </h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Rewards Redeemed</p>
        </div>

        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <MdTrendingUp className="text-xl sm:text-2xl text-[#8B5CF6]" />
            <span className="text-[#ababab] text-xs sm:text-sm">Est.</span>
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
            {retentionRate != null ? `${retentionRate}%` : "—"}
          </h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Retention Rate</p>
        </div>

        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <MdLocalOffer className="text-xl sm:text-2xl text-[#EF4444]" />
            <span className="text-[#ababab] text-xs sm:text-sm">Period</span>
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#f5f5f5] mb-1">
            {totalDiscountGiven.toLocaleString()}
          </h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Discount Given</p>
        </div>
      </div>

      {/* Program Performance + Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Program Performance */}
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
          <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-3 sm:mb-4">
            Program Performance
          </h3>
          {programPerformance.length === 0 ? (
            <p className="text-[#ababab] text-center py-4 text-sm">
              No program data available
            </p>
          ) : (
            <div className="space-y-3">
              {programPerformance.map((pp) => {
                const rate =
                  pp.unlocked > 0
                    ? Math.round((pp.redeemed / pp.unlocked) * 100)
                    : 0;
                return (
                  <div
                    key={pp.programId || pp.name}
                    className="py-2 border-b border-[#343434] last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[#f5f5f5] font-medium text-sm truncate">
                        {pp.name}
                      </p>
                      <span className="text-[#f6b100] font-bold text-sm ml-2">
                        {rate}%
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-[#ababab]">
                      <span>
                        Unlocked:{" "}
                        <span className="text-[#f5f5f5]">{pp.unlocked ?? 0}</span>
                      </span>
                      <span>
                        Redeemed:{" "}
                        <span className="text-[#f5f5f5]">{pp.redeemed ?? 0}</span>
                      </span>
                    </div>
                    {/* Mini bar */}
                    <div className="w-full h-1.5 bg-[#343434] rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-[#f6b100] rounded-full transition-all"
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
          <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-3 sm:mb-4">
            Top Customers
          </h3>
          {topCustomers.length === 0 ? (
            <p className="text-[#ababab] text-center py-4 text-sm">
              No customer data available
            </p>
          ) : (
            <div className="space-y-2">
              {topCustomers.slice(0, 10).map((c, idx) => (
                <div
                  key={c._id || idx}
                  className="flex items-center gap-3 py-2 border-b border-[#343434] last:border-b-0"
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      idx === 0
                        ? "bg-[#f6b100] text-[#1a1a1a]"
                        : idx === 1
                          ? "bg-[#9ca3af] text-[#1a1a1a]"
                          : idx === 2
                            ? "bg-[#cd7f32] text-white"
                            : "bg-[#1f1f1f] text-[#ababab]"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f5f5f5] text-sm font-medium truncate">
                      {c.name || c.nickname || c.phone || "Unknown"}
                    </p>
                    {c.phone && (
                      <p className="text-[#6a6a6a] text-xs">{c.phone}</p>
                    )}
                  </div>
                  <p className="text-[#f6b100] font-bold text-sm flex-shrink-0">
                    {c.totalDishCount ?? 0}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardsDashboard;
