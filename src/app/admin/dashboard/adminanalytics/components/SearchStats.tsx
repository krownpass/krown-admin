"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, AlertCircle, Loader2 } from "lucide-react";
import { SearchAnalyticsData } from "@/lib/analytics";

export function SearchStats({ data }: { data: SearchAnalyticsData }) {
  
  if (!data) {
    return (
      <Card className="col-span-1 border border-slate-200/70 shadow-sm bg-white h-full min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <AlertCircle className="h-8 w-8" />
          <span className="text-sm font-medium">No search data available</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 border border-slate-200/70 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-500" />
            <CardTitle className="text-base font-semibold text-slate-900">
            Search Insights
            </CardTitle>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Top searched terms and missed opportunities
        </p>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs defaultValue="top" className="w-full">
            <div className="px-6 pb-2">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="top">Top Keywords</TabsTrigger>
                    <TabsTrigger value="missing">Zero Results</TabsTrigger>
                </TabsList>
            </div>
            
          <TabsContent value="top" className="px-0 mt-0">
            <div className="h-[250px] overflow-y-auto custom-scrollbar">
                <div className="flex flex-col">
                    {data.topKeywords.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400 italic">
                            No search data yet
                        </div>
                    ) : (
                        data.topKeywords.map((item, idx) => (
                            <div 
                                key={idx} 
                                className="flex items-center justify-between px-6 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                            >
                                <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]" title={item.keyword}>
                                    {item.keyword}
                                </span>
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                                    {Number(item.total_count).toLocaleString()}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </TabsContent>

          <TabsContent value="missing" className="px-0 mt-0">
             <div className="h-[250px] overflow-y-auto custom-scrollbar">
                <div className="flex flex-col">
                    {data.zeroResults.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400 italic">
                            No zero-result searches
                        </div>
                    ) : (
                        data.zeroResults.map((item, idx) => (
                            <div 
                                key={idx} 
                                className="flex items-center justify-between px-6 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                            >
                                <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]" title={item.keyword}>
                                    {item.keyword}
                                </span>
                                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                                    {Number(item.count).toLocaleString()} Misses
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
