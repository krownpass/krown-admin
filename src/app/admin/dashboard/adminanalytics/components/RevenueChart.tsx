"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { BarChart3 } from "lucide-react";

export function RevenueChart({ data }: { data: any[] }) {
  return (
    <Card className="shadow-sm border border-slate-200/70 h-full">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b py-4">
        <div className="grid flex-1 gap-1">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-600" />
                Revenue Trend
            </CardTitle>
            <CardDescription className="text-xs">
                Dineout vs Subscription revenue
            </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100" />
            <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={10} 
                tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(val) => `₹${val}`}
            />
            <Tooltip 
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                itemStyle={{ fontSize: "12px", fontWeight: "500" }}
                labelStyle={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            <Line type="monotone" dataKey="dineoutRevenue" name="Dineout" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="subscriptionRevenue" name="Subscription" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
