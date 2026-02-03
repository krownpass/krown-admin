"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { TrendingDown } from "lucide-react";

export function BookingFunnel({ data }: { data: any }) {
  // Map API response keys (with _count suffix) to variable names
  const pending = Number(data?.pending_count || data?.pending) || 0;
  const accepted = Number(data?.accepted_count || data?.accepted) || 0;
  const visited = Number(data?.visited_count || data?.visited) || 0;

  // Correct Funnel Logic:
  // 1. Total Demand = All bookings that are either pending or approved (Pending + Accepted)
  // 2. Visited is a subset of Accepted, so we don't add it to the total.
  const totalDemand = pending + accepted;

  const chartData = [
    { name: "Total Requests", value: totalDemand, fill: "#64748b" }, // Slate-500
    { name: "Accepted", value: accepted, fill: "#3b82f6" },          // Blue-500
    { name: "Visited", value: visited, fill: "#10b981" },            // Emerald-500
  ];

  // Conversion Rates
  // 1. Acceptance Rate: (Accepted / Total Demand)
  const acceptanceRateNum = totalDemand > 0 ? (accepted / totalDemand) * 100 : 0;
  const acceptanceRate = acceptanceRateNum.toFixed(1);
  
  // 2. Visit Rate: (Visited / Accepted) - How many accepted bookings actually show up
  const visitRateNum = accepted > 0 ? (visited / accepted) * 100 : 0;
  const visitRate = visitRateNum.toFixed(1);
  
  // 3. Overall Conversion: (Visited / Total Demand)
  const overallConversionNum = totalDemand > 0 ? (visited / totalDemand) * 100 : 0;
  const overallConversion = overallConversionNum.toFixed(1);

  return (
    <Card className="col-span-1 border border-slate-200/70 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Booking Funnel
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">Request to Visit Pipeline</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Funnel Steps */}
        <div className="space-y-3">
          {/* Step 1: Total Demand (Pending + Accepted) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="text-sm font-medium text-slate-700">Requests</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{totalDemand}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-full bg-slate-500 rounded-full" style={{ width: "100%" }} />
            </div>
          </div>

          {/* Arrow & Conversion */}
          <div className="flex items-center justify-center py-1">
            <div className="text-xs text-slate-500 font-semibold">
              ↓ {acceptanceRate}% approved ({pending} pending)
            </div>
          </div>

          {/* Step 2: Accepted */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-slate-700">Accepted</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{accepted}</span>
            </div>
            <div className="h-2 rounded-full bg-blue-100">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${acceptanceRateNum}%` }} 
              />
            </div>
          </div>

          {/* Arrow & Conversion */}
          <div className="flex items-center justify-center py-1">
            <div className="text-xs text-blue-600 font-semibold">
              ↓ {visitRate}% visited
            </div>
          </div>

          {/* Step 3: Visited */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-slate-700">Visited</span>
              </div>
              <div className="h-2 rounded-full bg-emerald-100">
                {/* Width is relative to Accept step for visual continuity, or relative to Total. 
                    Relative to Total is more accurate for a funnel chart. */}
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${overallConversionNum}%` }} 
                />
              </div>
              <span className="text-sm font-bold text-slate-900">{visited}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Overall Success</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{overallConversion}%</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Requests</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalDemand}</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-600">
              {overallConversionNum > 50 ? "✓ Good funnel performance" : "⚠ Needs optimization"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
