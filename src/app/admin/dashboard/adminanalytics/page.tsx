"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  IndianRupee,
  Wallet,
  CalendarDays,
  Users,
  Activity,
  ArrowUpRight,
  Search,
} from "lucide-react";

import { getAdminDashboardStats, AnalyticsData } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Sub-components (we'll update their styles next)
import { RevenueChart } from "./components/RevenueChart";
import { BookingFunnel } from "./components/BookingFunnel";
import { CafeLeaderboard } from "./components/CafeLeaderboard";
import { OperationalMetrics } from "./components/OperationalMetrics";
import { SubscriptionDonut } from "./components/SubscriptionDonut";
import { VisitorLoyalty } from "./components/VisitorLoyalty";
import { RecentBookingsTable } from "./components/RecentBookingsTable";

export default function AnalyticsPage() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const stats = await getAdminDashboardStats(range);
        console.log("Analytics Component State:", stats);
        setData(stats);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range]);

  // Filter bookings based on search query
  const filteredBookings = useMemo(() => {
    if (!data?.recentBookings) return [];
    if (!searchQuery.trim()) return data.recentBookings;

    const query = searchQuery.toLowerCase();
    return data.recentBookings.filter((booking: any) => {
      const userName = (booking.userName || "").toLowerCase();
      const userMobile = (booking.userMobile || "").toLowerCase();
      const cafeName = (booking.cafeName || "").toLowerCase();
      const bookingId = (booking.bookingId || "").toLowerCase();
      const amount = (booking.amount || "").toString().toLowerCase();
      const status = (booking.status || "").toLowerCase();

      return (
        userName.includes(query) ||
        userMobile.includes(query) ||
        cafeName.includes(query) ||
        bookingId.includes(query) ||
        amount.includes(query) ||
        status.includes(query)
      );
    });
  }, [data?.recentBookings, searchQuery]);

  if (loading) {
     return (
        <div className="p-6 md:p-10 space-y-8">
            <div className="flex flex-col gap-4">
                <Skeleton className="h-12 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                <Skeleton className="h-[300px] w-full" />
            </div>
        </div>
     )
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-10 space-y-8 bg-slate-50/50 min-h-screen"
    >
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-slate-800" />
            <span className="text-slate-900">Admin Dashboard</span>
          </h1>
          <p className="text-sm text-slate-500">
            Overview of platform performance, revenue, and bookings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px] bg-white border-slate-200">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="2m">Last 2 Months</SelectItem>
              <SelectItem value="1y">Last 1 Year</SelectItem>
              <SelectItem value="2y">Last 2 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data && (
            <>
                <StatCard
                    icon={<IndianRupee className="w-5 h-5 text-emerald-700" />}
                    label="Total Revenue"
                    value={`₹${data.kpi.totalRevenue.toLocaleString()}`}
                    sub="Gross transaction value"
                />
                <StatCard
                    icon={<CalendarDays className="w-5 h-5 text-sky-700" />}
                    label="Total Bookings"
                    value={data.kpi.totalBookings}
                    sub="All time in range"
                />
                <StatCard
                    icon={<Activity className="w-5 h-5 text-amber-700" />}
                    label="Active Users"
                    value={data.kpi.activeUsers}
                    sub="Unique users"
                />
                <StatCard
                    icon={<ArrowUpRight className="w-5 h-5 text-rose-700" />}
                    label="No-Show Rate"
                    value={`${data.kpi.noShowRate}%`}
                    sub="Missed bookings"
                />
            </>
        )}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="space-y-6">
        
        {/* ROW 1: Revenue Chart (Full Width) */}
        <div className="w-full">
             {data && <RevenueChart data={data.revenueChart} />}
        </div>

        {/* ROW 2: Leaderboard & Metrics */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
           {/* Leaderboard - Takes 1 col */}
           <div className="xl:col-span-1">
                {data && <CafeLeaderboard data={data.cafeLeaderboard} />}
           </div>
           
           {/* Metrics Grid - Takes 2 cols (displayed as 2x2 grid) */}
           <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
               {data && <BookingFunnel data={data.bookingFunnel} />}
               {data && <OperationalMetrics data={data.operationalMetrics} />}
               {data && <SubscriptionDonut data={data.subscriptionHealth} />}
               {data && <VisitorLoyalty data={data.visitorRetention} />}
           </div>
        </div>

        {/* ROW 3: Recent Bookings Table with Search */}
        {data && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search user, phone, café, booking ID, amount, status…"
                  className="pl-9 text-sm border-slate-300 focus-visible:ring-slate-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{filteredBookings.length}</span> of{" "}
                <span className="font-semibold text-slate-700">{data.recentBookings?.length || 0}</span> bookings
              </div>
            </div>
            
            {/* Bookings Table */}
            <RecentBookingsTable data={filteredBookings} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------- Stat Card Component ---------- */
function StatCard({
    icon,
    label,
    value,
    sub,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
}) {
    return (
        <Card className="shadow-sm border border-slate-200/70 bg-white">
            <CardContent className="flex items-center justify-between p-5">
                <div className="space-y-1">
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                        {label}
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">{value}</p>
                    {sub && (
                        <p className="text-[11px] text-slate-400">
                            {sub}
                        </p>
                    )}
                </div>
                <div className="p-3 rounded-full bg-slate-50 border border-slate-100">
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}

