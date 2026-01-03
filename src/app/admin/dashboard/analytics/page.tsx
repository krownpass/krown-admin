"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
// Recharts
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    AreaChart,
    Area
} from "recharts";

// Icons (NO AreaChart here)
import {
    Search,
    IndianRupee,
    Wallet,
    CalendarDays,
    Download,
    BarChart3,
} from "lucide-react";
import { useKrownAnalytics, KrownAnalyticsRange, KrownAnalyticsRow } from "@/hooks/useKrownAnalytics";

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    Table,
    TableHeader,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useAdmin } from "@/hooks/useAdmin";

/* ------------ Constants ----------- */

const RANGE_LABELS: Record<KrownAnalyticsRange, string> = {
    "7d": "Last 7 days",
    "10d": "Last 10 days",
    "1m": "Last month",
    "3m": "Last 3 months",
    "6m": "Last 6 months",
    "1y": "Last year",
};

const revenueChartConfig = {
    paid_amount: {
        label: "Paid revenue",
        color: "var(--chart-1)",
    },
    normal_amount: {
        label: "Normal revenue",
        color: "var(--chart-2)",
    },
    total_amount: {
        label: "Total revenue",
        color: "var(--chart-3)",
    },
} as const;

const bookingsChartConfig = {
    paid_count: {
        label: "Paid bookings",
        color: "var(--chart-1)",
    },
    normal_count: {
        label: "Normal bookings",
        color: "var(--chart-2)",
    },
} as const;

// small debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);

    return debounced;
}

export default function KrownAnalyticsPage() {
    // Ensure only master_admin / krown_admin can see this
    const { admin: user, loading: userLoading } = useAdmin();

    const [range, setRange] = useState<KrownAnalyticsRange>("7d");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 400);

    const [selectedCafeId, setSelectedCafeId] = useState<string | undefined>(
        undefined
    );

    const { data, isLoading } = useKrownAnalytics(
        range,
        debouncedSearch || undefined,
        selectedCafeId
    );

    const summary = data?.summary;
    const rows = data?.rows ?? [];
    const leaderboard = data?.leaderboard ?? [];

    // Pagination
    const PAGE_SIZE = 15;
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, range, selectedCafeId, rows.length]);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const paginatedRows = useMemo(
        () =>
            rows.slice(
                (page - 1) * PAGE_SIZE,
                (page - 1) * PAGE_SIZE + PAGE_SIZE
            ),
        [rows, page]
    );

    // Chart data mapping (with safe numbers)
    const chartData = useMemo(() => {
        if (!data?.chart) return [];

        return data.chart.map((p) => ({
            ...p,
            label: format(new Date(p.date), "dd MMM"),
            paid_amount: Number(p.paid_amount ?? 0),
            normal_amount: Number(p.normal_amount ?? 0),
            total_amount: Number(p.total_amount ?? 0),
            paid_count: Number(p.paid_count ?? 0),
            normal_count: Number(p.normal_count ?? 0),
        }));
    }, [data]);

    const totalPaidBookings = Number(summary?.paid_bookings ?? 0);
    const totalNormalBookings = Number(summary?.normal_bookings ?? 0);
    const totalRevenue = Number(summary?.total_amount ?? 0);

    // line chart single-series toggle
    type RevenueSeriesKey = "paid_amount" | "normal_amount" | "total_amount";
    const [activeSeries, setActiveSeries] =
        useState<RevenueSeriesKey>("paid_amount");

    const revenueTotals = useMemo(
        () => ({
            paid_amount: chartData.reduce((acc, curr) => acc + (curr.paid_amount || 0), 0),
            normal_amount: chartData.reduce((acc, curr) => acc + (curr.normal_amount || 0), 0),
            total_amount: chartData.reduce((acc, curr) => acc + (curr.total_amount || 0), 0),
        }),
        [chartData]
    );

    const activeLabelMap: Record<RevenueSeriesKey, string> = {
        paid_amount: "Paid revenue",
        normal_amount: "Normal revenue",
        total_amount: "Total revenue",
    };

    const handleExportCSV = () => {
        if (!rows.length) return;

        const header = [
            "Booking Index",
            "Booking ID",
            "Cafe Name",
            "Date",
            "Time",
            "User Name",
            "User Phone",
            "Payment Mode",
            "Advance Paid",
            "Amount",
            "Booking Status",
            "Transaction Status",
            "Order ID",
            "Payment ID",
            "Transaction ID",
        ];

        const csvRows = rows.map((r, idx) => [
            idx + 1,
            r.booking_id,
            r.cafe_name,
            r.booking_date,
            r.booking_start_time,
            r.user_name,
            r.user_mobile_no,
            r.payment_mode ?? "",
            r.advance_paid ? "Paid" : "Normal",
            r.transaction_amount ?? "",
            r.booking_status,
            r.transaction_status ?? "",
            r.razorpay_order_id ?? "",
            r.razorpay_payment_id ?? "",
            r.transaction_id ?? "",
        ]);

        const csv =
            [header, ...csvRows]
                .map((line) =>
                    line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
                )
                .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "krown-analytics.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = () => {
        if (!rows.length) return;

        const win = window.open("", "_blank");
        if (!win) return;

        const safeTotalRevenue = totalRevenue;

        const html = `
      <html>
        <head>
          <title>Krown Analytics</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 16px; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            h2 { font-size: 14px; margin-top: 16px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Krown Bookings & Payments</h1>
          ${summary
                ? `<h2>Summary</h2>
            <p><strong>Total Revenue:</strong> ₹${safeTotalRevenue.toLocaleString(
                    "en-IN"
                )}</p>
            <p><strong>Paid Bookings:</strong> ${totalPaidBookings} &nbsp; | &nbsp; <strong>Normal Bookings:</strong> ${totalNormalBookings}</p>`
                : ""
            }
          <h2>Bookings (first ${Math.min(
                60,
                rows.length
            )})</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Cafe</th>
                <th>Booking ID</th>
                <th>User</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Time</th>
                <th>Mode</th>
                <th>Paid?</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .slice(0, 60)
                .map(
                    (r: KrownAnalyticsRow, idx: number) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${r.cafe_name}</td>
                  <td>${r.booking_id}</td>
                  <td>${r.user_name}</td>
                  <td>${r.user_mobile_no}</td>
                  <td>${r.booking_date}</td>
                  <td>${r.booking_start_time}</td>
                  <td>${r.payment_mode ?? ""}</td>
                  <td>${r.advance_paid ? "Paid" : "Normal"}</td>
                  <td>₹${r.transaction_amount ?? 0}</td>
                  <td>${r.booking_status}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;

        win.document.open();
        win.document.write(html);
        win.document.close();
    };

    if (userLoading) {
        return (
            <p className="mt-10 text-center text-sm text-muted-foreground">
                Loading admin analytics…
            </p>
        );
    }

    // Optional: role guard here if needed

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 md:p-10 space-y-8"
        >
            {/* HEADER */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-7 w-7 text-slate-800" />
                        <span className="text-slate-900">Krown Analytics</span>
                    </h1>
                    <p className="text-sm text-slate-500">
                        Global view across all cafés. Filter by café or see overall trends.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* range */}
                    <Select
                        value={range}
                        onValueChange={(v) => setRange(v as KrownAnalyticsRange)}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="10d">Last 10 days</SelectItem>
                            <SelectItem value="1m">Last month</SelectItem>
                            <SelectItem value="3m">Last 3 months</SelectItem>
                            <SelectItem value="6m">Last 6 months</SelectItem>
                            <SelectItem value="1y">Last year</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* café filter from leaderboard */}
                    <Select
                        value={selectedCafeId || "all"}
                        onValueChange={(v) =>
                            setSelectedCafeId(v === "all" ? undefined : v)
                        }
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All cafés" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All cafés</SelectItem>
                            {leaderboard.map((cafe) => (
                                <SelectItem key={cafe.cafe_id} value={cafe.cafe_id}>
                                    {cafe.cafe_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleExportCSV}
                        disabled={!rows.length}
                    >
                        <Download className="h-4 w-4" />
                        CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleExportPDF}
                        disabled={!rows.length}
                    >
                        <Download className="h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-24 rounded-2xl" />
                    <Skeleton className="h-24 rounded-2xl" />
                    <Skeleton className="h-24 rounded-2xl" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        icon={<IndianRupee className="w-5 h-5 text-emerald-700" />}
                        label={
                            selectedCafeId ? "Cafe revenue" : "Total Krown revenue"
                        }
                        value={`₹${totalRevenue.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                        })}`}
                        sub={RANGE_LABELS[range]}
                    />
                    <StatCard
                        icon={<Wallet className="w-5 h-5 text-sky-700" />}
                        label="Paid bookings"
                        value={totalPaidBookings}
                        sub="Advance received"
                    />
                    <StatCard
                        icon={<CalendarDays className="w-5 h-5 text-amber-700" />}
                        label="Normal bookings"
                        value={totalNormalBookings}
                        sub="No advance"
                    />
                </div>
            )}

            {/* REVENUE TREND AREA CHART (INTERACTIVE) */}
            <Card className="shadow-sm border border-slate-200/70">
                <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                    <div className="grid flex-1 gap-1">
                        <CardTitle className="flex items-center gap-2 text-slate-900">
                            <BarChart3 className="h-5 w-5 text-slate-600" />
                            Revenue Trend
                        </CardTitle>
                        <CardDescription>
                            Paid + normal revenue trend over selected period
                        </CardDescription>
                    </div>

                    {/* Time Range Selector (still uses your "range" state) */}
                    <Select value={range} onValueChange={(v) => setRange(v as KrownAnalyticsRange)}>
                        <SelectTrigger className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex">
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="10d">Last 10 days</SelectItem>
                            <SelectItem value="1m">Last month</SelectItem>
                            <SelectItem value="3m">Last 3 months</SelectItem>
                            <SelectItem value="6m">Last 6 months</SelectItem>
                            <SelectItem value="1y">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>

                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 h-[320px]">
                    {isLoading ? (
                        <Skeleton className="w-full h-full rounded-2xl" />
                    ) : (
                        <ChartContainer
                            config={revenueChartConfig}
                            className="aspect-auto h-full w-full"
                        >
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="fillPaid" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-paid_amount)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-paid_amount)" stopOpacity={0.1} />
                                    </linearGradient>

                                    <linearGradient id="fillNormal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-normal_amount)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-normal_amount)" stopOpacity={0.1} />
                                    </linearGradient>

                                    <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-total_amount)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-total_amount)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid vertical={false} />

                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={32}
                                />

                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            indicator="dot"
                                            labelFormatter={(value) => value}
                                            formatter={(v, key) => {
                                                const k = key as string;

                                                // SAFETY CHECK: ignore keys not in revenueChartConfig
                                                const cfg = revenueChartConfig[k as keyof typeof revenueChartConfig];
                                                if (!cfg) {
                                                    return (
                                                        <div className="flex w-full justify-between text-xs">
                                                            <span className="text-slate-500">{k}</span>
                                                            <span className="font-mono font-semibold text-slate-900">
                                                                ₹{Number(v).toLocaleString("en-IN")}
                                                            </span>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="flex w-full justify-between text-xs">
                                                        <span className="text-slate-500">{cfg.label}</span>
                                                        <span className="font-mono font-semibold text-slate-900">
                                                            ₹{Number(v).toLocaleString("en-IN")}
                                                        </span>
                                                    </div>
                                                );
                                            }}
                                        />
                                    }
                                />

                                {/* Stacked REVENUE AREAS */}
                                <Area
                                    dataKey="normal_amount"
                                    name="Normal revenue"
                                    type="natural"
                                    fill="url(#fillNormal)"
                                    stroke="var(--color-normal_amount)"
                                    stackId="rev"
                                />

                                <Area
                                    dataKey="paid_amount"
                                    name="Paid revenue"
                                    type="natural"
                                    fill="url(#fillPaid)"
                                    stroke="var(--color-paid_amount)"
                                    stackId="rev"
                                />

                                <Area
                                    dataKey="total_amount"
                                    name="Total revenue"
                                    type="natural"
                                    fill="url(#fillTotal)"
                                    stroke="var(--color-total_amount)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
            {/* LEADERBOARD + BOOKINGS BAR CHART */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                {/* BOOKINGS BAR CHART */}
                <Card className="shadow-sm border border-slate-200/70">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-slate-600" />
                            Bookings per day
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[260px]">
                        {isLoading ? (
                            <Skeleton className="w-full h-full rounded-2xl" />
                        ) : (
                            <ChartContainer
                                id="krown-bookings-bar"
                                config={bookingsChartConfig}
                                className="h-full w-full"
                            >
                                <BarChart data={chartData}>
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="3 3"
                                        className="stroke-slate-200"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tick={{
                                            fontSize: 10,
                                            fill: "hsl(var(--muted-foreground))",
                                        }}
                                    />
                                    <YAxis
                                        tick={{
                                            fontSize: 10,
                                            fill: "hsl(var(--muted-foreground))",
                                        }}
                                        allowDecimals={false}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent
                                                indicator="dashed"
                                                className="w-[160px]"
                                            />
                                        }
                                    />
                                    <Bar
                                        dataKey="paid_count"
                                        name="Paid"
                                        fill="var(--color-paid_count)"
                                        radius={4}
                                    />
                                    <Bar
                                        dataKey="normal_count"
                                        name="Normal"
                                        fill="var(--color-normal_count)"
                                        radius={4}
                                    />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* LEADERBOARD */}
                <Card className="shadow-sm border border-slate-200/70">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold text-slate-900">
                                Café leaderboard
                            </CardTitle>
                            <p className="text-xs text-slate-500">
                                Revenue generated by each café in this period.
                            </p>
                        </div>
                        <Badge
                            variant="outline"
                            className="text-[11px] border-slate-300 text-slate-700"
                        >
                            {leaderboard.length} cafés
                        </Badge>
                    </CardHeader>
                    <CardContent className="max-h-[280px] overflow-y-auto">
                        {isLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-10 w-full rounded-md" />
                                ))}
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <p className="text-xs text-slate-500">
                                No café transactions yet for this period.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {leaderboard.map((cafe, index) => (
                                    <button
                                        key={cafe.cafe_id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedCafeId((current) =>
                                                current === cafe.cafe_id ? undefined : cafe.cafe_id
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50 transition"
                                        data-active={selectedCafeId === cafe.cafe_id}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-semibold text-slate-500 w-6 text-right">
                                                    #{index + 1}
                                                </span>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900">
                                                        {cafe.cafe_name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        {Number(
                                                            cafe.transactions_count ?? 0
                                                        ).toLocaleString("en-IN")}{" "}
                                                        payments •{" "}
                                                        {Number(
                                                            cafe.online_percentage ?? 0
                                                        ).toLocaleString("en-IN")}
                                                        % online
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-semibold text-emerald-700">
                                                    ₹
                                                    {Number(
                                                        cafe.total_amount ?? 0
                                                    ).toLocaleString("en-IN", {
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* SEARCH + TABLE + PAGINATION */}
            <div className="space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search cafe, order ID, payment ID, transaction ID, user, phone…"
                            className="pl-9 text-sm border-slate-300 focus-visible:ring-slate-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="text-xs text-slate-500">
                        Showing page{" "}
                        <span className="font-semibold text-slate-700">{page}</span> of{" "}
                        <span className="font-semibold text-slate-700">{totalPages}</span>{" "}
                        • {rows.length} total records
                    </div>
                </div>

                <Card className="shadow-sm border border-slate-200/70">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold text-slate-900">
                                Bookings & payments (Krown)
                            </CardTitle>
                            <p className="text-xs text-slate-500">
                                All bookings in the selected period. Filter by café using the dropdown above.
                            </p>
                        </div>
                        <Badge
                            variant="outline"
                            className="text-[11px] border-slate-300 text-slate-700"
                        >
                            {rows.length} records
                        </Badge>
                    </CardHeader>

                    <CardContent className="overflow-x-auto">
                        {isLoading ? (
                            <div className="space-y-2 py-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Skeleton key={i} className="h-10 w-full rounded-md" />
                                ))}
                            </div>
                        ) : rows.length === 0 ? (
                            <p className="text-sm text-slate-500 py-6 text-center">
                                No bookings found for this filter.
                            </p>
                        ) : (
                            <>
                                <div className="rounded-md border border-slate-200">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/70">
                                                <TableHead className="text-xs text-slate-600">
                                                    #
                                                </TableHead>
                                                <TableHead className="text-xs text-slate-600">
                                                    Café
                                                </TableHead>
                                                <TableHead className="text-xs text-slate-600">
                                                    Booking
                                                </TableHead>
                                                <TableHead className="text-xs text-slate-600">
                                                    Date & time
                                                </TableHead>
                                                <TableHead className="text-xs text-slate-600">
                                                    User
                                                </TableHead>
                                                <TableHead className="text-xs text-slate-600">
                                                    Mode
                                                </TableHead>
                                                <TableHead className="text-xs text-right text-slate-600">
                                                    Amount
                                                </TableHead>
                                                <TableHead className="text-xs text-slate-600">
                                                    Status
                                                </TableHead>
                                                <TableHead className="text-xs text-slate-600">
                                                    IDs
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedRows.map((r, idx) => {
                                                const displayIndex =
                                                    (page - 1) * PAGE_SIZE + idx + 1;

                                                return (
                                                    <TableRow key={`${r.booking_id}-${r.cafe_id}`}>
                                                        <TableCell className="align-top text-xs text-slate-700">
                                                            #{displayIndex.toString().padStart(3, "0")}
                                                        </TableCell>

                                                        <TableCell className="align-top text-xs text-slate-800">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">
                                                                    {r.cafe_name}
                                                                </span>
                                                                <span className="text-[11px] text-slate-500">
                                                                    {r.cafe_id.slice(0, 8)}…
                                                                </span>
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="align-top text-xs text-slate-800">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-semibold text-slate-900">
                                                                    #{r.booking_id}
                                                                </span>
                                                                <Badge
                                                                    variant={
                                                                        r.advance_paid ? "default" : "secondary"
                                                                    }
                                                                    className={`w-fit text-[10px] ${r.advance_paid
                                                                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                                                        }`}
                                                                >
                                                                    {r.advance_paid
                                                                        ? "Paid booking"
                                                                        : "Normal booking"}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="align-top text-xs text-slate-800">
                                                            <div className="flex flex-col">
                                                                <span>
                                                                    {format(
                                                                        new Date(r.booking_date),
                                                                        "dd MMM yyyy"
                                                                    )}
                                                                </span>
                                                                <span className="text-[11px] text-slate-500">
                                                                    {r.booking_start_time?.slice(0, 5)}
                                                                </span>
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="align-top text-xs">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-900">
                                                                    {r.user_name}
                                                                </span>
                                                                <span className="text-[11px] text-slate-500">
                                                                    {r.user_mobile_no}
                                                                </span>
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="align-top text-xs text-slate-800">
                                                            {r.payment_mode ?? "N/A"}
                                                        </TableCell>

                                                        <TableCell className="align-top text-right text-xs">
                                                            {r.advance_paid ? (
                                                                <span className="font-semibold text-emerald-700">
                                                                    ₹
                                                                    {Number(
                                                                        r.transaction_amount ?? 0
                                                                    ).toLocaleString("en-IN", {
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400">—</span>
                                                            )}
                                                        </TableCell>

                                                        <TableCell className="align-top text-xs">
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] border-slate-300 text-slate-800"
                                                            >
                                                                {r.booking_status}
                                                            </Badge>
                                                            {r.transaction_status && (
                                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                                    Tx: {r.transaction_status}
                                                                </p>
                                                            )}
                                                        </TableCell>

                                                        <TableCell className="align-top text-[10px] max-w-[260px] space-y-1 text-slate-800">
                                                            {r.razorpay_order_id && (
                                                                <p>
                                                                    <span className="font-medium text-slate-700">
                                                                        Order:
                                                                    </span>{" "}
                                                                    {r.razorpay_order_id}
                                                                </p>
                                                            )}
                                                            {r.razorpay_payment_id && (
                                                                <p>
                                                                    <span className="font-medium text-slate-700">
                                                                        Payment:
                                                                    </span>{" "}
                                                                    {r.razorpay_payment_id}
                                                                </p>
                                                            )}
                                                            {r.transaction_id && (
                                                                <p>
                                                                    <span className="font-medium text-slate-700">
                                                                        Tx:
                                                                    </span>{" "}
                                                                    {r.transaction_id}
                                                                </p>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* pagination */}
                                <div className="flex items-center justify-end gap-3 pt-3 text-xs text-slate-600">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-3"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Prev
                                    </Button>
                                    <span>
                                        Page{" "}
                                        <span className="font-semibold text-slate-800">{page}</span>{" "}
                                        of{" "}
                                        <span className="font-semibold text-slate-800">
                                            {totalPages}
                                        </span>
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-3"
                                        onClick={() =>
                                            setPage((p) => Math.min(totalPages, p + 1))
                                        }
                                        disabled={page === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}

/* ---------- Small stat card ---------- */

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
        <Card className="shadow-sm border border-slate-200/70">
            <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                        {label}
                    </p>
                    <p className="text-xl font-semibold text-slate-900">{value}</p>
                    {sub && (
                        <p className="text-[11px] text-slate-500">
                            {sub}
                        </p>
                    )}
                </div>
                <div className="p-2 rounded-full bg-slate-100 border border-slate-200">
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}
