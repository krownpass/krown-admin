"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserAnalyticsData } from "@/lib/user-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Activity,
  Smartphone,
  TrendingUp,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import dynamic from "next/dynamic";
import { SubscriptionDonut } from "./components/SubscriptionDonut";
import { BookingFunnel } from "./components/BookingFunnel";
import { RedemptionMetrics } from "./components/RedemptionMetrics";
import { VisitorLoyaltyDonut } from "./components/VisitorLoyaltyDonut";

const UserHeatmap = dynamic(
  () => import("./components/UserHeatmap"),
  { ssr: false, loading: () => <Skeleton className="h-[500px] w-full" /> }
);

const RANGES = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "Last 6 Months", value: "6m" },
  { label: "Last 1 Year", value: "1y" },
  { label: "All Time", value: "all_time" },
];

export default function UserAnalyticsPage() {
  const [range, setRange] = useState("7d");

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-analytics", range],
    queryFn: () => getUserAnalyticsData(range),
  });

  const noShowRate = (() => {
    if (!data?.bookingFunnel) return "0.0";
    const accepted = Number(data.bookingFunnel.accepted_count) || 0;
    const visited = Number(data.bookingFunnel.visited_count) || 0;
    if (accepted === 0) return "0.0";
    return (((accepted - visited) / accepted) * 100).toFixed(1);
  })();

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error loading analytics: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Analytics</h2>
          <p className="text-muted-foreground">
            Overview of user growth, activity, and platform distribution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">{data?.totalUsers}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              All time registered users
            </p>
          </CardContent>
        </Card>

        {/* Active End Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active End Users
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">{data?.activeEndUsers}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              In the selected range
            </p>
          </CardContent>
        </Card>

        {/* New Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Registrations
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">{data?.newUsersInRange}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              In the selected range
            </p>
          </CardContent>
        </Card>

        {/* No-Show Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">{noShowRate}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Missed vs Accepted
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Visitor Signup Ratio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitor Conversion</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">
                {((data?.visitorSignupRatio?.ratio || 0) * 100).toFixed(1)}%
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Visitors to Signups ({data?.visitorSignupRatio?.total_signups} / {data?.visitorSignupRatio?.total_visitors})
            </p>
          </CardContent>
        </Card>

        {/* Onboarding Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">
                 {data?.onboardingCompletionRate?.total_users ? ((data.onboardingCompletionRate.onboarding_completed_users / data.onboardingCompletionRate.total_users) * 100).toFixed(1) : 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Users completing profile ({data?.onboardingCompletionRate?.onboarding_completed_users})
            </p>
          </CardContent>
        </Card>

        {/* Subscription Health */}
        {isLoading ? (
          <Skeleton className="h-[350px] w-full rounded-xl" />
        ) : (
          <SubscriptionDonut
            data={{
              active: data?.subscriptionHealth?.active_subscriptions || 0,
              expired: data?.subscriptionHealth?.expired_subscriptions || 0,
            }}
          />
        )}

        {/* Visitor Loyalty */}
        {isLoading ? (
            <Skeleton className="h-[350px] w-full rounded-xl" />
        ) : (
            <VisitorLoyaltyDonut
                data={{
                    new_visitors: data?.visitorLoyalty?.new_visitors || 0,
                    returning_visitors: data?.visitorLoyalty?.returning_visitors || 0,
                }}
            />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Time to Action */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Time to First Action
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1">
            {isLoading ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-2xl font-bold">
                {(() => {
                  const h = Number(
                    data?.timeToFirstAction?.average_hours || 0
                  );
                  if (h < 1) return `${(h * 60).toFixed(0)} mins`;
                  if (h < 24) return `${h.toFixed(1)} hrs`;
                  return `${(h / 24).toFixed(1)} days`;
                })()}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Avg time to first meaningful interaction
            </p>

            <div className="space-y-4">
              {/* Timeline Distribution */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Conversion Speed
                </p>
                {data?.timeToFirstAction?.conversion_timeline?.map(
                  (item: any, i: number) => {
                    const total =
                      data?.timeToFirstAction?.conversion_timeline?.reduce(
                        (acc: number, curr: any) => acc + Number(curr.count),
                        0
                      ) || 1;
                    const percent = (Number(item.count) / total) * 100;

                    return (
                      <div
                        key={i}
                        className="group flex items-center gap-2 text-xs"
                      >
                        <span className="text-muted-foreground w-16 shrink-0 text-[11px]">
                          {item.label}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              i === 0
                                ? "bg-emerald-500"
                                : i === 1
                                ? "bg-blue-500"
                                : i === 2
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-right font-medium text-muted-foreground">
                          {Math.round(percent)}%
                        </span>
                      </div>
                    );
                  }
                )}
              </div>

              {/* First Action Type */}
              {(data?.timeToFirstAction?.action_distribution?.length ?? 0) > 0 && (
                <div className="pt-3 border-t text-xs">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                    First Actions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data?.timeToFirstAction?.action_distribution
                      .sort((a: any, b: any) => b.count - a.count)
                      .slice(0, 3)
                      .map((action: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md border border-border/50"
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              idx === 0
                                ? "bg-primary"
                                : "bg-muted-foreground"
                            }`}
                          />
                          <span className="capitalize text-muted-foreground">
                            {action.action_type?.replace("_", " ")}
                          </span>
                          <span className="font-bold ml-1">{action.count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Funnel */}
        {isLoading ? (
          <Skeleton className="h-[350px] w-full rounded-xl" />
        ) : (
          <BookingFunnel data={data?.bookingFunnel} />
        )}

        {/* Redemption Metrics */}
        {isLoading ? (
          <Skeleton className="h-[350px] w-full rounded-xl" />
        ) : (
          <RedemptionMetrics data={data?.redemptionRate} />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* User Growth Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>User Growth (Last 8 Weeks)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart
                  data={data?.userGrowth8Weeks}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date_point"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })
                    }
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <RechartsTooltip 
                     contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
                     labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative_users"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    name="Total Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Platform Distribution Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                   data={[data?.userPlatformDistribution]}  
                   margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
                    cursor={{fill: 'transparent'}}
                  />
                  <Legend />
                  <Bar
                    dataKey="android_users"
                    name="Android"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="ios_users"
                    name="iOS"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Section */}
      <Card>
          <CardHeader>
              <CardTitle>User Activity Heatmap</CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
               <UserHeatmap />
          </CardContent>
      </Card>
    </div>
  );
}
