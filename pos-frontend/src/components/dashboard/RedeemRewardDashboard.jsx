import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import {
  MdCasino,
  MdEmojiEvents,
  MdTrendingDown,
  MdCardGiftcard,
  MdCheckCircle,
  MdPeople,
  MdConfirmationNumber,
  MdBarChart,
} from "react-icons/md";
import {
  fetchCampaignDashboardAnalytics,
  fetchCampaigns,
} from "../../redux/slices/campaignSlice";
import { getTodayDateVietnam, getDateRangeByPeriodVietnam } from "../../utils/dateUtils";
import LoadingState from "../shared/LoadingState";
import EmptyState from "../shared/EmptyState";
import StoreSummariesTable from "./StoreSummariesTable";

const RedeemRewardDashboard = ({ dateFilter, customDateRange }) => {
  const dispatch = useDispatch();
  const { dashboardAnalytics, dashboardLoading, campaigns, campaignsLoading } =
    useSelector((state) => state.campaigns);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  useEffect(() => {
    const today = getTodayDateVietnam();
    let startDate;
    let endDate;

    switch (dateFilter) {
      case "today":
        startDate = today;
        endDate = today;
        break;
      case "week": {
        const { start } = getDateRangeByPeriodVietnam("thisWeek");
        startDate = start;
        endDate = today;
        break;
      }
      case "month": {
        const { start } = getDateRangeByPeriodVietnam("thisMonth");
        startDate = start;
        endDate = today;
        break;
      }
      case "custom":
        if (customDateRange.startDate && customDateRange.endDate) {
          startDate = customDateRange.startDate;
          endDate = customDateRange.endDate;
        }
        break;
      default:
        startDate = today;
        endDate = today;
    }

    if (startDate && endDate) {
      dispatch(
        fetchCampaignDashboardAnalytics({
          startDate,
          endDate,
          campaignId: selectedCampaignId || undefined,
        })
      );
    }
  }, [dispatch, dateFilter, customDateRange, selectedCampaignId]);

  if (dashboardLoading || campaignsLoading) {
    return <LoadingState message="Loading redeem reward analytics…" />;
  }

  if (!dashboardAnalytics?.summary) {
    return (
      <EmptyState
        icon={MdCasino}
        variant="rich"
        title="No campaign analytics available"
        message="Create campaigns and collect spin data to see metrics here"
      />
    );
  }

  const {
    summary,
    campaignPerformance = [],
    prizeDistribution = [],
    redemptionsByStore = [],
    dailyTrend = [],
    recentActivity = [],
  } = dashboardAnalytics;

  const storeSummaries = redemptionsByStore.map((row) => ({
    store: {
      id: row.storeId,
      name: row.storeName,
      code: "",
    },
    count: row.count,
  }));

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activityLabel = (type) => {
    if (type === "win") return "Won prize";
    if (type === "redeem") return "Redeemed";
    return "Played";
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-[#ababab]">Brand-wide · spin campaign analytics</p>
        <select
          value={selectedCampaignId}
          onChange={(e) => setSelectedCampaignId(e.target.value)}
          className="bg-[#262626] border border-[#343434] text-[#f5f5f5] text-sm rounded-lg px-3 py-2 min-w-[200px]"
        >
          <option value="">All campaigns</option>
          {campaigns.map((campaign) => (
            <option key={campaign._id} value={campaign._id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
          <div className="flex items-center justify-between mb-3">
            <MdCasino className="text-xl text-brand" />
            <span className="text-[#ababab] text-xs">Period</span>
          </div>
          <h3 className="text-xl font-bold text-[#f5f5f5] mb-1">{summary.totalPlays ?? 0}</h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Total Plays</p>
        </div>

        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
          <div className="flex items-center justify-between mb-3">
            <MdEmojiEvents className="text-xl text-[#10B981]" />
            <span className="text-[#ababab] text-xs">Period</span>
          </div>
          <h3 className="text-xl font-bold text-[#f5f5f5] mb-1">{summary.totalWins ?? 0}</h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Total Wins</p>
        </div>

        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
          <div className="flex items-center justify-between mb-3">
            <MdTrendingDown className="text-xl text-[#EF4444]" />
            <span className="text-[#ababab] text-xs">Period</span>
          </div>
          <h3 className="text-xl font-bold text-[#f5f5f5] mb-1">{summary.totalLosses ?? 0}</h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Try Again</p>
        </div>

        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
          <div className="flex items-center justify-between mb-3">
            <MdBarChart className="text-xl text-[#8B5CF6]" />
            <span className="text-[#ababab] text-xs">Rate</span>
          </div>
          <h3 className="text-xl font-bold text-[#f5f5f5] mb-1">{summary.winRate ?? 0}%</h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Win Rate</p>
        </div>

        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
          <div className="flex items-center justify-between mb-3">
            <MdCheckCircle className="text-xl text-brand" />
            <span className="text-[#ababab] text-xs">Period</span>
          </div>
          <h3 className="text-xl font-bold text-[#f5f5f5] mb-1">{summary.vouchersRedeemed ?? 0}</h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Redeemed</p>
        </div>

        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
          <div className="flex items-center justify-between mb-3">
            <MdCardGiftcard className="text-xl text-[#F59E0B]" />
            <span className="text-[#ababab] text-xs">Rate</span>
          </div>
          <h3 className="text-xl font-bold text-[#f5f5f5] mb-1">{summary.redemptionRate ?? 0}%</h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Redemption Rate</p>
        </div>

        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 border border-[#343434]">
          <div className="flex items-center justify-between mb-3">
            <MdConfirmationNumber className="text-xl text-[#3B82F6]" />
            <span className="text-[#ababab] text-xs">Live</span>
          </div>
          <h3 className="text-xl font-bold text-[#f5f5f5] mb-1">{summary.activeVouchers ?? 0}</h3>
          <p className="text-[#ababab] text-xs sm:text-sm">Active Vouchers</p>
        </div>
      </div>

      <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
        <div className="flex items-center gap-2 mb-4">
          <MdPeople className="text-brand" />
          <span className="text-[#f5f5f5] font-semibold">
            {summary.uniqueParticipants ?? 0} unique participants in period
          </span>
        </div>
      </div>

      <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
        <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-4">
          Campaign Performance
        </h3>
        {campaignPerformance.length === 0 ? (
          <p className="text-[#ababab] text-center py-4 text-sm">No campaign data in this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#343434]">
                  <th className="text-left py-2 px-2 text-[#ababab] text-xs font-medium">Campaign</th>
                  <th className="text-right py-2 px-2 text-[#ababab] text-xs font-medium">Plays</th>
                  <th className="text-right py-2 px-2 text-[#ababab] text-xs font-medium">Wins</th>
                  <th className="text-right py-2 px-2 text-[#ababab] text-xs font-medium">Win %</th>
                  <th className="text-right py-2 px-2 text-[#ababab] text-xs font-medium">Redeemed</th>
                  <th className="text-right py-2 px-2 text-[#ababab] text-xs font-medium">Redeem %</th>
                  <th className="text-right py-2 px-2 text-[#ababab] text-xs font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {campaignPerformance.map((row) => (
                  <tr
                    key={row.campaignId}
                    onClick={() => setSelectedCampaignId(row.campaignId)}
                    className="border-b border-[#343434] hover:bg-[#1f1f1f] cursor-pointer last:border-b-0"
                  >
                    <td className="py-3 px-2">
                      <p className="text-[#f5f5f5] text-sm font-medium">{row.name}</p>
                      <p className="text-[#6a6a6a] text-xs">{row.slug}</p>
                    </td>
                    <td className="py-3 px-2 text-right text-sm text-[#f5f5f5]">{row.plays}</td>
                    <td className="py-3 px-2 text-right text-sm text-[#f5f5f5]">{row.wins}</td>
                    <td className="py-3 px-2 text-right text-sm text-brand">{row.winRate}%</td>
                    <td className="py-3 px-2 text-right text-sm text-[#f5f5f5]">{row.redeemed}</td>
                    <td className="py-3 px-2 text-right text-sm text-brand">{row.redemptionRate}%</td>
                    <td className="py-3 px-2 text-right text-sm text-[#f5f5f5]">{row.activeVouchers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
          <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-4">
            Prize Distribution
          </h3>
          {prizeDistribution.length === 0 ? (
            <p className="text-[#ababab] text-center py-4 text-sm">No prizes issued in this period</p>
          ) : (
            <div className="space-y-3">
              {prizeDistribution.map((prize) => (
                <div
                  key={`${prize.rewardLabel}-${prize.rewardType}`}
                  className="py-2 border-b border-[#343434] last:border-b-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[#f5f5f5] font-medium text-sm truncate">{prize.rewardLabel}</p>
                    <span className="text-brand font-bold text-sm ml-2">{prize.count}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-[#ababab]">
                    <span>Type: {prize.rewardType.replace("_", " ")}</span>
                    <span>Redeemed: {prize.redeemed}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
          <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-4">Daily Trend</h3>
          {dailyTrend.length === 0 ? (
            <p className="text-[#ababab] text-center py-4 text-sm">No daily activity in this period</p>
          ) : (
            <div className="space-y-2">
              {dailyTrend.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between py-2 border-b border-[#343434] last:border-b-0"
                >
                  <p className="text-[#f5f5f5] text-sm font-medium">{day.date}</p>
                  <div className="flex gap-3 text-xs text-[#ababab]">
                    <span>Plays: <span className="text-[#f5f5f5]">{day.plays}</span></span>
                    <span>Wins: <span className="text-[#f5f5f5]">{day.wins}</span></span>
                    <span>Redeemed: <span className="text-[#f5f5f5]">{day.redemptions}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {storeSummaries.length > 0 && (
        <StoreSummariesTable
          title="Redemptions by Store"
          summaries={storeSummaries}
          columns={[{ key: "count", label: "Redemptions" }]}
        />
      )}

      <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
        <h3 className="text-[#f5f5f5] font-semibold text-base sm:text-lg mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-[#ababab] text-center py-4 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((item, idx) => (
              <div
                key={`${item.type}-${item.timestamp}-${idx}`}
                className="flex items-start justify-between gap-3 py-2 border-b border-[#343434] last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-[#f5f5f5] text-sm font-medium">
                    {activityLabel(item.type)}
                    {item.rewardLabel ? ` · ${item.rewardLabel}` : ""}
                  </p>
                  <p className="text-[#ababab] text-xs truncate">
                    {item.phone} · {item.campaignName}
                    {item.storeName ? ` · ${item.storeName}` : ""}
                  </p>
                </div>
                <span className="text-[#6a6a6a] text-xs whitespace-nowrap">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

RedeemRewardDashboard.propTypes = {
  dateFilter: PropTypes.string.isRequired,
  customDateRange: PropTypes.shape({
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
};

export default RedeemRewardDashboard;
