"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "lucide-react";

export function RedemptionMetrics({ data }: { data: any }) {
  // Ensure these match the keys from the SQL query
  const totalClaims = Number(data?.total_claims || 0);
  const totalRedeemed = Number(data?.total_redemptions || 0);
  const wasted = Number(data?.wasted_claims || 0);
  const rate = Number(data?.redemption_rate || 0);
  
  // Health Logic
  // Rate > 60% is excellent. < 20% means users act on impulse but don't visit.
  const isHealthy = rate >= 50;
  const isCritical = rate <= 20;

  return (
    <Card className="col-span-1 border border-slate-200/70 shadow-sm bg-white h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">
            Membership Usage
          </CardTitle>
          <div className="p-2 bg-purple-50 rounded-full">
            <Ticket className="w-4 h-4 text-purple-600" />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Are subscribers using their perks?
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* HERO METRIC */}
        <div className="flex items-end gap-3">
          <span className={`text-4xl font-bold ${isHealthy ? 'text-emerald-600' : isCritical ? 'text-red-500' : 'text-slate-900'}`}>
            {rate}%
          </span>
          <div className="mb-1.5 flex flex-col">
             <span className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Success Rate</span>
             <span className="text-[10px] text-slate-500">
                {totalRedeemed} successful visits out of {totalClaims} attempts
             </span>
          </div>
        </div>

        {/* PROGRESS BAR VISUALIZATION */}
        <div className="space-y-2">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                {/* The Filled Part */}
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isHealthy ? 'bg-emerald-500' : 'bg-purple-600'}`} 
                    style={{ width: `${rate}%` }} 
                />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Pass Generated</span>
                <span>Completed Visits</span>
            </div>
        </div>

        <div className="h-px bg-slate-100 w-full" />

        {/* NEW SPLIT BAR: Success vs Friction */}
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                 <span className="text-xs font-semibold text-slate-700">Outcome Breakdown</span>
            </div>

            <div className="flex items-center gap-1 w-full">
                {/* Segment 1: Successful Visits */}
                <div 
                    className="h-10 rounded-l-md bg-emerald-50 flex items-center justify-center gap-2 border border-emerald-100 relative group w-full"
                    style={{ flex: totalRedeemed || 1 }}
                >
                    <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">{totalRedeemed}</span>
                    <span className="text-[10px] text-emerald-600 hidden md:inline ml-1">Verified</span>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-10 bg-white z-10"></div>

                {/* Segment 2: Unused/Expired */}
                <div 
                    className="h-10 rounded-r-md bg-slate-50 flex items-center justify-center gap-2 border border-slate-200 relative group w-full"
                    style={{ flex: wasted || 1 }}
                >
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{wasted}</span>
                    <span className="text-[10px] text-slate-500 hidden md:inline ml-1">Expired</span>
                </div>
            </div>
            
            <div className="flex justify-between px-1">
                <span className="text-[10px] text-emerald-600 font-medium">Visited</span>
                <span className="text-[10px] text-slate-500 font-medium">Missed / Failed</span>
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
