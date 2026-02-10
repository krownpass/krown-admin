"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, RotateCw } from "lucide-react";

export function VisitorLoyalty({ data }: { data: any }) {
  const newVisitors = data?.newVisitors || 0;
  const returningVisitors = data?.returningVisitors || 0;
  const total = newVisitors + returningVisitors;
  
  const newPct = total > 0 ? (newVisitors / total) * 100 : 0;
  const retPct = total > 0 ? 100 - newPct : 0;

  return (
    <Card className="col-span-1 border border-slate-200/70 shadow-sm bg-white h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Visitor Loyalty
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">New vs Returning visitors</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <Zap className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{newVisitors}</p>
              <p className="text-xs text-slate-500">New ({newPct.toFixed(1)}%)</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
              <RotateCw className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{returningVisitors}</p>
              <p className="text-xs text-slate-500">Returning ({retPct.toFixed(1)}%)</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-500"
              style={{ width: `${newPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 text-center">
            Total: {total.toLocaleString()} visitors
          </p>
        </div>

        {/* Summary Text */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-emerald-600">{newPct.toFixed(1)}%</span> new visitors
            <br />
            <span className="font-semibold text-amber-600">{retPct.toFixed(1)}%</span> returning
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
