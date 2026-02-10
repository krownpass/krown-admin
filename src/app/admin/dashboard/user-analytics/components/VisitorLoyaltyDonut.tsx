"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { UserPlus, Repeat } from "lucide-react";

// Blue for New, Violet for Returning
const COLORS = ['#3b82f6', '#8b5cf6'];

export function VisitorLoyaltyDonut({ data }: { data: { new_visitors: number, returning_visitors: number } }) {
  const newV = Number(data?.new_visitors) || 0;
  const retV = Number(data?.returning_visitors) || 0;
  const total = newV + retV;

  const chartData = [
    { name: 'New', value: newV },
    { name: 'Returning', value: retV },
  ];

  const newPercentage = total > 0 ? ((newV / total) * 100).toFixed(1) : "0";
  const retPercentage = total > 0 ? ((retV / total) * 100).toFixed(1) : "0";

  return (
    <Card className="col-span-1 border border-slate-200/70 shadow-sm bg-white h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Visitor Loyalty
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">New vs Returning visitors</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Donut Chart */}
        <div className="flex justify-center">
          <div className="w-[140px] h-[140px]">
             {total === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs text-center border rounded-full border-dashed">
                    No Data
                </div>
             ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} visitors`, '']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
             )}
          </div>
        </div>

        {/* Custom Legend */}
        <div className="space-y-3 pt-2">
            
            {/* New Visitors */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-blue-50">
                        <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                         <p className="text-xs font-medium text-slate-700">New</p>
                         <p className="text-[10px] text-slate-500">({newPercentage}%)</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{newV}</p>
                </div>
            </div>

            {/* Returning Visitors */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-violet-50">
                        <Repeat className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <div>
                         <p className="text-xs font-medium text-slate-700">Returning</p>
                         <p className="text-[10px] text-slate-500">({retPercentage}%)</p>
                    </div>
                </div>
                <div className="text-right">
                     <p className="text-sm font-bold text-slate-800">{retV}</p>
                </div>
            </div>

             <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                 <span className="text-xs font-medium text-slate-500">Total</span>
                 <span className="text-xs font-bold text-slate-900">{total} visitors</span>
             </div>

        </div>
      </CardContent>
    </Card>
  );
}
