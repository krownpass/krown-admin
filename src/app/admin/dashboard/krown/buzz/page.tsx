"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Loader2, Search, X, Save, Send, Check, XCircle,
    GripVertical, TrendingUp, ImageOff, RefreshCw, Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionStatus = "draft" | "pending_approval" | "published" | "rejected";

type Section = {
    section_key: string;
    title: string;
    subtitle: string | null;
    cafe_ids: string[];
    event_ids: string[];
    item_ids?: string[];
    sort_order: number;
    is_active: boolean;
    status: SectionStatus;
    valid_from: string | null;
    valid_until: string | null;
    banner_image: string | null;
};

type Cafe = { cafe_id: string; cafe_name: string; city?: string; area?: string };

type CafeItem = {
    item_id: string;
    item_name: string;
    category?: string;
    price?: number;
    cover_img?: string;
    availability?: string;
    recommended?: boolean;
    tag?: string;
    ratings?: number;
    // enriched client-side
    cafe_id?: string;
    cafe_name?: string;
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: SectionStatus }) {
    if (status === "published") return <Badge className="bg-green-500 text-white">Live</Badge>;
    if (status === "pending_approval") return <Badge className="bg-amber-500 text-white">Pending Approval</Badge>;
    if (status === "rejected") return <Badge className="bg-red-500 text-white">Rejected</Badge>;
    if (status === "draft") return <Badge variant="secondary">Draft</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Not set up</Badge>;
}

// ─── Item thumbnail ───────────────────────────────────────────────────────────
function ItemThumb({ src, alt, size = "md" }: { src?: string; alt: string; size?: "sm" | "md" }) {
    const [errored, setErrored] = useState(false);
    const cls = size === "sm" ? "w-10 h-10" : "w-14 h-14";
    if (!src || errored) {
        return (
            <div className={`${cls} rounded-xl bg-muted flex items-center justify-center shrink-0`}>
                <ImageOff className="size-3.5 text-muted-foreground/40" />
            </div>
        );
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} onError={() => setErrored(true)}
            className={`${cls} rounded-xl object-cover shrink-0`} />
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BuzzItemsPage() {
    const queryClient = useQueryClient();

    // ── Fetch section ──────────────────────────────────────────────────────────
    const { data: allSections = [], isLoading: sectionsLoading } = useQuery<Section[]>({
        queryKey: ["admin-sections"],
        queryFn: async () => {
            const { data } = await api.get("/admin/sections");
            return data.data ?? [];
        },
        staleTime: 30_000,
    });
    const section = allSections.find((s) => s.section_key === "items_on_the_buzz");

    // ── Fetch cafe list ────────────────────────────────────────────────────────
    const { data: cafes = [], isLoading: cafesLoading } = useQuery<Cafe[]>({
        queryKey: ["admin-cafe-list"],
        queryFn: async () => {
            const { data } = await api.get("/admin/cafe_name/list");
            return data.data ?? [];
        },
        staleTime: 5 * 60_000,
    });

    // ── Selected cafe + its items ──────────────────────────────────────────────
    const [activeCafeId, setActiveCafeId] = useState<string>("");

    const { data: cafeItems = [], isFetching: itemsFetching } = useQuery<CafeItem[]>({
        queryKey: ["cafe-items", activeCafeId],
        enabled: !!activeCafeId,
        queryFn: async () => {
            const res = await api.get(`/cafes/cafe/${activeCafeId}`);
            return res.data?.data ?? res.data ?? [];
        },
        staleTime: 2 * 60_000,
    });

    // ── Selected buzz items (enriched with metadata cache) ────────────────────
    // We keep a local cache of item metadata so right panel shows info even when cafe changes
    const [itemCache, setItemCache] = useState<Record<string, CafeItem & { cafe_id: string; cafe_name: string }>>({});
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // When section loads, restore item ids
    useEffect(() => {
        if (section) { setSelectedIds(section.item_ids ?? []); setIsDirty(false); }
    }, [section]);

    // When cafe items load, enrich cache with cafe info
    useEffect(() => {
        if (!activeCafeId || !cafeItems.length) return;
        const cafe = cafes.find((c) => c.cafe_id === activeCafeId);
        if (!cafe) return;
        setItemCache((prev) => {
            const next = { ...prev };
            cafeItems.forEach((item) => {
                next[item.item_id] = { ...item, cafe_id: activeCafeId, cafe_name: cafe.cafe_name };
            });
            return next;
        });
    }, [cafeItems, activeCafeId, cafes]);

    // ── Search within current cafe items ──────────────────────────────────────
    const [search, setSearch] = useState("");

    const filteredItems = cafeItems.filter((item) => {
        const notSelected = !selectedIds.includes(item.item_id);
        const matchesSearch = !search || item.item_name.toLowerCase().includes(search.toLowerCase());
        return notSelected && matchesSearch;
    });

    const selectedItems = selectedIds.map((id) => itemCache[id]).filter(Boolean);

    // ── Add / Remove ──────────────────────────────────────────────────────────
    const addItem = useCallback((item: CafeItem) => {
        const cafe = cafes.find((c) => c.cafe_id === activeCafeId);
        setItemCache((prev) => ({
            ...prev,
            [item.item_id]: { ...item, cafe_id: activeCafeId, cafe_name: cafe?.cafe_name ?? "" },
        }));
        setSelectedIds((prev) => (prev.includes(item.item_id) ? prev : [...prev, item.item_id]));
        setIsDirty(true);
    }, [activeCafeId, cafes]);

    const removeItem = useCallback((id: string) => {
        setSelectedIds((prev) => prev.filter((x) => x !== id));
        setIsDirty(true);
    }, []);

    // ── HTML5 Drag — left panel to right panel ────────────────────────────────
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverRight, setDragOverRight] = useState(false);
    const dragPayload = useRef<CafeItem | null>(null);

    const handleCatalogDragStart = (e: React.DragEvent, item: CafeItem) => {
        e.dataTransfer.effectAllowed = "copy";
        dragPayload.current = item;
        setDraggingId(item.item_id);
    };

    const handleDropZoneDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDragOverRight(true);
    };

    const handleDropZoneDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (dragPayload.current) addItem(dragPayload.current);
        setDragOverRight(false);
        setDraggingId(null);
        dragPayload.current = null;
    };

    // ── Right-panel reorder ───────────────────────────────────────────────────
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
    const dragSrcIdx = useRef<number | null>(null);

    const handleReorderDragStart = (e: React.DragEvent, idx: number) => {
        e.dataTransfer.effectAllowed = "move";
        e.stopPropagation();
        dragSrcIdx.current = idx;
        dragPayload.current = null; // prevent catalog drop
    };
    const handleReorderDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        setDragOverIdx(idx);
    };
    const handleReorderDrop = (e: React.DragEvent, targetIdx: number) => {
        e.preventDefault();
        e.stopPropagation();
        const srcIdx = dragSrcIdx.current;
        if (srcIdx !== null && srcIdx !== targetIdx) {
            setSelectedIds((prev) => {
                const arr = [...prev];
                const [moved] = arr.splice(srcIdx, 1);
                arr.splice(targetIdx, 0, moved);
                return arr;
            });
            setIsDirty(true);
        }
        setDragOverIdx(null);
        dragSrcIdx.current = null;
    };

    // ── API actions ────────────────────────────────────────────────────────────
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (!section) {
                await api.post("/admin/sections", {
                    section_key: "items_on_the_buzz",
                    title: "Items on the Buzz",
                    subtitle: "Trending right now ✨",
                    cafe_ids: [], event_ids: [], item_ids: selectedIds,
                    sort_order: 3, is_active: false, status: "draft",
                });
                toast.success("Section created with selected items");
            } else {
                await api.patch("/admin/sections/items_on_the_buzz", {
                    item_ids: selectedIds,
                });
                toast.success("Buzz items saved");
            }
            setIsDirty(false);
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save");
        } finally { setSaving(false); }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await api.post("/admin/sections/items_on_the_buzz/submit");
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            toast.success("Submitted for approval");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit");
        } finally { setSubmitting(false); }
    };

    const handleApprove = async () => {
        setApproving(true);
        try {
            await api.post("/admin/sections/items_on_the_buzz/approve");
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            toast.success("🚀 Section is now live on the app!");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve");
        } finally { setApproving(false); }
    };

    const handleReject = async () => {
        setRejecting(true);
        try {
            await api.post("/admin/sections/items_on_the_buzz/reject");
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            toast.success("Section rejected");
        } catch { toast.error("Failed to reject"); }
        finally { setRejecting(false); }
    };

    const isPending = section?.status === "pending_approval";
    const isPublished = section?.status === "published";
    const canSubmit = !section || section.status === "draft" || section.status === "rejected";
    const isLoading = sectionsLoading || cafesLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">

            {/* ── Top bar ───────────────────────────────────────────────────── */}
            <div className="px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0 bg-background">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="size-4 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">Items on the Buzz</h1>
                        <p className="text-xs text-muted-foreground">Pick a café → drag or click items → save &amp; publish</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <StatusBadge status={section?.status} />

                    {isDirty && (
                        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                            Save
                        </Button>
                    )}

                    {canSubmit && !isDirty && selectedIds.length > 0 && (
                        <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1.5">
                            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                            Submit for Approval
                        </Button>
                    )}

                    {isPending && (
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleApprove} disabled={approving || rejecting}
                                className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                                {approving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                                Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleReject} disabled={approving || rejecting}
                                className="gap-1.5 border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                                {rejecting ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                                Reject
                            </Button>
                        </div>
                    )}

                    <Button size="sm" variant="ghost"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-sections"] })}>
                        <RefreshCw className="size-3.5" />
                    </Button>
                </div>
            </div>

            {/* ── Body ──────────────────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── LEFT: Café selector + item catalog ──────────────────── */}
                <div className="flex flex-col w-[60%] border-r overflow-hidden">

                    {/* Café picker */}
                    <div className="px-4 py-3 border-b shrink-0 space-y-2 bg-muted/20">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select a Café</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-28 overflow-y-auto pr-1">
                            {cafes.map((cafe) => (
                                <button
                                    key={cafe.cafe_id}
                                    onClick={() => { setActiveCafeId(cafe.cafe_id); setSearch(""); }}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs text-left truncate transition-all ${activeCafeId === cafe.cafe_id
                                        ? "bg-primary text-primary-foreground border-primary font-medium"
                                        : "hover:bg-muted border-transparent hover:border-border"
                                        }`}
                                >
                                    <Store className="size-3 shrink-0" />
                                    <span className="truncate">{cafe.cafe_name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search bar */}
                    {activeCafeId && (
                        <div className="px-4 py-2.5 border-b shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                <Input
                                    className="pl-8 text-sm h-8"
                                    placeholder="Search items…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Items catalog */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {!activeCafeId ? (
                            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                                <Store className="size-8 opacity-20" />
                                <p className="text-sm">Select a café above to browse its items</p>
                            </div>
                        ) : itemsFetching ? (
                            <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
                                <Loader2 className="size-4 animate-spin" />
                                <span className="text-sm">Loading items…</span>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-1">
                                <TrendingUp className="size-6 opacity-20" />
                                <p className="text-sm">{search ? `No items matching "${search}"` : "No more items to add"}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {filteredItems.map((item) => (
                                    <motion.div
                                        key={item.item_id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: draggingId === item.item_id ? 0.4 : 1, scale: draggingId === item.item_id ? 0.95 : 1 }}
                                        draggable
                                        onDragStart={(e) => handleCatalogDragStart(e as unknown as React.DragEvent, item)}
                                        onDragEnd={() => { setDraggingId(null); dragPayload.current = null; }}
                                        onClick={() => addItem(item)}
                                        className="group flex gap-3 p-3 rounded-xl border bg-card cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-sm transition-all select-none"
                                    >
                                        <ItemThumb src={item.cover_img} alt={item.item_name} size="md" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate leading-tight">{item.item_name}</p>
                                            <div className="flex flex-wrap items-center gap-1 mt-1">
                                                {item.category && (
                                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                                                        {item.category}
                                                    </span>
                                                )}
                                                {item.price && (
                                                    <span className="text-xs text-muted-foreground">₹{item.price}</span>
                                                )}
                                                {item.tag && (
                                                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                                        {item.tag}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                            <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">+</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Drop zone / selected items ───────────────────── */}
                <div
                    className={`flex flex-col w-[40%] overflow-hidden transition-colors duration-150 ${dragOverRight ? "bg-primary/5" : ""}`}
                    onDragOver={handleDropZoneDragOver}
                    onDragLeave={() => setDragOverRight(false)}
                    onDrop={handleDropZoneDrop}
                >
                    <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold">Buzz Selection</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""} · drag to reorder
                            </p>
                        </div>
                        {selectedIds.length > 0 && (
                            <button onClick={() => { setSelectedIds([]); setIsDirty(true); }}
                                className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                        <AnimatePresence>
                            {selectedItems.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className={`flex flex-col items-center justify-center h-56 rounded-2xl border-2 border-dashed transition-colors ${dragOverRight ? "border-primary bg-primary/5" : "border-muted-foreground/20"}`}
                                >
                                    <TrendingUp className={`size-8 mb-2 transition-colors ${dragOverRight ? "text-primary" : "text-muted-foreground/30"}`} />
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {dragOverRight ? "Drop to add" : "Drag items here"}
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">or click any item on the left</p>
                                </motion.div>
                            ) : (
                                selectedItems.map((item, idx) => (
                                    <motion.div
                                        key={item.item_id}
                                        layout
                                        initial={{ opacity: 0, x: 16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
                                        draggable
                                        onDragStart={(e) => handleReorderDragStart(e as unknown as React.DragEvent, idx)}
                                        onDragOver={(e) => handleReorderDragOver(e as unknown as React.DragEvent, idx)}
                                        onDrop={(e) => handleReorderDrop(e as unknown as React.DragEvent, idx)}
                                        onDragEnd={() => { setDragOverIdx(null); dragSrcIdx.current = null; }}
                                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border bg-card cursor-grab active:cursor-grabbing transition-all select-none ${dragOverIdx === idx ? "border-primary ring-1 ring-primary shadow-md" : "hover:border-border"}`}
                                    >
                                        <GripVertical className="size-4 text-muted-foreground/30 shrink-0" />
                                        <span className="text-xs font-mono text-muted-foreground w-4 shrink-0 text-right">{idx + 1}</span>
                                        <ItemThumb src={item.cover_img} alt={item.item_name} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate leading-tight">{item.item_name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{item.cafe_name}</p>
                                        </div>
                                        {item.category && (
                                            <Badge variant="secondary" className="text-xs shrink-0 hidden sm:flex">{item.category}</Badge>
                                        )}
                                        <button onClick={() => removeItem(item.item_id)}
                                            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10">
                                            <X className="size-3.5" />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>

                        {selectedItems.length > 0 && dragOverRight && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex items-center justify-center p-3 rounded-xl border-2 border-dashed border-primary bg-primary/5 text-primary text-sm font-medium gap-2">
                                <TrendingUp className="size-4" /> Drop to add
                            </motion.div>
                        )}
                    </div>

                    {/* Footer actions */}
                    {(selectedItems.length > 0 || isDirty) && (
                        <div className="px-4 py-3 border-t shrink-0 space-y-2">
                            {isDirty && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                                    Unsaved changes
                                </p>
                            )}
                            <Button size="sm" className="w-full gap-1.5" onClick={handleSave} disabled={saving || !isDirty}>
                                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                                {saving ? "Saving…" : "Save Changes"}
                            </Button>
                            {canSubmit && !isDirty && selectedIds.length > 0 && (
                                <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                                    Submit for Approval
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
