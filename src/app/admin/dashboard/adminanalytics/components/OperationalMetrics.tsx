import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp } from "lucide-react";

export function OperationalMetrics({ data }: { data: any }) {
  if (!data) return null;

  const peakHour = data.peakHour !== null ? data.peakHour : 0;
  const leadTime = parseFloat(data.avgLeadTimeHours) || 0;
  
  // Determine efficiency status
  const isGoodLeadTime = leadTime < 24;
  const leadTimeColor = isGoodLeadTime ? "text-emerald-600" : "text-amber-600";
  const leadTimeBgColor = isGoodLeadTime ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100";

  return (
    <Card className="col-span-1 border border-slate-200/70 shadow-sm bg-white h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Operational Metrics
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">System performance insights</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Peak Hour */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">Peak Hour</span>
            </div>
          </div>
          
          <div className="pl-10 space-y-1">
            <p className="text-3xl font-bold text-slate-900">
              {peakHour}:00
            </p>
            <p className="text-xs text-slate-500">
              Busiest hour of the day
            </p>
          </div>

          {/* Peak Hour Visualization */}
          <div className="pl-10 mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600">Activity Level</span>
              <span className="text-xs font-semibold text-blue-600">High</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: "85%" }} />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* Lead Time */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg border ${leadTimeBgColor}`}>
                <TrendingUp className={`w-4 h-4 ${leadTimeColor}`} />
              </div>
              <span className="text-sm font-medium text-slate-700">Avg. Lead Time</span>
            </div>
          </div>

          <div className="pl-10 space-y-1">
            <p className="text-3xl font-bold text-slate-900">
              {leadTime.toFixed(1)}
              <span className="text-lg text-slate-500 ml-1">hrs</span>
            </p>
            <p className={`text-xs ${isGoodLeadTime ? "text-emerald-600" : "text-amber-600"} font-medium`}>
              {isGoodLeadTime ? "✓ Good booking lead time" : "⚠ Longer booking window"}
            </p>
          </div>

          {/* Lead Time Visualization */}
          <div className="pl-10 mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600">Efficiency</span>
              <span className={`text-xs font-semibold ${leadTimeColor}`}>
                {isGoodLeadTime ? "Optimal" : "Extended"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div 
                className={`h-full rounded-full ${isGoodLeadTime ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-amber-400 to-amber-600"}`}
                style={{ width: `${Math.min((24 - leadTime) / 24 * 100, 100)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-slate-50">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Peak Time</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {peakHour}:00 - {(peakHour + 1) % 24}:00
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Booking Window</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                ~{Math.round(leadTime)}h
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
