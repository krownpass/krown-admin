import api from "@/lib/api";

export interface UserAnalyticsData {
  totalUsers: number;
  activeEndUsers: number;
  newUsersInRange: number;
  userGrowth8Weeks: {
    date_point: string;
    cumulative_users: string | number;
  }[];
  userPlatformDistribution: {
    android_users: number;
    ios_users: number;
  };
  visitorSignupRatio: {
    total_visitors: number;
    total_signups: number;
    ratio: number;
  };
  onboardingCompletionRate: {
    total_users: number;
    onboarding_completed_users: number;
  };
  timeToFirstAction: {
    average_hours: number;
    conversion_timeline: any[];
    action_distribution: any[];
  };
  subscriptionHealth: {
    active_subscriptions: number;
    expired_subscriptions: number;
  };
  bookingFunnel: {
    pending_count: number;
    accepted_count: number;
    visited_count: number;
  };
  redemptionRate: any;
  visitorLoyalty: {
    new_visitors: number;
    returning_visitors: number;
  };
}

export const getUserAnalyticsData = async (
  range: string = "7d",
  from?: string,
  to?: string
) => {
  // We can fetch them in parallel using Promise.all
  const [
    totalUsersRes,
    activeEndUsersRes,
    newUsersInRangeRes,
    userGrowthRes,
    userPlatformRes,
    visitorRatioRes,
    onboardingRes,
    timeToActionRes,
    subHealthRes,
    bookingFunnelRes,
    redemptionRateRes,
    loyaltyRes,
  ] = await Promise.all([
    api.get("/krown/user/total"),
    api.get("/krown/user/active", { params: { range, from, to } }),
    api.get("/krown/user/new-in-range", { params: { range, from, to } }),
    api.get("/krown/user/growth", { params: { to } }), // Growth only uses 'to' date
    api.get("/krown/user/platform", { params: { range, from, to } }),
    api.get("/krown/user/visitor-ratio"),
    api.get("/krown/user/onboarding-rate"),
    api.get("/krown/user/time-to-action"),
    api.get("/krown/user/subscription-health"),
    api.get("/krown/user/booking-funnel", { params: { range, from, to } }),
    api.get("/krown/user/redemption-rate", { params: { range, from, to } }),
    api.get("/krown/user/loyalty", { params: { range, from, to } }),
  ]);

  return {
    totalUsers: Number(totalUsersRes.data.count),
    activeEndUsers: Number(activeEndUsersRes.data.count),
    newUsersInRange: Number(newUsersInRangeRes.data.count),
    userGrowth8Weeks: userGrowthRes.data,
    userPlatformDistribution: userPlatformRes.data,
    visitorSignupRatio: visitorRatioRes.data,
    onboardingCompletionRate: onboardingRes.data,
    timeToFirstAction: timeToActionRes.data,
    subscriptionHealth: subHealthRes.data,
    bookingFunnel: bookingFunnelRes.data,
    redemptionRate: redemptionRateRes.data,
    visitorLoyalty: {
        new_visitors: Number(loyaltyRes.data.new_visitors),
        returning_visitors: Number(loyaltyRes.data.returning_visitors),
    },
  } as UserAnalyticsData;
};
