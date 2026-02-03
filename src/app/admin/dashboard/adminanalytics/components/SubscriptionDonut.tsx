"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { CreditCard, AlertCircle } from "lucide-react";

const COLORS = ['#10b981', '#ef4444'];

export function SubscriptionDonut({ data }: { data: any }) {
  const active = Number(data?.active) || 0;
  const expired = Number(data?.expired) || 0;
  const total = active + expired;

  const chartData = [
    { name: 'Active', value: active },
    { name: 'Expired', value: expired },
  ];

  const activePercentage = total > 0 ? ((active / total) * 100).toFixed(1) : "0";
  const expiredPercentage = total > 0 ? ((expired / total) * 100).toFixed(1) : "0";

  return (
    <Card className="col-span-1 border border-slate-200/70 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Subscription Health
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">Active vs Expired memberships</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Donut Chart */}
        <div className="flex justify-center">
          <div className="w-[180px] h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Center Text */}
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{total}</p>
          <p className="text-xs text-slate-500">Total Subscriptions</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Stats */}
        <div className="space-y-3">
          {/* Active */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-emerald-100">
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Active</p>
                <p className="text-xs text-emerald-600">{activePercentage}% of total</p>
              </div>
            </div>
            <p className="text-xl font-bold text-emerald-600">{active}</p>
          </div>

          {/* Expired */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Expired</p>
                <p className="text-xs text-red-600">{expiredPercentage}% of total</p>
              </div>
            </div>
            <p className="text-xl font-bold text-red-600">{expired}</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="pt-2 border-t border-slate-100">
          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600" 
              style={{ width: `${activePercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {active > expired ? "✓ Healthy subscription base" : "⚠ High expiration rate"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
