"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function RecentBookingsTable({ data }: { data: any[] }) {
  return (
    <Card className="shadow-sm border border-slate-200/70 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b py-4 bg-white/50">
        <div>
            <CardTitle className="text-base font-semibold text-slate-900">
                Bookings & Payments (Recent)
            </CardTitle>
            <p className="text-xs text-slate-500">
                Detailed log of most recent 50 transactions in this period.
            </p>
        </div>
        <Badge variant="outline" className="text-[11px] border-slate-300 text-slate-700">
            {data?.length || 0} records
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200">
                <TableHead className="text-xs font-semibold text-slate-600 h-9">Date & Time</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 h-9">User Details</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 h-9">Café</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 h-9 text-right pr-6">Amount</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 h-9">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-sm text-slate-500">
                    No recent bookings found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.map((booking) => (
                    <TableRow key={booking.bookingId} className="hover:bg-slate-50/50 border-b border-slate-50 group">
                    <TableCell className="align-top py-3">
                        <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-900">{booking.date}</span>
                        <span className="text-[10px] text-slate-500">{booking.time?.slice(0, 5)}</span>
                        </div>
                    </TableCell>
                    <TableCell className="align-top py-3">
                        <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-800">{booking.userName}</span>
                        <span className="text-[10px] text-slate-500">{booking.userMobile}</span>
                        </div>
                    </TableCell>
                    <TableCell className="align-top py-3">
                        <div className="flex flex-col max-w-[150px]">
                             <span className="text-xs font-medium text-slate-700 truncate" title={booking.cafeName}>
                                {booking.cafeName}
                             </span>
                        </div>
                    </TableCell>
                    <TableCell className="align-top py-3 text-right pr-6">
                        <span className="text-xs font-semibold text-emerald-700">
                            ₹{booking.amount?.toLocaleString()}
                        </span>
                    </TableCell>
                    <TableCell className="align-top py-3">
                        <Badge 
                            variant="outline" 
                            className={`text-[10px] py-0 h-5 border font-normal ${
                            booking.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            booking.status === 'pending' ? 'bg-slate-50 text-slate-600 border-slate-200' : 
                            booking.status === 'visited' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                        >
                        {booking.status}
                        </Badge>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
