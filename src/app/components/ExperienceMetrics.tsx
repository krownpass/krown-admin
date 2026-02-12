"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, MousePointerClick, Eye, ShoppingCart } from "lucide-react";

interface FunnelStep {
    name: string;
    value: number;
    rate?: string;
    fill: string;
}

interface BookingFunnelData {
    step1_views: number;
    step2_clicks: number;
    step3_bookings: number;
    ctr: number;
    conversionRate: number;
}

interface SaveFunnelData {
    step1_views: number;
    step2_saves: number;
    step3_visits: number;
    viewToSaveRate: number;
    saveToVisitRate: number;
}

interface RecFunnelData {
    impressions: number;
    clicks: number;
    ctr: number;
}

interface ExperienceData {
    bookingFunnel: BookingFunnelData;
    saveFunnel: SaveFunnelData;
    recFunnel: RecFunnelData;
}

interface ExperienceMetricsProps {
    range: string;
    from?: string | null;
    to?: string | null;
}

export default function ExperienceMetrics({ range, from, to }: ExperienceMetricsProps) {
    const { data: metricsData, isLoading, error } = useQuery<ExperienceData>({
        queryKey: ["experience-metrics", range, from, to],
        queryFn: async () => {
            const params: any = { range };
            if (from) params.from = from;
            if (to) params.to = to;
            
            const res = await api.get("/krown/experience-metrics", { params });
            return res.data;
        }
    });

    const data = metricsData;

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    if (error) return <div className="text-red-500 p-4">Failed to load experience metrics</div>;
    if (!data) return null;

    // 1. View -> Booking -> Completion Data
    const bookingChartData = [
        { name: "Views", value: data.bookingFunnel.step1_views, fill: "#3b82f6" }, 
        { name: "Clicks", value: data.bookingFunnel.step2_clicks, fill: "#8b5cf6", rate: `${data.bookingFunnel.ctr}% CTR` },
        { name: "Bookings", value: data.bookingFunnel.step3_bookings, fill: "#22c55e", rate: `${data.bookingFunnel.conversionRate}% Conv` }
    ];

    // 2. View -> Save -> Visit Data
    const saveChartData = [
        { name: "Views", value: data.saveFunnel.step1_views, fill: "#f59e0b" }, 
        { name: "Saves", value: data.saveFunnel.step2_saves, fill: "#ea580c", rate: `${data.saveFunnel.viewToSaveRate}% Save Rate` },
        { name: "Visits", value: data.saveFunnel.step3_visits, fill: "#ef4444", rate: `${data.saveFunnel.saveToVisitRate}% Visit Rate` }
    ];

    // 3. Rec -> Action Data
    const recChartData = [
        { name: "Impressions", value: data.recFunnel.impressions, fill: "#06b6d4" },
        { name: "Clicks", value: data.recFunnel.clicks, fill: "#0ea5e9", rate: `${data.recFunnel.ctr}% CTR` }
    ];

    const renderCustomBarLabel = ({ x, y, width, value, index, data }: any) => {
        return (
             <text x={x + width / 2} y={y - 10} fill="#666" textAnchor="middle" dy={-6} fontSize={12}>
                {value.toLocaleString()}
             </text>
        );
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800">Conversion Funnels</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Booking Conversion Funnel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Discovery to Booking</CardTitle>
                        <CardDescription>View → Click → Book</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bookingChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                                <Bar dataKey="value" barSize={50} radius={[4, 4, 0, 0]} label={renderCustomBarLabel}>
                                    {bookingChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
                             <span>{data.bookingFunnel.ctr}% CTR</span>
                             <span>{data.bookingFunnel.conversionRate}% Conv.</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Engagement Funnel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Engagement to Visit</CardTitle>
                        <CardDescription>View → Save → Visit</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={saveChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                                <Bar dataKey="value" barSize={50} radius={[4, 4, 0, 0]} label={renderCustomBarLabel}>
                                    {saveChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                         <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
                             <span>{data.saveFunnel.viewToSaveRate}% Save Rate</span>
                             <span>{data.saveFunnel.saveToVisitRate}% Visit Rate</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Recommendation Funnel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Recommendation Effectiveness</CardTitle>
                        <CardDescription>Impression → Click</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={recChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                                <Bar dataKey="value" barSize={50} radius={[4, 4, 0, 0]} label={renderCustomBarLabel}>
                                    {recChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                         <div className="text-center text-xs text-muted-foreground mt-2">
                             {data.recFunnel.ctr}% Click-Through Rate
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
