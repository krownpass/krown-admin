"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Trash2, MapPin, Clock } from "lucide-react";
import Link from "next/link";

type Cafe = {
    cafe_id: string;
    cafe_name: string;
    cafe_location: string;
    cafe_mobile_no: string;
    cafe_upi_id: string;
    opening_time?: string;
    closing_time?: string;
    created_at?: string;
    ratings?: number;
};

export default function AdminCafeListPage() {
    const [rows, setRows] = useState<Cafe[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Load cafés
    const loadCafes = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/cafe_name/list");
            setRows(res.data?.data || res.data || []);
        } catch (err: any) {
            toast.error("Failed to load cafés", {
                description: err?.response?.data?.message || err?.message,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCafes();
    }, []);

    // Search filter
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((c) =>
            [c.cafe_name, c.cafe_location, c.cafe_mobile_no, c.cafe_upi_id]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [rows, query]);

    // Selection toggles
    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = (checked: boolean) => {
        setSelectedIds(
            checked ? new Set(filtered.map((r) => r.cafe_id)) : new Set()
        );
    };

    // Delete selected cafés (bulk)
    const deleteSelected = async () => {
        const ids = Array.from(selectedIds);
        if (!ids.length) {
            toast.message("Select cafés to delete");
            return;
        }

        toast.warning(`Delete ${ids.length} café(s) permanently?`, {
            action: {
                label: "Confirm",
                onClick: async () => {
                    setDeleting(true);
                    try {
                        const prevRows = [...rows];
                        setRows((r) => r.filter((x) => !selectedIds.has(x.cafe_id)));

                        for (const id of ids) {
                            await api.delete("/admin/cafe/delete", { data: { cafe_id: id } });
                        }

                        setSelectedIds(new Set());
                        toast.success(`Deleted ${ids.length} café(s)`);
                    } catch (err: any) {
                        await loadCafes();
                        toast.error("Delete failed", {
                            description: err?.response?.data?.message || err?.message,
                        });
                    } finally {
                        setDeleting(false);
                    }
                },
            },
            cancel: {
                label: "Cancel",
                onClick: () => toast.dismiss(),
            },
        });
    };

    return (
        <div className="space-y-4">
            {/* Search + Bulk Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                    <Input
                        placeholder="Search cafés by name, location, phone, or UPI"
                        className="pl-9"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 justify-end">
                    <Button
                        variant="destructive"
                        onClick={deleteSelected}
                        disabled={deleting || loading}
                        className="gap-2"
                    >
                        {deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                    </Button>
                </div>
            </div>

            {/* Café Table */}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableCaption className="text-sm">
                        Showing {filtered.length} of {rows.length} cafés
                    </TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={
                                        filtered.length > 0 &&
                                        selectedIds.size === filtered.length
                                    }
                                    onCheckedChange={(v: any) => toggleSelectAll(Boolean(v))}
                                />
                            </TableHead>
                            <TableHead>Café Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Mobile</TableHead>
                            <TableHead>UPI ID</TableHead>
                            <TableHead>Timings</TableHead>
                            <TableHead>Ratings</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Loading cafés…</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <AnimatePresence initial={false}>
                                {filtered.map((c) => (
                                    <motion.tr
                                        key={c.cafe_id}
                                        layout
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="hover:bg-neutral-50 transition"
                                    >
                                        <TableCell className="w-10">
                                            <Checkbox
                                                checked={selectedIds.has(c.cafe_id)}
                                                onCheckedChange={() => toggleSelect(c.cafe_id)}
                                            />
                                        </TableCell>

                                        <TableCell className="font-semibold text-black hover:underline">
                                            <Link
                                                href={`/admin/dashboard/cafes/update/${c.cafe_id}/edit`}
                                            >
                                                {c.cafe_name}
                                            </Link>
                                        </TableCell>

                                        <TableCell>
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {c.cafe_location}
                                            </span>
                                        </TableCell>

                                        <TableCell>{c.cafe_mobile_no}</TableCell>
                                        <TableCell>{c.cafe_upi_id}</TableCell>

                                        <TableCell>
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <Clock className="w-3.5 h-3.5" />
                                                {c.opening_time || "--"} - {c.closing_time || "--"}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <Badge variant="secondary">
                                                {c.ratings ? c.ratings.toFixed(1) : "—"}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right pr-6">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => {
                                                    toast.warning(
                                                        `Delete "${c.cafe_name}" permanently?`,
                                                        {
                                                            action: {
                                                                label: "Confirm",
                                                                onClick: async () => {
                                                                    try {
                                                                        await api.delete("/admin/cafe/delete", {
                                                                            data: { cafe_id: c.cafe_id },
                                                                        });
                                                                        setRows((r) =>
                                                                            r.filter(
                                                                                (x) => x.cafe_id !== c.cafe_id
                                                                            )
                                                                        );
                                                                        toast.success(
                                                                            `Deleted "${c.cafe_name}"`
                                                                        );
                                                                    } catch (err: any) {
                                                                        toast.error("Delete failed", {
                                                                            description:
                                                                                err?.response?.data?.message ||
                                                                                err?.message,
                                                                        });
                                                                    }
                                                                },
                                                            },
                                                            cancel: {
                                                                label: "Cancel",

                                                                onClick: () => toast.dismiss(),
                                                            },
                                                        }
                                                    );
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </motion.tr>
                                ))}

                                {!filtered.length && !loading && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            No cafés found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </AnimatePresence>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
