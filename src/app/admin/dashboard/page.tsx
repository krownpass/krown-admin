"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    CartesianGrid,
    ResponsiveContainer,
    Bar as RechartsBar,
    BarChart as RechartsBarChart,
} from "recharts";

import {
    Users,
    IndianRupee,
    TrendingUp,
    RefreshCcw,
    Coffee,
    Percent,
    ChevronDown,
    BarChart as BarChartIcon,
    Search,
    ChevronRight,
} from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FootfallCard from "@/app/components/FootfallCard";

/* ======================================================
   TYPES
====================================================== */
export type ExtendedRange =
    | "7d"
    | "30d"
    | "90d"
    | "6m"
    | "1y"
    | "2y"
    | "3y"
    | "custom";

export interface FootfallPoint {
    date: string;
    count: number;
}

export interface FootfallWeeklyPoint {
    weekStart: string;
    count: number;
}

export interface FootfallMonthlyPoint {
    monthStart: string;
    count: number;
}

export interface PeakHourPoint {
    hour: number;
    count: number;
}

export interface RevenueByDayPoint {
    date: string;
    totalRevenue: number;
    dineoutRevenue: number;
    membershipRevenue: number;
}

export interface SummaryMetrics {
    totalCustomersServed: number;
    averageSpendPerCustomer: number;
    averageGroupSize: number;
    totalFreeDrinksRedeemed: number;
    mostRedeemedItemId: number | null;
    upsellRevenue: number;
    totalRevenue: number;
    averageBillValue: number;
    visitConversionRate?: number;
    upsellRate?: number;
}

export interface UserPreview {
    user_id: string | number;
    user_name: string;
    user_mobile_no: string;
    user_email: string;
}

export interface NewReturningCustomers {
    newCustomers: number;
    returningCustomers: number;
    newCustomersList: UserPreview[];
    returningCustomersList: UserPreview[];
}

export interface DrinkRedemptionsStats {
    totalRedeemed: number;
    top5: {
        item_id: number;
        item_name: string;
        count: number;
    }[];
}

export interface KrownCafeAnalyticsResponse {
    summary: SummaryMetrics;
    footfallDaily: FootfallPoint[];
    footfallGroups: {
        daily: FootfallPoint[];
        weekly: FootfallWeeklyPoint[];
        monthly: FootfallMonthlyPoint[];
    };
    newVsReturning: NewReturningCustomers;
    peakHours: PeakHourPoint[];
    revenueByDay: RevenueByDayPoint[];
    newUsersPreview: UserPreview[];
    allNewUsers: UserPreview[];
    drinkRedemptions: DrinkRedemptionsStats | null;
}

interface CafeOption {
    cafe_id: string;
    cafe_name: string;
}

/* ======================================================
   HELPERS / API
====================================================== */

const formatLocalDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("en-CA");

const numberFormat = (v: number) => new Intl.NumberFormat("en-IN").format(v);

const currencyFormat = (v: number, digits = 0) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: digits,
    }).format(v);

async function fetchCafes(): Promise<CafeOption[]> {
    const res = await api.get("/krown/analytics-list");
    return res.data.data;
}

async function fetchAnalytics(
    cafeId: string | null,
    range: ExtendedRange,
    from?: string | null,
    to?: string | null
): Promise<KrownCafeAnalyticsResponse> {
    const params: any = { range };
    if (from) params.from = from;
    if (to) params.to = to;

    const url =
        cafeId === null
            ? "/krown/main/analytics"
            : `/krown/cafe/${cafeId}/analytics`;

    const res = await api.get(url, { params });
    return res.data.data;
}

/* ======================================================
   MAIN PAGE
====================================================== */
export default function DashboardPage() {
    const [range, setRange] = useState<ExtendedRange>("30d");
    const [selectedCafeId, setSelectedCafeId] = useState("all");
    const [customFrom, setCustomFrom] = useState<string | null>(null);
    const [customTo, setCustomTo] = useState<string | null>(null);

    const effectiveCafeId =
        selectedCafeId === "all" ? null : selectedCafeId;

    const { data: cafes } = useQuery({
        queryKey: ["analytics-cafes"],
        queryFn: fetchCafes,
    });

    const {
        data,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useQuery({
        queryKey: [
            "analytics",
            { cafeId: effectiveCafeId, range, customFrom, customTo },
        ],
        queryFn: () =>
            fetchAnalytics(effectiveCafeId, range, customFrom, customTo),
        staleTime: 60000,
        refetchOnWindowFocus: false,
    });

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-red-500">
                Error loading analytics
            </div>
        );
    }

    const summary = data?.summary ?? null;

    const revenueByDay =
        data?.revenueByDay?.map((r) => ({
            ...r,
            date: formatLocalDate(r.date),
        })) ?? [];

    const nr = data?.newVsReturning ?? {
        newCustomers: 0,
        returningCustomers: 0,
        newCustomersList: [],
        returningCustomersList: [],
    };

    const totalNR = nr.newCustomers + nr.returningCustomers;
    const newPct = totalNR ? (nr.newCustomers / totalNR) * 100 : 0;
    const retPct = totalNR ? 100 - newPct : 0;

    const peakHours = data?.peakHours ?? [];
    const busiestHour =
        peakHours.length > 0
            ? peakHours.reduce((max, h) =>
                h.count > max.count ? h : max
            )
            : null;

    /* MODAL SEARCH */
    const [showNewModal, setShowNewModal] = useState(false);
    const [newSearch, setNewSearch] = useState("");

    const filteredNewUsers = useMemo(() => {
        return (data?.allNewUsers ?? []).filter((u) =>
            `${u.user_name} ${u.user_email} ${u.user_mobile_no}`
                .toLowerCase()
                .includes(newSearch.toLowerCase())
        );
    }, [newSearch, data]);

    /* ======================================================
        UI START
    ====================================================== */

    return (
        <TooltipProvider>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 pb-10"
            >
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Krown Café Analytics</h1>
                        <p className="text-muted-foreground">
                            Footfall • Revenue • Redemptions • Customers
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                        {/* Café Select */}
                        <Select value={selectedCafeId} onValueChange={setSelectedCafeId}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select Café" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cafés</SelectItem>
                                {(cafes ?? []).map((c) => (
                                    <SelectItem key={c.cafe_id} value={c.cafe_id}>
                                        {c.cafe_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <ChevronDown className="w-4 h-4 -ml-6 text-muted-foreground pointer-events-none" />

                        {/* Range Buttons */}
                        <div className="flex gap-1">
                            {[
                                "7d",
                                "30d",
                                "90d",
                                "6m",
                                "1y",
                                "2y",
                                "3y",
                                "custom",
                            ].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r as ExtendedRange)}
                                    className={`px-3 py-1 rounded-full text-xs border ${range === r
                                        ? "bg-primary text-white"
                                        : "text-muted-foreground hover:bg-accent"
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        {range === "custom" && (
                            <div className="flex items-center gap-1">
                                <input
                                    type="date"
                                    className="border rounded-full px-3 py-1 text-xs"
                                    value={customFrom ?? ""}
                                    onChange={(e) =>
                                        setCustomFrom(e.target.value || null)
                                    }
                                />

                                <span className="text-xs">to</span>

                                <input
                                    type="date"
                                    className="border rounded-full px-3 py-1 text-xs"
                                    value={customTo ?? ""}
                                    onChange={(e) =>
                                        setCustomTo(e.target.value || null)
                                    }
                                />
                            </div>
                        )}

                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="px-4 py-1 rounded-full border text-xs flex items-center gap-2"
                        >
                            <RefreshCcw
                                className={`w-3 h-3 ${isFetching ? "animate-spin" : ""
                                    }`}
                            />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {isLoading || !summary ? (
                        <>
                            <Skeleton className="h-[110px]" />
                            <Skeleton className="h-[110px]" />
                            <Skeleton className="h-[110px]" />
                            <Skeleton className="h-[110px]" />
                        </>
                    ) : (
                        <>
                            <Card className="p-4 rounded-2xl border bg-gradient-to-br from-slate-950 to-slate-900 text-white">
                                <p className="text-xs text-slate-400 uppercase">
                                    Customers Served
                                </p>
                                <p className="text-3xl font-semibold mt-2 leading-tight">
                                    {numberFormat(summary.totalCustomersServed)}
                                </p>
                                <Users className="w-5 h-5 mt-3 text-sky-300" />
                            </Card>

                            <Card className="p-4 rounded-2xl border">
                                <p className="text-xs text-muted-foreground uppercase">
                                    Total Revenue
                                </p>
                                <p className="text-3xl font-semibold mt-2 leading-tight">
                                    {currencyFormat(summary.totalRevenue)}
                                </p>
                                <IndianRupee className="w-5 h-5 mt-3 text-emerald-600" />
                            </Card>

                            <Card className="p-4 rounded-2xl border">
                                <p className="text-xs text-muted-foreground uppercase">
                                    Avg Bill Value
                                </p>
                                <p className="text-3xl font-semibold mt-2 leading-tight">
                                    {currencyFormat(summary.averageBillValue)}
                                </p>
                                <BarChartIcon className="w-5 h-5 mt-3 text-indigo-600" />
                            </Card>

                            <Card className="p-4 rounded-2xl border bg-gradient-to-br from-orange-50 to-rose-50">
                                <p className="text-xs text-amber-600 uppercase">
                                    Upsell Revenue
                                </p>
                                <p className="text-3xl font-semibold mt-2 leading-tight">
                                    {currencyFormat(summary.upsellRevenue)}
                                </p>
                                <TrendingUp className="w-5 h-5 mt-3 text-amber-700" />
                            </Card>
                        </>
                    )}
                </div>

                <Separator />

                {/* ======================================================
                    ROW 1 — LINE CHART + NEW/RETURNING SIDE BY SIDE
                ====================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* LINE CHART (2/3) */}
                    <Card className="lg:col-span-2 p-4 rounded-2xl border shadow-sm">
                        <p className="text-xs uppercase text-muted-foreground">
                            Krown Usage Trend
                        </p>

                        <div className="h-[260px] mt-4">
                            {isLoading ? (
                                <Skeleton className="h-full rounded-xl" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueByDay}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" fontSize={10} tickLine={false} />
                                        <YAxis fontSize={10} tickLine={false} />
                                        <RechartsTooltip />
                                        <Line
                                            dataKey="totalRevenue"
                                            type="monotone"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>

                    {/* NEW vs RETURNING (1/3) */}
                    <Card className="p-5 rounded-2xl border shadow-sm relative">
                        <p className="text-[11px] uppercase text-muted-foreground">
                            New vs Returning
                        </p>

                        {!isLoading && (
                            <button
                                onClick={() => setShowNewModal(true)}
                                className="absolute top-5 right-5 text-xs flex items-center gap-1 text-blue-600 hover:underline"
                            >
                                View Customers <ChevronRight className="w-3 h-3" />
                            </button>
                        )}

                        {isLoading ? (
                            <Skeleton className="h-[80px] mt-4 rounded-xl" />
                        ) : (
                            <>
                                <div className="flex justify-between text-sm mt-4">
                                    <span>
                                        <b>New:</b> {nr.newCustomers} ({newPct.toFixed(1)}%)
                                    </span>
                                    <span>
                                        <b>Returning:</b> {nr.returningCustomers} (
                                        {retPct.toFixed(1)}%)
                                    </span>
                                </div>

                                {/* List top 5 */}
                                <div className="mt-4 space-y-2">
                                    {[
                                        ...nr.newCustomersList.map((u) => ({ ...u, type: "new" })),
                                        ...nr.returningCustomersList.map((u) => ({
                                            ...u,
                                            type: "returning",
                                        })),
                                    ]
                                        .slice(0, 5)
                                        .map((u) => (
                                            <div
                                                key={u.user_id}
                                                className="p-2 rounded-lg bg-slate-100 flex justify-between text-xs"
                                            >
                                                <span>
                                                    {u.user_name}{" "}
                                                    <span
                                                        className={
                                                            u.type === "new"
                                                                ? "text-green-600"
                                                                : "text-yellow-600"
                                                        }
                                                    >
                                                        ({u.type})
                                                    </span>
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {u.user_mobile_no}
                                                </span>
                                            </div>
                                        ))}
                                </div>

                                <div className="h-2 mt-4 rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-500"
                                        style={{ width: `${newPct}%` }}
                                    />
                                </div>
                            </>
                        )}
                    </Card>
                </div>

                {/* ======================================================
                    ROW 2 — DAYWISE REVENUE (FULL WIDTH)
                ====================================================== */}

                <FootfallCard
                    loading={isLoading}
                    daily={data?.footfallGroups.daily ?? []}
                    weekly={data?.footfallGroups.weekly ?? []}
                    monthly={data?.footfallGroups.monthly ?? []}
                />
                {/* CUSTOMER SEARCH MODAL */}
                <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>New Customers</DialogTitle>
                        </DialogHeader>

                        <div className="flex items-center gap-2 mt-3">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or phone..."
                                value={newSearch}
                                onChange={(e) => setNewSearch(e.target.value)}
                            />
                        </div>

                        <div className="mt-4 max-h-[400px] overflow-y-auto space-y-3">
                            {filteredNewUsers.map((u: any) => (
                                <div
                                    key={u.user_id}
                                    className="p-3 border rounded-xl shadow-sm hover:bg-accent transition"
                                >
                                    <p className="font-semibold">{u.user_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {u.user_email || "No email"}
                                    </p>
                                    <p className="text-sm">{u.user_mobile_no}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Gender: {u.gender || "Not Provided"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* PEAK HOURS + FREE DRINKS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Peak Hours */}
                    <Card className="col-span-2 p-4 rounded-2xl border shadow-sm">
                        <div className="flex justify-between">
                            <p className="text-xs uppercase text-muted-foreground">
                                Peak Visit Times
                            </p>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="text-[10px] bg-slate-100 px-2 py-1 rounded-full">
                                        {busiestHour
                                            ? `Busiest: ${busiestHour.hour}:00`
                                            : "No data"}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Hour with highest footfall
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="h-[220px] mt-4">
                            {isLoading ? (
                                <Skeleton className="h-full rounded-xl" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={peakHours}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="hour" fontSize={10} tickLine={false} />
                                        <YAxis fontSize={10} tickLine={false} />
                                        <RechartsTooltip />
                                        <RechartsBar dataKey="count" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>

                    {/* Free Drinks */}
                    <Card className="p-4 rounded-2xl border shadow-sm">
                        <p className="text-xs uppercase text-muted-foreground">
                            Free Drinks Redeemed
                        </p>

                        {isLoading ? (
                            <Skeleton className="h-[80px] mt-4 rounded-xl" />
                        ) : (
                            <>
                                <p className="text-2xl font-semibold mt-3">
                                    {numberFormat(
                                        data?.drinkRedemptions?.totalRedeemed ?? 0
                                    )}
                                </p>

                                <div className="mt-4 space-y-2 text-xs">
                                    {(data?.drinkRedemptions?.top5 ?? [])
                                        .slice(0, 5)
                                        .map((d) => (
                                            <div
                                                key={d.item_id}
                                                className="flex justify-between bg-slate-100 p-2 rounded-lg"
                                            >
                                                <span>{d.item_name}</span>
                                                <span>{d.count}</span>
                                            </div>
                                        ))}
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            </motion.div>
        </TooltipProvider>
    );
}
