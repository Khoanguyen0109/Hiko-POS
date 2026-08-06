export type WheelRewardType = "percentage_discount" | "free_product" | "no_prize";
export type VoucherStatus = "active" | "redeemed" | "expired";

export interface WheelSlot {
  label: string;
  rewardType: WheelRewardType;
  discountPercent?: number;
  freeDish?: string;
  weight: number;
  color: string;
}

export interface PlayResultWin {
  result: "win";
  reward: {
    label: string;
    type: "percentage_discount" | "free_product";
    discountPercent?: number;
    freeDish?: string;
  };
  voucher: {
    code: string;
    qrToken: string;
    expiresAt: string | null;
  };
  playsRemaining: number;
}

export interface PlayResultLose {
  result: "lose";
  message: string;
  playsRemaining: number;
}

export interface PlayResultNoPlaysRemaining {
  result: "no_plays_remaining";
  message: string;
}

export type PlayCampaignResult =
  | PlayResultWin
  | PlayResultLose
  | PlayResultNoPlaysRemaining;

export interface PublicCampaignDTO {
  name: string;
  description: string;
  wheelSlots: Array<{ label: string; color: string }>;
}

export interface LookupResultActive {
  status: "active";
  reward: {
    label: string;
    type: "percentage_discount" | "free_product";
    discountPercent?: number;
    freeDish?: string;
  };
  voucher: {
    code: string;
    qrToken: string;
    expiresAt: string | null;
  };
}

export interface LookupResultRedeemed {
  status: "redeemed";
  message: string;
  redeemedAt: string;
}

export interface LookupResultExpired {
  status: "expired";
  message: string;
}

export interface LookupResultNone {
  status: "none";
  message: string;
}

export type LookupResult =
  | LookupResultActive
  | LookupResultRedeemed
  | LookupResultExpired
  | LookupResultNone;

export interface CampaignDashboardSummary {
  totalPlays: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  vouchersRedeemed: number;
  redemptionRate: number;
  activeVouchers: number;
  uniqueParticipants: number;
}

export interface CampaignPerformanceRow {
  campaignId: string;
  name: string;
  slug: string;
  isActive: boolean;
  plays: number;
  wins: number;
  losses: number;
  winRate: number;
  redeemed: number;
  redemptionRate: number;
  activeVouchers: number;
}

export interface PrizeDistributionRow {
  rewardLabel: string;
  rewardType: string;
  count: number;
  redeemed: number;
}

export interface RedemptionsByStoreRow {
  storeId: string;
  storeName: string;
  count: number;
}

export interface DailyTrendRow {
  date: string;
  plays: number;
  wins: number;
  redemptions: number;
}

export interface RecentActivityRow {
  type: "play" | "win" | "redeem";
  phone: string;
  campaignName: string;
  rewardLabel?: string;
  storeName?: string;
  timestamp: Date;
  participationId?: string;
  campaignId?: string;
}

export interface ParticipantRow {
  participationId: string;
  campaignId: string;
  campaignName: string;
  phone: string;
  playCount: number;
  maxPlaysPerPhone: number;
  lastPlayedAt: Date;
  hasActiveVoucher: boolean;
}

export interface CampaignDashboardAnalytics {
  summary: CampaignDashboardSummary;
  campaignPerformance: CampaignPerformanceRow[];
  prizeDistribution: PrizeDistributionRow[];
  redemptionsByStore: RedemptionsByStoreRow[];
  dailyTrend: DailyTrendRow[];
  recentActivity: RecentActivityRow[];
  participants: ParticipantRow[];
}
