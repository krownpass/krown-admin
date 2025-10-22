"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

type DashboardStats = {
  total_cafes: number;
  active_users: number;
  total_referrals: number;
};

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await api.get("/admin/dashboard/stats");
  if (!res.data.success) throw new Error(res.data.message || "Failed to load stats");
  return res.data.data;
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: fetchDashboardStats,
    staleTime: 60_000, // 1 minute
    refetchOnWindowFocus: false,
  });

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-red-500">
        Failed to load dashboard data. Please try again later.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      {/* Top 3 summary cards */}
      {isLoading ? (
        <>
          <Skeleton className="h-[100px] rounded-xl" />
          <Skeleton className="h-[100px] rounded-xl" />
          <Skeleton className="h-[100px] rounded-xl" />
        </>
      ) : (
        <>
          <Card className="p-5 transition-all hover:shadow-md">
            <div className="text-sm text-muted-foreground">Total Cafés</div>
            <div className="mt-2 text-3xl font-semibold">
              {data?.total_cafes ?? 0}
            </div>
          </Card>

          <Card className="p-5 transition-all hover:shadow-md">
            <div className="text-sm text-muted-foreground">Total Users</div>
            <div className="mt-2 text-3xl font-semibold">
              {data?.active_users ?? 0}
            </div>
          </Card>

          <Card className="p-5 transition-all hover:shadow-md">
            <div className="text-sm text-muted-foreground">Total Referrals</div>
            <div className="mt-2 text-3xl font-semibold">
              {data?.total_referrals ?? 0}
            </div>
          </Card>
        </>
      )}

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="md:col-span-2"
      >
        <Card className="p-5 min-h-[260px] flex flex-col justify-center items-center text-muted-foreground text-sm">
          Recent Activity Feed (coming soon)
        </Card>
      </motion.div>

      {/* Map / Analytics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="p-5 min-h-[260px] flex flex-col justify-center items-center text-muted-foreground text-sm">
          Map / Heatmap Analytics (coming soon)
        </Card>
      </motion.div>
    </motion.div>
  );
}
