"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Store } from "lucide-react";

export function CafeLeaderboard({ data }: { data: any[] }) {
  return (
    <Card className="shadow-sm border border-slate-200/70 h-full flex flex-col bg-white">
      <CardHeader className="flex flex-row items-center justify-between border-b py-4 pb-3">
        <div>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Café Leaderboard
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
                Top revenue generating partners
            </p>
        </div>
        <Badge variant="outline" className="text-[10px] h-5 border-slate-200 bg-slate-50 text-slate-600">
            {data?.length || 0} active
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto max-h-[600px] p-0">
            {data?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <Store className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-xs">No transactions yet</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-50">
                    {data?.map((cafe, index) => {
                        // Rank styling
                        let rankColor = "text-slate-500 bg-slate-100";
                        let rankIcon = <span className="font-bold text-[10px]">{index + 1}</span>;
                        
                        if (index === 0) {
                            rankColor = "text-amber-700 bg-amber-100 border-amber-200";
                            rankIcon = <Trophy className="w-3 h-3 fill-amber-700" />;
                        } else if (index === 1) {
                            rankColor = "text-slate-700 bg-slate-200 border-slate-300";
                            rankIcon = <span className="font-bold text-[10px]">2</span>;
                        } else if (index === 2) {
                            rankColor = "text-orange-800 bg-orange-100 border-orange-200";
                            rankIcon = <span className="font-bold text-[10px]">3</span>;
                        }

                        return (
                            <div 
                                key={cafe.cafeId}
                                className="w-full px-4 py-3 hover:bg-slate-50/80 transition flex items-center justify-between group cursor-default"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${rankColor}`}>
                                        {rankIcon}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 leading-none truncate max-w-[120px] sm:max-w-[150px]">
                                            {cafe.cafeName}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                                {cafe.totalBookings} orders
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                ⭐ {cafe.avgRating?.toFixed(1) || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                     <p className="text-sm font-bold text-slate-900">
                                        ₹{cafe.totalRevenue?.toLocaleString()}
                                     </p>
                                     <div className="flex items-center justify-end gap-1 mt-0.5">
                                        <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-emerald-500 rounded-full" 
                                                style={{ width: `${cafe.completionRate}%` }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-emerald-600 font-medium">
                                            {cafe.completionRate}%
                                        </p>
                                     </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
      </CardContent>
    </Card>
  );
}
