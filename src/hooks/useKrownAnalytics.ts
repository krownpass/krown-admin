
"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export type KrownAnalyticsRange = "7d" | "10d" | "1m" | "3m" | "6m" | "1y";

export interface KrownAnalyticsSummary {
    total_amount: string | number;
    paid_bookings: string | number;
    normal_bookings: string | number;
}

export interface KrownAnalyticsChartPoint {
    date: string;
    paid_amount: string | number;
    normal_amount: string | number;
    total_amount: string | number;
    paid_count: string | number;
    normal_count: string | number;
}

export interface KrownAnalyticsRow {
    booking_id: string;
    booking_date: string;
    booking_start_time: string;
    booking_status: string;
    advance_paid: boolean;
    transaction_amount: string | number;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    transaction_id: string | null;
    user_name: string;
    user_mobile_no: string;
    cafe_id: string;
    cafe_name: string;
    payment_mode: string | null;
    transaction_status: string | null;
    transaction_created_at: string | null;
}

export interface KrownLeaderboardRow {
    cafe_id: string;
    cafe_name: string;
    total_amount: string | number;
    transactions_count: string | number;
    online_payments: string | number;
    online_percentage: string | number;
}

export interface KrownAnalyticsResponse {
    summary: KrownAnalyticsSummary | null;
    chart: KrownAnalyticsChartPoint[];
    rows: KrownAnalyticsRow[];
    leaderboard: KrownLeaderboardRow[];
}

export const useKrownAnalytics = (
    range: KrownAnalyticsRange,
    search?: string,
    cafeId?: string
) =>
    useQuery({
        queryKey: ["krown-analytics", range, search, cafeId],
        queryFn: async () => {
            const res = await api.get("/bookings/krown-analytics", {
                params: {
                    range,
                    search: search || undefined,
                    cafeId: cafeId || undefined,
                },
            });

            return res.data.data as KrownAnalyticsResponse;
        },
    });
