"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Loader2, Search, X, Save, Send, Check, XCircle,
    GripVertical, TrendingUp, ImageOff, RefreshCw, Store, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionStatus = "draft" | "pending_approval" | "published" | "rejected";

type SectionLayout = {
    cardWidth?: number;
    cardHeight?: number;
    cardType?: 'default' | 'glow' | 'wide' | 'minimal' | 'promo';
    showCount?: boolean;
    titleColor?: string;
    subtitleColor?: string;
    countColor?: string;
};

type Section = {
    section_key: string;
    title: string;
    subtitle: string | null;
    cafe_ids: string[];
    event_ids: string[];
    item_ids?: string[] | string;
    sort_order: number;
    is_active: boolean;
    status: SectionStatus;
    valid_from: string | null;
    valid_until: string | null;
    banner_image: string | null;
    layout?: SectionLayout;
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
    cafe_id?: string;
    cafe_name?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Safely parse item_ids whether it's a JS array or a JSON-stringified array string */
const parseIds = (val: any): string[] => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === "string" && val.trim().startsWith("[")) {
        try { return (JSON.parse(val) as any[]).map(String); } catch { return []; }
    }
    return [];
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
    const cls = size === "sm" ? "w-9 h-9" : "w-12 h-12";
    if (!src || errored) {
        return (
            <div className={`${cls} rounded-lg bg-muted flex items-center justify-center shrink-0`}>
                <ImageOff className="size-3 text-muted-foreground/40" />
            </div>
        );
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} onError={() => setErrored(true)}
            className={`${cls} rounded-lg object-cover shrink-0`} />
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BuzzItemsPage() {
    const queryClient = useQueryClient();

    // ── Section data ──────────────────────────────────────────────────────────
    const { data: allSections = [], isLoading: sectionsLoading } = useQuery<Section[]>({
        queryKey: ["admin-sections"],
        queryFn: async () => {
            const { data } = await api.get("/admin/sections");
            return data.data ?? [];
        },
        staleTime: 30_000,
    });
    const section = allSections.find((s) => s.section_key === "items_on_the_buzz");

    // ── Cafe list ─────────────────────────────────────────────────────────────
    const { data: cafes = [], isLoading: cafesLoading } = useQuery<Cafe[]>({
        queryKey: ["admin-cafe-list"],
        queryFn: async () => {
            const { data } = await api.get("/admin/cafe_name/list");
            return data.data ?? [];
        },
        staleTime: 5 * 60_000,
    });

    // ── All items (pre-populate cache so saved buzz shows on first load) ─────
    const { data: allItems = [] } = useQuery<CafeItem[]>({
        queryKey: ["admin-all-items"],
        queryFn: async () => {
            const { data } = await api.get("/admin/sections/items");
            return data.data ?? [];
        },
        staleTime: 5 * 60_000,
    });

    // ── Active cafe + its items ───────────────────────────────────────────────
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

    // ── Selection state ───────────────────────────────────────────────────────
    const [itemCache, setItemCache] = useState<Record<string, CafeItem & { cafe_id: string; cafe_name: string }>>({});
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // ── Layout draft state ────────────────────────────────────────────────────
    const [layoutDraft, setLayoutDraft] = useState<SectionLayout>({});

    // Load saved ids on section fetch — parse defensively + deduplicate
    useEffect(() => {
        if (section) {
            setSelectedIds([...new Set(parseIds(section.item_ids))]);
            setLayoutDraft(section.layout ?? {});
            setIsDirty(false);
        }
    }, [section]);

    // Pre-populate cache from the global items list so saved buzz items show
    // immediately on page load, even before a specific café has been clicked.
    useEffect(() => {
        if (!allItems.length) return;
        setItemCache((prev) => {
            const next = { ...prev };
            allItems.forEach((item: any) => {
                const id = String(item.item_id);
                if (!next[id]) {
                    // Only set if not already loaded from a specific café request
                    next[id] = {
                        item_id: id,
                        item_name: item.item_name,
                        cover_img: item.cover_img,
                        category: item.category,
                        price: item.price,
                        tag: item.tag,
                        ratings: item.ratings,
                        cafe_id: item.cafe_id ?? "",
                        cafe_name: item.cafe_name ?? "",
                    };
                }
            });
            return next;
        });
    }, [allItems]);

    // Cache item metadata when café loads — always use String(item_id) as key
    useEffect(() => {
        if (!activeCafeId || !cafeItems.length) return;
        const cafe = cafes.find((c) => c.cafe_id === activeCafeId);
        if (!cafe) return;
        setItemCache((prev) => {
            const next = { ...prev };
            cafeItems.forEach((item) => {
                // Café-specific load always wins — richer data (availability, recommended, etc.)
                next[String(item.item_id)] = { ...item, cafe_id: activeCafeId, cafe_name: cafe.cafe_name };
            });
            return next;
        });
    }, [cafeItems, activeCafeId, cafes]);

    const [search, setSearch] = useState("");
    const filteredItems = cafeItems.filter(
        (item) => !search || item.item_name.toLowerCase().includes(search.toLowerCase())
    );

    // ── Toggle item in/out of selection — always use string IDs to avoid type mismatch ──
    const toggleItem = useCallback((item: CafeItem) => {
        const id = String(item.item_id);
        const cafe = cafes.find((c) => c.cafe_id === activeCafeId);
        setItemCache((prev) => ({
            ...prev,
            [id]: { ...item, item_id: id, cafe_id: activeCafeId, cafe_name: cafe?.cafe_name ?? "" },
        }));
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
        setIsDirty(true);
    }, [activeCafeId, cafes]);

    const removeItem = useCallback((id: string) => {
        setSelectedIds((prev) => prev.filter((x) => String(x) !== String(id)));
        setIsDirty(true);
    }, []);

    // ── Drag-to-reorder selected list ─────────────────────────────────────────
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
    const dragSrcIdx = useRef<number | null>(null);

    const handleReorderDragStart = (e: React.DragEvent, idx: number) => {
        e.dataTransfer.effectAllowed = "move";
        dragSrcIdx.current = idx;
    };
    const handleReorderDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverIdx(idx);
    };
    const handleReorderDrop = (e: React.DragEvent, targetIdx: number) => {
        e.preventDefault();
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
            const ids = Array.isArray(selectedIds) ? selectedIds : parseIds(selectedIds);
            if (!section) {
                await api.post("/admin/sections", {
                    section_key: "items_on_the_buzz",
                    title: "Items on the Buzz",
                    subtitle: "Trending right now ✨",
                    cafe_ids: [], event_ids: [], item_ids: ids,
                    sort_order: 3,
                    layout: layoutDraft,
                });
                toast.success("Section created");
            } else {
                await api.patch("/admin/sections/items_on_the_buzz", { item_ids: ids, layout: layoutDraft });
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
            toast.success("🚀 Section is now live!");
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
    // Deduplicate + use string key for cache lookup (item_id may be numeric from API)
    const selectedItems = [...new Set(selectedIds.map(String))]
        .map((id) => itemCache[id])
        .filter(Boolean);

    if (sectionsLoading || cafesLoading) {
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
                        <p className="text-xs text-muted-foreground">Pick a café → toggle items → save &amp; publish</p>
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

                    {isPublished && (
                        <Button size="sm" variant="outline" onClick={handleReject} disabled={rejecting}
                            className="gap-1.5 border-red-400 text-red-600 hover:bg-red-50">
                            {rejecting ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                            Take Offline
                        </Button>
                    )}

                    <Button size="sm" variant="ghost"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-sections"] })}>
                        <RefreshCw className="size-3.5" />
                    </Button>
                </div>
            </div>

            {/* ── Body ──────────────────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── LEFT: Café list ───────────────────────────────────────── */}
                <div className="flex flex-col w-52 shrink-0 border-r overflow-hidden bg-muted/10">
                    <div className="px-3 py-3 border-b shrink-0">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cafés</p>
                    </div>
                    <div className="flex-1 overflow-y-auto py-1">
                        {cafes.map((cafe) => {
                            const cafeSelectedCount = selectedIds.filter(
                                (id) => itemCache[String(id)]?.cafe_id === cafe.cafe_id
                            ).length;
                            return (
                                <button
                                    key={cafe.cafe_id}
                                    onClick={() => { setActiveCafeId(cafe.cafe_id); setSearch(""); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors group ${activeCafeId === cafe.cafe_id
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "hover:bg-muted text-foreground"
                                        }`}
                                >
                                    <Store className="size-3.5 shrink-0 opacity-50" />
                                    <span className="text-sm flex-1 truncate">{cafe.cafe_name}</span>
                                    {cafeSelectedCount > 0 && (
                                        <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-medium shrink-0">
                                            {cafeSelectedCount}
                                        </span>
                                    )}
                                    <ChevronRight className={`size-3 shrink-0 transition-opacity ${activeCafeId === cafe.cafe_id ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── CENTER: Items with toggles ─────────────────────────────── */}
                <div className="flex flex-col flex-1 overflow-hidden border-r">

                    {/* Search + header */}
                    <div className="px-4 py-3 border-b shrink-0 flex items-center gap-3">
                        {activeCafeId ? (
                            <>
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                    <Input
                                        className="pl-8 text-sm h-8"
                                        placeholder="Search items…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                    {filteredItems.filter((i) => selectedIds.includes(String(i.item_id))).length} / {filteredItems.length} selected
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Select a café to see its items</p>
                        )}
                    </div>

                    {/* Items list */}
                    <div className="flex-1 overflow-y-auto">
                        {!activeCafeId ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                                <Store className="size-10 opacity-20" />
                                <p className="text-sm">Choose a café from the left</p>
                            </div>
                        ) : itemsFetching ? (
                            <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
                                <Loader2 className="size-4 animate-spin" />
                                <span className="text-sm">Loading items…</span>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-1">
                                <p className="text-sm">{search ? `No items matching "${search}"` : "No items for this café"}</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredItems.map((item) => {
                                    const isOn = selectedIds.includes(String(item.item_id));
                                    return (
                                        <div
                                            key={item.item_id}
                                            className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 cursor-pointer ${isOn ? "bg-primary/5" : ""}`}
                                            onClick={() => toggleItem(item)}
                                        >
                                            <ItemThumb src={item.cover_img} alt={item.item_name} size="md" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{item.item_name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {item.category && (
                                                        <span className="text-xs text-muted-foreground">{item.category}</span>
                                                    )}
                                                    {item.price && (
                                                        <span className="text-xs text-muted-foreground">· ₹{item.price}</span>
                                                    )}
                                                    {item.tag && (
                                                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{item.tag}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Switch
                                                checked={isOn}
                                                onCheckedChange={() => toggleItem(item)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="shrink-0"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Selected items + reorder ───────────────────────── */}
                <div className="flex flex-col w-72 shrink-0 overflow-hidden border-r">

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
                        {selectedItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-muted-foreground/20 text-muted-foreground gap-2">
                                <TrendingUp className="size-7 opacity-20" />
                                <p className="text-sm font-medium">No items selected</p>
                                <p className="text-xs opacity-60 text-center px-4">Toggle items in the center panel to add them</p>
                            </div>
                        ) : (
                            selectedItems.map((item, idx) => (
                                <div
                                    key={item.item_id}
                                    draggable
                                    onDragStart={(e) => handleReorderDragStart(e, idx)}
                                    onDragOver={(e) => handleReorderDragOver(e, idx)}
                                    onDrop={(e) => handleReorderDrop(e, idx)}
                                    onDragEnd={() => { setDragOverIdx(null); dragSrcIdx.current = null; }}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border bg-card cursor-grab active:cursor-grabbing transition-all select-none ${dragOverIdx === idx ? "border-primary ring-1 ring-primary shadow-md" : "hover:border-border"}`}
                                >
                                    <GripVertical className="size-4 text-muted-foreground/30 shrink-0" />
                                    <span className="text-xs font-mono text-muted-foreground w-4 shrink-0 text-right">{idx + 1}</span>
                                    <ItemThumb src={item.cover_img} alt={item.item_name} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate leading-tight">{item.item_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{item.cafe_name}</p>
                                    </div>
                                    <button onClick={() => removeItem(item.item_id)}
                                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10">
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-3 border-t shrink-0 space-y-2">
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
                </div>

                {/* ── FAR RIGHT: Layout panel ─────────────────────────────────── */}
                <div className="flex flex-col w-64 shrink-0 overflow-hidden bg-muted/5">
                    <div className="px-4 py-3 border-b shrink-0">
                        <p className="text-sm font-semibold">Layout</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Card appearance</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Card Type */}
                        <div className="space-y-3">
                            <Label className="text-xs font-medium">Card Type</Label>
                            <div className="flex flex-wrap gap-2">
                                {(['default', 'glow', 'wide', 'minimal', 'promo'] as const).map((type) => {
                                    const label = type === 'promo' ? 'Promo ✨' : type.charAt(0).toUpperCase() + type.slice(1);
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setLayoutDraft((prev) => ({ ...prev, cardType: type }));
                                                setIsDirty(true);
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                                layoutDraft.cardType === type
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-muted-foreground/20 hover:border-muted-foreground/50 text-foreground"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                            {layoutDraft.cardType === 'promo' && (
                                <p className="text-xs text-muted-foreground italic">
                                    Promo cards use the section title and subtitle as content — no item selection needed.
                                </p>
                            )}
                        </div>

                        <Separator />

                        {/* Card Size Presets */}
                        <div className="space-y-3">
                            <Label className="text-xs font-medium">Card Size Presets</Label>
                            <div className="flex flex-col gap-2">
                                {[
                                    { label: "Square 148×148", w: 148, h: 148 },
                                    { label: "Medium 171×172", w: 171, h: 172 },
                                    { label: "Large 220×200", w: 220, h: 200 },
                                    { label: "Wide 260×150", w: 260, h: 150 },
                                ].map(({ label, w, h }) => (
                                    <button
                                        key={label}
                                        onClick={() => {
                                            setLayoutDraft((prev) => ({ ...prev, cardWidth: w, cardHeight: h }));
                                            setIsDirty(true);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors text-left ${
                                            layoutDraft.cardWidth === w && layoutDraft.cardHeight === h
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "border-muted-foreground/20 hover:border-muted-foreground/50"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Width / Height */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Custom Size</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label htmlFor="card-width" className="text-xs text-muted-foreground">Width</Label>
                                    <Input
                                        id="card-width"
                                        type="number"
                                        min={100}
                                        max={320}
                                        value={layoutDraft.cardWidth ?? 171}
                                        onChange={(e) => {
                                            setLayoutDraft((prev) => ({
                                                ...prev,
                                                cardWidth: Math.max(100, Math.min(320, Number(e.target.value))),
                                            }));
                                            setIsDirty(true);
                                        }}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="card-height" className="text-xs text-muted-foreground">Height</Label>
                                    <Input
                                        id="card-height"
                                        type="number"
                                        min={100}
                                        max={280}
                                        value={layoutDraft.cardHeight ?? 172}
                                        onChange={(e) => {
                                            setLayoutDraft((prev) => ({
                                                ...prev,
                                                cardHeight: Math.max(100, Math.min(280, Number(e.target.value))),
                                            }));
                                            setIsDirty(true);
                                        }}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Show count toggle */}
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="show-count" className="text-xs font-medium">Show count label</Label>
                                <button
                                    onClick={() => {
                                        setLayoutDraft((prev) => ({ ...prev, showCount: !prev.showCount }));
                                        setIsDirty(true);
                                    }}
                                    className={`w-10 h-6 rounded-full transition-colors ${
                                        layoutDraft.showCount ? "bg-primary" : "bg-muted"
                                    } flex items-center px-1`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                            layoutDraft.showCount ? "translate-x-4" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        <Separator />

                        {/* Title Color */}
                        <div className="space-y-3">
                            <Label className="text-xs font-medium">Title Color</Label>
                            <div className="flex gap-2 flex-wrap">
                                {["#ffffff", "#F9FAFB", "#D4AF37", "#FCD34D", "#F87171", "#60A5FA"].map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            setLayoutDraft((prev) => ({ ...prev, titleColor: color }));
                                            setIsDirty(true);
                                        }}
                                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                            layoutDraft.titleColor === color ? "border-primary" : "border-muted-foreground/20"
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <Input
                                type="color"
                                value={layoutDraft.titleColor ?? "#ffffff"}
                                onChange={(e) => {
                                    setLayoutDraft((prev) => ({ ...prev, titleColor: e.target.value }));
                                    setIsDirty(true);
                                }}
                                className="h-8 w-16"
                            />
                        </div>

                        {/* Subtitle Color */}
                        <div className="space-y-3">
                            <Label className="text-xs font-medium">Subtitle Color</Label>
                            <div className="flex gap-2 flex-wrap">
                                {["#ffffff", "#F9FAFB", "#D4AF37", "#FCD34D", "#F87171", "#60A5FA"].map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            setLayoutDraft((prev) => ({ ...prev, subtitleColor: color }));
                                            setIsDirty(true);
                                        }}
                                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                            layoutDraft.subtitleColor === color ? "border-primary" : "border-muted-foreground/20"
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <Input
                                type="color"
                                value={layoutDraft.subtitleColor ?? "#9CA3AF"}
                                onChange={(e) => {
                                    setLayoutDraft((prev) => ({ ...prev, subtitleColor: e.target.value }));
                                    setIsDirty(true);
                                }}
                                className="h-8 w-16"
                            />
                        </div>

                        <Separator />

                        {/* Live Phone Preview */}
                        <div className="space-y-3">
                            <Label className="text-xs font-medium">Live Preview</Label>
                            <div className="mx-auto flex justify-center">
                                <div className="w-[180px] rounded-[24px] border-8 border-black bg-black overflow-hidden shadow-lg">
                                    <div className="w-[180px] h-[320px] bg-gradient-to-br from-zinc-900 to-black flex flex-col">
                                        {/* Section header */}
                                        <div className="px-3 py-2.5 border-b border-zinc-800 text-center">
                                            <p
                                                className="text-xs font-semibold leading-tight"
                                                style={{ color: layoutDraft.titleColor ?? '#ffffff' }}
                                            >
                                                Items on the Buzz
                                            </p>
                                            <p
                                                className="text-[10px] mt-0.5"
                                                style={{ color: layoutDraft.subtitleColor ?? '#9CA3AF' }}
                                            >
                                                Trending right now ✨
                                            </p>
                                        </div>

                                        {/* Cards row */}
                                        <div className="flex-1 flex items-center justify-center px-2 py-3">
                                            <div className="flex gap-1.5 justify-center">
                                                {(() => {
                                                    const previewCardW = Math.min(
                                                        Math.round((layoutDraft.cardWidth ?? 148) * 0.45),
                                                        80
                                                    );
                                                    const previewCardH = Math.round((layoutDraft.cardHeight ?? 148) * 0.45);
                                                    const cardType = layoutDraft.cardType ?? 'default';
                                                    const countColor = layoutDraft.countColor ?? '#D4AF37';
                                                    const titleColor = layoutDraft.titleColor ?? '#ffffff';

                                                    return Array.from({ length: selectedItems.length > 0 ? Math.min(3, selectedItems.length) : 3 }).map((_, i) => {
                                                        const item = selectedItems[i];
                                                        const hasImage = item?.cover_img;

                                                        if (cardType === 'minimal') {
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="rounded"
                                                                    style={{
                                                                        width: previewCardW,
                                                                        height: previewCardH,
                                                                        backgroundColor: '#1A1A1A',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        padding: 4,
                                                                    }}
                                                                >
                                                                    <p
                                                                        className="text-[8px] font-medium text-center leading-tight"
                                                                        style={{ color: titleColor }}
                                                                    >
                                                                        {item ? item.item_name.substring(0, 10) : 'Item'}
                                                                    </p>
                                                                </div>
                                                            );
                                                        }

                                                        if (cardType === 'wide') {
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="rounded overflow-hidden relative"
                                                                    style={{
                                                                        width: previewCardW,
                                                                        height: previewCardH,
                                                                        backgroundColor: '#1A1A1A',
                                                                    }}
                                                                >
                                                                    {hasImage && (
                                                                        <img
                                                                            src={item.cover_img}
                                                                            alt="preview"
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                objectFit: 'cover',
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <div
                                                                        style={{
                                                                            position: 'absolute',
                                                                            bottom: 0,
                                                                            left: 0,
                                                                            right: 0,
                                                                            background: 'rgba(0,0,0,0.65)',
                                                                            padding: 2,
                                                                            textAlign: 'center',
                                                                        }}
                                                                    >
                                                                        <p
                                                                            className="text-[7px] font-medium leading-tight"
                                                                            style={{ color: titleColor }}
                                                                        >
                                                                            {item ? item.item_name.substring(0, 10) : 'Item'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        // default / glow
                                                        return (
                                                            <div
                                                                key={i}
                                                                className="rounded overflow-hidden"
                                                                style={{
                                                                    width: previewCardW,
                                                                    height: previewCardH,
                                                                    backgroundColor: '#1A1A1A',
                                                                    backgroundImage: hasImage ? `url(${item.cover_img})` : 'linear-gradient(135deg, #27272a, #18181b)',
                                                                    backgroundSize: 'cover',
                                                                    backgroundPosition: 'center',
                                                                    boxShadow: cardType === 'glow'
                                                                        ? `0 0 10px ${countColor}, 0 0 20px ${countColor}40`
                                                                        : 'none',
                                                                }}
                                                            />
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>

                                        {/* Count label */}
                                        {layoutDraft.showCount !== false && (
                                            <div
                                                className="px-2 py-1.5 text-center border-t border-zinc-800"
                                                style={{
                                                    color: layoutDraft.countColor ?? '#D4AF37',
                                                    fontSize: '10px',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {selectedItems.length} items
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
