import mongoose from "mongoose";
import Campaign from "../models/campaignModel.js";
import CampaignParticipation from "../models/campaignParticipationModel.js";
import CampaignVoucher from "../models/campaignVoucherModel.js";
import type {
  CampaignDashboardAnalytics,
  CampaignPerformanceRow,
  DailyTrendRow,
  PrizeDistributionRow,
  ParticipantRow,
  RecentActivityRow,
  RedemptionsByStoreRow,
} from "../types/campaign.js";
import { maskPhone } from "../utils/campaignUtils.js";
import { getDateRangeVietnam } from "../utils/dateUtils.js";

interface GetDashboardParams {
  startDate?: string;
  endDate?: string;
  campaignId?: string;
}

type MongoFilter = Record<string, unknown>;

function parseDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
  const { start, end } = getDateRangeVietnam(startDate, endDate);
  return {
    start: start ?? new Date(0),
    end: end ?? new Date(),
  };
}

function buildCampaignFilter(campaignId?: string): MongoFilter {
  if (!campaignId) {
    return {};
  }
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    return { campaign: new mongoose.Types.ObjectId() };
  }
  return { campaign: new mongoose.Types.ObjectId(campaignId) };
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 100);
}

export class CampaignAnalyticsService {
  static async getDashboard(params: GetDashboardParams): Promise<CampaignDashboardAnalytics> {
    const { start, end } = parseDateRange(params.startDate, params.endDate);
    const campaignFilter = buildCampaignFilter(params.campaignId);

    const playDateFilter: MongoFilter = {
      lastPlayedAt: { $gte: start, $lte: end },
      ...campaignFilter,
    };

    const winDateFilter: MongoFilter = {
      wonAt: { $gte: start, $lte: end },
      ...campaignFilter,
    };

    const redeemDateFilter: MongoFilter = {
      status: "redeemed",
      redeemedAt: { $gte: start, $lte: end },
      ...campaignFilter,
    };

    const activeCampaignIds = await Campaign.find({ isActive: true }).distinct("_id");

    const [
      totalPlays,
      totalWins,
      vouchersRedeemed,
      uniqueParticipants,
      activeVouchers,
      campaignPerformanceAgg,
      prizeDistributionAgg,
      redemptionsByStoreAgg,
      playTrendAgg,
      winTrendAgg,
      redeemTrendAgg,
      recentWins,
      recentRedemptions,
    ] = await Promise.all([
      CampaignParticipation.countDocuments(playDateFilter),
      CampaignVoucher.countDocuments(winDateFilter),
      CampaignVoucher.countDocuments(redeemDateFilter),
      CampaignParticipation.distinct("phone", playDateFilter).then((phones) => phones.length),
      CampaignVoucher.countDocuments({
        status: "active",
        campaign: params.campaignId
          ? new mongoose.Types.ObjectId(params.campaignId)
          : { $in: activeCampaignIds },
      }),
      CampaignParticipation.aggregate([
        { $match: playDateFilter },
        {
          $group: {
            _id: "$campaign",
            plays: { $sum: 1 },
            phones: { $addToSet: "$phone" },
          },
        },
      ]),
      CampaignVoucher.aggregate([
        { $match: winDateFilter },
        {
          $group: {
            _id: { rewardLabel: "$rewardLabel", rewardType: "$rewardType" },
            count: { $sum: 1 },
            redeemed: {
              $sum: { $cond: [{ $eq: ["$status", "redeemed"] }, 1, 0] },
            },
          },
        },
        { $sort: { count: -1 } },
      ]),
      CampaignVoucher.aggregate([
        { $match: redeemDateFilter },
        { $group: { _id: "$redeemedAtStore", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "stores",
            localField: "_id",
            foreignField: "_id",
            as: "storeInfo",
          },
        },
        { $unwind: { path: "$storeInfo", preserveNullAndEmptyArrays: true } },
        { $sort: { count: -1 } },
      ]),
      CampaignParticipation.aggregate([
        { $match: playDateFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$lastPlayedAt", timezone: "Asia/Ho_Chi_Minh" },
            },
            plays: { $sum: 1 },
          },
        },
      ]),
      CampaignVoucher.aggregate([
        { $match: winDateFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$wonAt", timezone: "Asia/Ho_Chi_Minh" },
            },
            wins: { $sum: 1 },
          },
        },
      ]),
      CampaignVoucher.aggregate([
        { $match: redeemDateFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$redeemedAt", timezone: "Asia/Ho_Chi_Minh" },
            },
            redemptions: { $sum: 1 },
          },
        },
      ]),
      CampaignVoucher.find(winDateFilter)
        .sort({ wonAt: -1 })
        .limit(20)
        .populate("campaign", "name _id")
        .populate({ path: "participation", select: "phone _id" })
        .lean(),
      CampaignVoucher.find(redeemDateFilter)
        .sort({ redeemedAt: -1 })
        .limit(20)
        .populate("campaign", "name _id")
        .populate({ path: "participation", select: "phone _id" })
        .populate({ path: "redeemedAtStore", select: "name" })
        .lean(),
    ]);

    const totalLosses = Math.max(0, totalPlays - totalWins);

    const campaignIds = campaignPerformanceAgg.map((row) => row._id);
    const campaigns =
      campaignIds.length > 0
        ? await Campaign.find({ _id: { $in: campaignIds } })
          .select("name slug isActive")
          .lean()
        : [];

    const campaignMap = new Map(
      campaigns.map((c) => [String(c._id), c])
    );

    const winsByCampaign = await CampaignVoucher.aggregate([
      { $match: winDateFilter },
      {
        $group: {
          _id: "$campaign",
          wins: { $sum: 1 },
          redeemed: {
            $sum: { $cond: [{ $eq: ["$status", "redeemed"] }, 1, 0] },
          },
          activeVouchers: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
        },
      },
    ]);

    const winsMap = new Map(
      winsByCampaign.map((row) => [String(row._id), row])
    );

    const campaignPerformance: CampaignPerformanceRow[] = campaignPerformanceAgg
      .map((row) => {
        const campaign = campaignMap.get(String(row._id));
        const winStats = winsMap.get(String(row._id));
        const plays = row.plays as number;
        const wins = winStats?.wins ?? 0;
        const losses = Math.max(0, plays - wins);
        const redeemed = winStats?.redeemed ?? 0;

        return {
          campaignId: String(row._id),
          name: campaign?.name ?? "Unknown",
          slug: campaign?.slug ?? "",
          isActive: campaign?.isActive ?? false,
          plays,
          wins,
          losses,
          winRate: pct(wins, plays),
          redeemed,
          redemptionRate: pct(redeemed, wins),
          activeVouchers: winStats?.activeVouchers ?? 0,
        };
      })
      .sort((a, b) => b.plays - a.plays);

    const prizeDistribution: PrizeDistributionRow[] = prizeDistributionAgg.map((row) => ({
      rewardLabel: row._id.rewardLabel as string,
      rewardType: row._id.rewardType as string,
      count: row.count as number,
      redeemed: row.redeemed as number,
    }));

    const redemptionsByStore: RedemptionsByStoreRow[] = redemptionsByStoreAgg.map((row) => ({
      storeId: row._id ? String(row._id) : "",
      storeName: row.storeInfo?.name ?? "Unknown Store",
      count: row.count as number,
    }));

    const trendMap = new Map<string, DailyTrendRow>();

    for (const row of playTrendAgg) {
      const date = row._id as string;
      trendMap.set(date, {
        date,
        plays: row.plays as number,
        wins: 0,
        redemptions: 0,
      });
    }

    for (const row of winTrendAgg) {
      const date = row._id as string;
      const existing = trendMap.get(date) ?? { date, plays: 0, wins: 0, redemptions: 0 };
      existing.wins = row.wins as number;
      trendMap.set(date, existing);
    }

    for (const row of redeemTrendAgg) {
      const date = row._id as string;
      const existing = trendMap.get(date) ?? { date, plays: 0, wins: 0, redemptions: 0 };
      existing.redemptions = row.redemptions as number;
      trendMap.set(date, existing);
    }

    const dailyTrend = [...trendMap.values()].sort((a, b) => a.date.localeCompare(b.date));

    const recentActivity: RecentActivityRow[] = [
      ...recentWins.map((voucher) => ({
        type: "win" as const,
        phone: maskPhone(
          (voucher.participation as { phone?: string } | null)?.phone ?? ""
        ),
        campaignName: (voucher.campaign as { name?: string } | null)?.name ?? "",
        rewardLabel: voucher.rewardLabel,
        timestamp: voucher.wonAt as Date,
        participationId: String(
          (voucher.participation as { _id?: unknown } | null)?._id ?? ""
        ) || undefined,
        campaignId: String(
          (voucher.campaign as { _id?: unknown } | null)?._id ?? ""
        ) || undefined,
      })),
      ...      recentRedemptions.map((voucher) => ({
        type: "redeem" as const,
        phone: maskPhone(
          (voucher.participation as { phone?: string } | null)?.phone ?? ""
        ),
        campaignName: (voucher.campaign as { name?: string } | null)?.name ?? "",
        rewardLabel: voucher.rewardLabel,
        storeName: (voucher.redeemedAtStore as { name?: string } | null)?.name,
        timestamp: voucher.redeemedAt as Date,
        participationId: String(
          (voucher.participation as { _id?: unknown } | null)?._id ?? ""
        ) || undefined,
        campaignId: String(
          (voucher.campaign as { _id?: unknown } | null)?._id ?? ""
        ) || undefined,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    const participationDocs = await CampaignParticipation.find({
      ...playDateFilter,
      playCount: { $gt: 0 },
    })
      .populate("campaign", "name maxPlaysPerPhone")
      .sort({ lastPlayedAt: -1 })
      .limit(100)
      .lean();

    const participationIds = participationDocs.map((row) => row._id);
    const activeVoucherParticipationIds = new Set(
      (
        await CampaignVoucher.find({
          participation: { $in: participationIds },
          status: "active",
        })
          .select("participation")
          .lean()
      ).map((voucher) => String(voucher.participation))
    );

    const participants: ParticipantRow[] = participationDocs.map((row) => {
      const campaign = row.campaign as {
        _id?: unknown;
        name?: string;
        maxPlaysPerPhone?: number;
      } | null;

      return {
        participationId: String(row._id),
        campaignId: String(campaign?._id ?? row.campaign),
        campaignName: campaign?.name ?? "Unknown",
        phone: maskPhone(row.phone),
        playCount: row.playCount,
        maxPlaysPerPhone: campaign?.maxPlaysPerPhone ?? 1,
        lastPlayedAt: row.lastPlayedAt as Date,
        hasActiveVoucher: activeVoucherParticipationIds.has(String(row._id)),
      };
    });

    return {
      summary: {
        totalPlays,
        totalWins,
        totalLosses,
        winRate: pct(totalWins, totalPlays),
        vouchersRedeemed,
        redemptionRate: pct(vouchersRedeemed, totalWins),
        activeVouchers,
        uniqueParticipants,
      },
      campaignPerformance,
      prizeDistribution,
      redemptionsByStore,
      dailyTrend,
      recentActivity,
      participants,
    };
  }
}

export default CampaignAnalyticsService;
