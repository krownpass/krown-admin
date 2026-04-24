"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    PlusCircle, Loader2, Pencil, Trash2, Eye, EyeOff,
    Sparkles, X, Calendar, Coffee, Ticket, Search,
    CheckCircle2, TrendingUp, Clock, Send, Check, XCircle,
    RefreshCw, Zap, LayoutGrid, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionStatus = "draft" | "pending_approval" | "published" | "rejected";

type Section = {
    section_key: string;
    title: string;
    subtitle: string | null;
    banner_image: string | null;
    valid_from: string | null;
    valid_until: string | null;
    cafe_ids: string[];
    event_ids: string[];
    item_ids: string[];
    sort_order: number;
    is_active: boolean;
    status: SectionStatus;
    layout?: Record<string, any>;
    created_at?: string;
};

type SectionDraft = Omit<Section, "created_at">;

type Cafe = { cafe_id: string; cafe_name: string; city?: string; area?: string; cover_img?: string };
type Event = { event_id: string; title: string; venue_city?: string; start_time?: string; is_paid?: boolean; base_price?: number };
type MenuItem = { item_id: string; item_name: string; cafe_name: string; area?: string; category?: string; price?: number; cover_img?: string; tag?: string };

const EMPTY_DRAFT: SectionDraft = {
    section_key: "", title: "", subtitle: "", banner_image: "",
    valid_from: "", valid_until: "", cafe_ids: [], event_ids: [], item_ids: [],
    sort_order: 10, is_active: false, status: "draft",
};

// ─── Premium layout templates ─────────────────────────────────────────────────
const LAYOUT_TEMPLATES = [
    {
        id: "cinema_night",
        name: "Cinema Night",
        emoji: "🌙",
        desc: "Dark & moody — films, shows, theatre",
        colors: ["#0D0D1A", "#A78BFA", "#C084FC"],
        accent: "#A78BFA",
        // Pattern: film strip dots on the right edge
        pattern: "filmstrip",
        cardShape: "tall",  // tall portrait cards
        layout: {
            eventStyle: "card" as const, cardType: "default" as const,
            eventCardWidth: 175, eventCardHeight: 265,
            cardWidth: 175, cardHeight: 210,
            cardBorderRadius: 16, eventCardBorderRadius: 20,
            titleColor: "#FFFFFF", subtitleColor: "#A78BFA", countColor: "#C084FC",
            cardNameColor: "#FFFFFF", cardSubColor: "#C084FC80",
            overlayOpacity: 0.6, overlayColor: "#0D0A1A",
            showCount: true,
        },
    },
    {
        id: "weekend_heat",
        name: "Weekend Heat",
        emoji: "🔥",
        desc: "Bold & wide — parties, festivals, nightlife",
        colors: ["#1A0800", "#F97316", "#FB923C"],
        accent: "#F97316",
        pattern: "diagonal",
        cardShape: "wide",  // landscape wide cards
        layout: {
            eventStyle: "card" as const, cardType: "wide" as const,
            eventCardWidth: 215, eventCardHeight: 190,
            cardWidth: 225, cardHeight: 185,
            cardBorderRadius: 12, eventCardBorderRadius: 14,
            titleColor: "#FFF7ED", subtitleColor: "#FB923C", countColor: "#F97316",
            cardNameColor: "#FFF7ED", cardSubColor: "#FB923C",
            overlayOpacity: 0.7, overlayColor: "#3D1500",
            showCount: true,
        },
    },
    {
        id: "gold_standard",
        name: "Gold Standard",
        emoji: "👑",
        desc: "Luxury glow — premium events & curated picks",
        colors: ["#0A0800", "#D4AF37", "#FBBF24"],
        accent: "#D4AF37",
        pattern: "shimmer",
        cardShape: "tall-glow",
        layout: {
            eventStyle: "card" as const, cardType: "glow" as const,
            eventCardWidth: 180, eventCardHeight: 272,
            cardWidth: 175, cardHeight: 205,
            cardBorderRadius: 14, eventCardBorderRadius: 18,
            cardStyle: "none" as const,
            titleColor: "#FBBF24", subtitleColor: "#D4AF37", countColor: "#D4AF37",
            cardNameColor: "#FBBF24", cardSubColor: "#D4AF3799",
            overlayOpacity: 0.55, overlayColor: "#1A0E00",
            showCount: true,
        },
    },
    {
        id: "live_sessions",
        name: "Live Sessions",
        emoji: "🎵",
        desc: "List view — music, open mics, jam nights",
        colors: ["#061410", "#4ADE80", "#86EFAC"],
        accent: "#4ADE80",
        pattern: "waves",
        cardShape: "list",
        layout: {
            eventStyle: "list" as const, cardType: "minimal" as const,
            cardWidth: 148, cardHeight: 148,
            cardBorderRadius: 10, eventCardBorderRadius: 12,
            titleColor: "#F0FDF4", subtitleColor: "#86EFAC", countColor: "#4ADE80",
            cardNameColor: "#F0FDF4", cardSubColor: "#86EFAC",
            overlayOpacity: 0.5, overlayColor: "#061410",
            showCount: true,
        },
    },
    {
        id: "brunch_vibes",
        name: "Brunch Vibes",
        emoji: "🌸",
        desc: "Soft & cozy — café picks, slow mornings",
        colors: ["#1A0A12", "#F472B6", "#FBCFE8"],
        accent: "#EC4899",
        pattern: "floral",
        cardShape: "square",
        layout: {
            eventStyle: "card" as const, cardType: "default" as const,
            cardWidth: 152, cardHeight: 152,
            eventCardWidth: 165, eventCardHeight: 235,
            cardBorderRadius: 18, eventCardBorderRadius: 22,
            titleColor: "#FDF2F8", subtitleColor: "#F9A8D4", countColor: "#EC4899",
            cardNameColor: "#FDF2F8", cardSubColor: "#F9A8D4",
            overlayOpacity: 0.5, overlayColor: "#3D1025",
            showCount: true,
        },
    },
    {
        id: "trending_now",
        name: "Trending Now",
        emoji: "⚡",
        desc: "Neon electric — hot picks, trending spots",
        colors: ["#021A0F", "#10B981", "#6EE7B7"],
        accent: "#10B981",
        pattern: "neon",
        cardShape: "tall-glow",
        layout: {
            eventStyle: "card" as const, cardType: "glow" as const,
            cardWidth: 172, cardHeight: 175,
            eventCardWidth: 192, eventCardHeight: 275,
            cardBorderRadius: 10, eventCardBorderRadius: 16,
            titleColor: "#F0FFF4", subtitleColor: "#6EE7B7", countColor: "#10B981",
            cardNameColor: "#F0FFF4", cardSubColor: "#6EE7B799",
            overlayOpacity: 0.6, overlayColor: "#021A0F",
            showCount: true,
        },
    },
] as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCafeList() {
    return useQuery<Cafe[]>({
        queryKey: ["admin-cafe-list"],
        queryFn: async () => {
            const { data } = await api.get("/admin/cafe_name/list");
            return data.data ?? [];
        },
        staleTime: 5 * 60_000,
    });
}

function useEventList() {
    return useQuery<Event[]>({
        queryKey: ["admin-event-list"],
        queryFn: async () => {
            const { data } = await api.get("/events?limit=100");
            return data.data?.events ?? [];
        },
        staleTime: 5 * 60_000,
    });
}

function useMenuItemList() {
    return useQuery<MenuItem[]>({
        queryKey: ["admin-menu-items"],
        queryFn: async () => {
            const { data } = await api.get("/admin/sections/items");
            return data.data ?? [];
        },
        staleTime: 5 * 60_000,
    });
}

// ─── Item Picker ──────────────────────────────────────────────────────────────
function ItemPicker({
    label, items, selectedIds, onAdd, onRemove, idKey, nameKey, subKey, icon: Icon, disabled,
}: {
    label: string;
    items: any[];
    selectedIds: string[];
    onAdd: (id: string) => void;
    onRemove: (id: string) => void;
    idKey: string;
    nameKey: string;
    subKey?: string;
    icon: React.ElementType;
    disabled?: boolean;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const filtered = items.filter(
        (it) =>
            !selectedIds.includes(it[idKey]) &&
            (it[nameKey] ?? "").toLowerCase().includes(query.toLowerCase())
    );

    const selectedItems = items.filter((it) => selectedIds.includes(it[idKey]));

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className={`space-y-2 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
            <Label className="flex items-center gap-1.5">
                <Icon className="size-3.5" />
                {label}
                <span className="text-muted-foreground font-normal">({selectedIds.length} selected)</span>
            </Label>

            {selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedItems.map((it) => (
                        <span
                            key={it[idKey]}
                            className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary text-xs px-2.5 py-1 rounded-full"
                        >
                            {it[nameKey]}
                            {subKey && it[subKey] && (
                                <span className="text-muted-foreground">· {it[subKey]}</span>
                            )}
                            <button onClick={() => onRemove(it[idKey])} className="ml-0.5 hover:text-destructive">
                                <X className="size-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="relative" ref={ref}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        className="pl-8 text-sm"
                        placeholder={`Search ${label.toLowerCase()}…`}
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                    />
                </div>
                <AnimatePresence>
                    {open && filtered.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                            {filtered.slice(0, 30).map((it) => (
                                <button
                                    key={it[idKey]}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2"
                                    onClick={() => { onAdd(it[idKey]); setQuery(""); setOpen(false); }}
                                >
                                    <span className="font-medium truncate">{it[nameKey]}</span>
                                    {subKey && it[subKey] && (
                                        <span className="text-xs text-muted-foreground shrink-0">{it[subKey]}</span>
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── Cafe Picker — shows cover images in dropdown + selected list ─────────────
function CafePicker({
    cafes, selectedIds, onAdd, onRemove, disabled,
}: {
    cafes: Cafe[];
    selectedIds: string[];
    onAdd: (id: string) => void;
    onRemove: (id: string) => void;
    disabled?: boolean;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

    const selected = cafes.filter((c) => selectedIds.includes(c.cafe_id));
    const available = cafes.filter(
        (c) =>
            !selectedIds.includes(c.cafe_id) &&
            (!query || c.cafe_name.toLowerCase().includes(query.toLowerCase()) ||
                (c.city ?? "").toLowerCase().includes(query.toLowerCase()) ||
                (c.area ?? "").toLowerCase().includes(query.toLowerCase()))
    );

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className={`space-y-3 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
            <Label className="flex items-center gap-1.5">
                <Coffee className="size-3.5" />
                Cafés
                <span className="text-muted-foreground font-normal">({selectedIds.length} selected)</span>
            </Label>

            {/* Selected cafes — card style with image */}
            {selected.length > 0 && (
                <div className="space-y-1.5">
                    {selected.map((c) => (
                        <div
                            key={c.cafe_id}
                            className="flex items-center gap-2.5 p-2 bg-muted/40 rounded-xl border border-muted-foreground/10 hover:border-muted-foreground/20 transition-colors"
                        >
                            {c.cover_img && !imgErrors[c.cafe_id] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={c.cover_img}
                                    alt={c.cafe_name}
                                    onError={() => setImgErrors((p) => ({ ...p, [c.cafe_id]: true }))}
                                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                                    <Coffee className="size-4 text-muted-foreground" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{c.cafe_name}</p>
                                {(c.area || c.city) && (
                                    <p className="text-xs text-muted-foreground truncate">{c.area ?? c.city}</p>
                                )}
                            </div>
                            <button
                                onClick={() => onRemove(c.cafe_id)}
                                className="shrink-0 p-1 rounded hover:bg-destructive/10 transition-colors"
                            >
                                <X className="size-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Searchable dropdown */}
            <div ref={ref} className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        placeholder="Search cafés by name, city or area…"
                        className="pl-8 text-sm"
                    />
                </div>
                <AnimatePresence>
                    {open && available.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute z-50 w-full mt-1 bg-popover border rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto"
                        >
                            {available.slice(0, 30).map((c) => (
                                <button
                                    key={c.cafe_id}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                                    onClick={() => { onAdd(c.cafe_id); setQuery(""); setOpen(false); }}
                                >
                                    {c.cover_img && !imgErrors[c.cafe_id] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={c.cover_img}
                                            alt={c.cafe_name}
                                            onError={() => setImgErrors((p) => ({ ...p, [c.cafe_id]: true }))}
                                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                                            <Coffee className="size-4 text-muted-foreground/50" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{c.cafe_name}</p>
                                        {(c.area || c.city) && (
                                            <p className="text-xs text-muted-foreground truncate">{c.area ?? c.city}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                            {available.length > 30 && (
                                <p className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                                    Showing 30 of {available.length} — type to narrow
                                </p>
                            )}
                        </motion.div>
                    )}
                    {open && available.length === 0 && query && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute z-50 w-full mt-1 bg-popover border rounded-xl shadow-xl px-4 py-3 text-sm text-muted-foreground text-center"
                        >
                            No cafés match &ldquo;{query}&rdquo;
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── App Preview ──────────────────────────────────────────────────────────────
function SectionAppPreview({ draft, layout, cafes, events }: {
    draft: SectionDraft;
    layout: Record<string, any>;
    cafes: Cafe[];
    events: Event[];
}) {
    const selectedCafes = cafes.filter((c) => draft.cafe_ids.includes(c.cafe_id));
    const selectedEvents = events.filter((e) => draft.event_ids.includes(e.event_id));

    const cardType = layout.cardType ?? "default";
    const titleColor = layout.titleColor ?? "#ffffff";
    const subtitleColor = layout.subtitleColor ?? "#9CA3AF";
    const countColor = layout.countColor ?? "#D4AF37";
    const showCount = layout.showCount !== false;
    const eventStyle: "card" | "list" = layout.eventStyle ?? "card";

    const cardW = layout.cardWidth ?? 171;
    // Scale from real RN pixels to this preview context (~40%)
    const s = 0.45;
    const cW = Math.round(cardW * s);
    const cH = Math.round((layout.cardHeight ?? 172) * s);
    const evW = Math.round((layout.eventCardWidth ?? 200) * s);
    const evH = Math.round((layout.eventCardHeight ?? 290) * s);

    const isEmpty = selectedCafes.length === 0 && selectedEvents.length === 0;

    // Promo — only when cardType=promo AND no real data
    const showAsPromo = cardType === "promo" && isEmpty;

    return (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium px-4 pt-4 pb-2">App Preview</p>

            {/* Phone-style container */}
            <div className="bg-black mx-4 mb-4 rounded-2xl overflow-hidden" style={{ minHeight: 200 }}>
                <div className="p-4 space-y-3">
                    {/* Section header */}
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-bold text-lg leading-tight" style={{ color: titleColor }}>
                                {draft.title || "Section Title"}
                            </p>
                            {draft.subtitle && (
                                <p className="text-sm mt-0.5" style={{ color: subtitleColor }}>{draft.subtitle}</p>
                            )}
                        </div>
                        {showCount && (selectedCafes.length > 0 || selectedEvents.length > 0) && (
                            <span className="text-xs font-medium shrink-0 mt-1" style={{ color: countColor }}>
                                {selectedCafes.length > 0 ? `${selectedCafes.length} spots` : ""}
                                {selectedCafes.length > 0 && selectedEvents.length > 0 ? " · " : ""}
                                {selectedEvents.length > 0 ? `${selectedEvents.length} events` : ""}
                            </span>
                        )}
                    </div>

                    {/* Promo banner */}
                    {showAsPromo && (
                        <div
                            className="rounded-2xl p-5 text-center"
                            style={{
                                background: `linear-gradient(135deg, ${titleColor}18, ${countColor}14)`,
                                border: `1px solid ${countColor}50`,
                                boxShadow: `0 0 16px ${countColor}25`,
                            }}
                        >
                            <p className="font-bold text-lg" style={{ color: titleColor }}>{draft.title || "Promo Title"}</p>
                            {draft.subtitle && <p className="text-sm mt-1" style={{ color: subtitleColor }}>{draft.subtitle}</p>}
                        </div>
                    )}

                    {/* Cafe cards */}
                    {selectedCafes.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {selectedCafes.map((c) => (
                                <div key={c.cafe_id} className="shrink-0 rounded-xl overflow-hidden"
                                    style={{
                                        width: cW,
                                        ...(cardType === "glow" ? {
                                            boxShadow: `0 0 10px ${countColor}60`,
                                            border: `1px solid ${countColor}50`,
                                        } : {}),
                                    }}
                                >
                                    <div
                                        className="bg-zinc-800 flex items-center justify-center"
                                        style={{ height: cH }}
                                    >
                                        <Coffee className="size-4 text-zinc-600" />
                                    </div>
                                    {cardType !== "wide" && (
                                        <div className="pt-1.5 pb-1">
                                            <p className="text-xs font-semibold truncate" style={{ color: titleColor }}>{c.cafe_name}</p>
                                            <p className="text-xs text-zinc-500 truncate">{c.area ?? c.city ?? ""}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Events — large cards */}
                    {selectedEvents.length > 0 && eventStyle === "card" && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {selectedEvents.map((ev) => (
                                <div
                                    key={ev.event_id}
                                    className="shrink-0 rounded-2xl overflow-hidden relative flex-col justify-end"
                                    style={{ width: evW, height: evH, backgroundColor: "#1a1a1a", display: "flex" }}
                                >
                                    {/* Scrim */}
                                    <div className="absolute inset-0" style={{
                                        background: "linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)"
                                    }} />
                                    {/* Heart */}
                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/30 flex items-center justify-center">
                                        <span className="text-white text-xs">♡</span>
                                    </div>
                                    {/* Price badge */}
                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-xs font-bold text-white"
                                        style={{ backgroundColor: ev.is_paid ? "rgba(0,0,0,0.55)" : "rgba(0,160,80,0.85)" }}>
                                        {ev.is_paid ? `₹${ev.base_price}` : "Free"}
                                    </div>
                                    {/* Info */}
                                    <div className="relative z-10 p-2">
                                        {ev.start_time && (
                                            <p className="text-xs font-medium mb-0.5" style={{ color: countColor }}>
                                                {new Date(ev.start_time).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                                            </p>
                                        )}
                                        <p className="font-bold leading-tight" style={{ fontSize: 13, color: titleColor }}>{ev.title}</p>
                                        {ev.venue_city && <p className="text-xs text-zinc-400 mt-0.5">📍 {ev.venue_city}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Events — compact list */}
                    {selectedEvents.length > 0 && eventStyle === "list" && (
                        <div className="space-y-2">
                            {selectedEvents.map((ev) => (
                                <div key={ev.event_id} className="flex items-center gap-2 bg-zinc-800 rounded-xl overflow-hidden">
                                    <div className="w-14 h-14 bg-zinc-700 shrink-0 flex items-center justify-center">
                                        <Ticket className="size-4 text-zinc-500" />
                                    </div>
                                    <div className="flex-1 min-w-0 py-1.5 pr-2">
                                        <p className="text-white text-xs font-semibold truncate">{ev.title}</p>
                                        <p className="text-xs mt-0.5" style={{ color: countColor }}>
                                            {ev.venue_city ?? ""}{ev.is_paid ? ` · ₹${ev.base_price}` : " · Free"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {isEmpty && !showAsPromo && (
                        <div className="text-center py-8 text-zinc-600 text-sm">
                            Add cafés or events to see preview
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── App Preview Panel — 3-tab full-screen preview with section reordering ────
function AppPreviewPanel({ currentDraft = EMPTY_DRAFT, currentLayout = {} }: {
    currentDraft?: SectionDraft;
    currentLayout?: Record<string, any>;
}) {
    const queryClient = useQueryClient();
    const [appTab, setAppTab] = useState<"home" | "cafes" | "events">("home");
    const [localOrder, setLocalOrder] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);

    const { data: sections = [] } = useQuery<Section[]>({
        queryKey: ["admin-sections"],
        staleTime: 30_000,
        queryFn: async () => {
            const { data } = await api.get("/admin/sections");
            return data.data ?? [];
        },
    });

    // Only published, non-expired sections appear on the app
    const published = sections.filter(
        (s) => s.status === "published" &&
            (!s.valid_until || new Date(s.valid_until) > new Date())
    );

    // Mirror the sectionBelongsToTab logic from the app
    function belongsToTab(s: Section, tab: "home" | "cafes" | "events"): boolean {
        const dt: string | undefined = (s.layout as any)?.displayTab;
        if (dt === "all") return true;
        if (dt === "cafes") return tab === "cafes";
        if (dt === "events") return tab === "events";
        if (dt === "home") return tab === "home";
        // No displayTab set — use content-aware fallback
        if (tab === "home") return true;
        if (tab === "cafes") return s.cafe_ids.length > 0 || (s.item_ids ?? []).length > 0;
        if (tab === "events") return s.event_ids.length > 0;
        return false;
    }

    const effectiveOrder = (s: Section) => localOrder[s.section_key] ?? s.sort_order;

    const tabSections = published
        .filter((s) => belongsToTab(s, appTab))
        .sort((a, b) => effectiveOrder(a) - effectiveOrder(b));

    // Swap two items and reindex the whole visible list with clean multiples-of-10
    const move = (idx: number, dir: -1 | 1) => {
        const targetIdx = idx + dir;
        if (targetIdx < 0 || targetIdx >= tabSections.length) return;
        const keys = tabSections.map((s) => s.section_key);
        [keys[idx], keys[targetIdx]] = [keys[targetIdx], keys[idx]];
        const updates: Record<string, number> = {};
        keys.forEach((key, i) => { updates[key] = (i + 1) * 10; });
        setLocalOrder((prev) => ({ ...prev, ...updates }));
    };

    const hasChanges = Object.keys(localOrder).length > 0;

    const saveOrder = async () => {
        setSaving(true);
        try {
            await Promise.all(
                Object.entries(localOrder).map(([key, sortOrder]) =>
                    api.patch(`/admin/sections/${key}`, { sort_order: sortOrder })
                )
            );
            await queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            setLocalOrder({});
            toast.success("Section order saved");
        } catch {
            toast.error("Failed to save order");
        } finally {
            setSaving(false);
        }
    };

    const tabConfig = [
        { key: "home" as const, label: "🏠 Home" },
        { key: "cafes" as const, label: "☕ Cafe" },
        { key: "events" as const, label: "🎭 Events" },
    ];

    // Is the draft being edited live in this tab?
    const currentDraftBelongs = currentDraft.section_key
        ? belongsToTab({ ...currentDraft, layout: currentLayout } as Section, appTab)
        : false;

    return (
        <div className="space-y-4">
            {/* Tab switcher + Save button */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1">
                    {tabConfig.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setAppTab(t.key)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                appTab === t.key
                                    ? "bg-background shadow text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                {hasChanges && (
                    <Button size="sm" onClick={saveOrder} disabled={saving} className="gap-1.5 shrink-0">
                        {saving
                            ? <Loader2 className="size-3.5 animate-spin" />
                            : <CheckCircle2 className="size-3.5" />
                        }
                        Save Order
                    </Button>
                )}
            </div>

            {/* Phone-style frame */}
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium px-4 pt-4 pb-2">
                    App Preview —{" "}
                    {appTab === "home" ? "Home" : appTab === "cafes" ? "Cafes" : "Events"} Tab
                </p>

                <div className="bg-black mx-4 mb-4 rounded-2xl overflow-hidden" style={{ minHeight: 220 }}>
                    {/* Static screen header per tab */}
                    <div className="px-5 pt-5 pb-3 border-b border-zinc-900">
                        <p className="text-white font-bold text-base">
                            {appTab === "home" && "What's on 🔥"}
                            {appTab === "cafes" && "Explore Cafes"}
                            {appTab === "events" && "Explore Events"}
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5">
                            {appTab === "home" && "Hand-picked for you"}
                            {appTab === "cafes" && "Discover spaces near you"}
                            {appTab === "events" && "Upcoming experiences"}
                        </p>
                    </div>

                    {/* Sections list — order reflects what users see */}
                    <div className="divide-y divide-zinc-900/60">
                        {tabSections.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-600 text-sm">
                                <Sparkles className="size-6 mb-2 opacity-30" />
                                No live sections for this tab
                            </div>
                        ) : (
                            tabSections.map((s, idx) => {
                                const isCurrentDraft = s.section_key === currentDraft.section_key;
                                const dt: string = (s.layout as any)?.displayTab ?? "home";
                                const changed = localOrder[s.section_key] !== undefined;

                                return (
                                    <div
                                        key={s.section_key}
                                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                                            isCurrentDraft
                                                ? "bg-primary/10"
                                                : changed
                                                ? "bg-amber-950/20"
                                                : "hover:bg-zinc-900/50"
                                        }`}
                                    >
                                        {/* Position number */}
                                        <div className="shrink-0 w-5 text-center">
                                            <span className="text-xs font-bold text-zinc-500">{idx + 1}</span>
                                        </div>

                                        {/* Section info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold truncate ${isCurrentDraft ? "text-primary" : "text-white"}`}>
                                                {s.title}
                                                {isCurrentDraft && (
                                                    <span className="ml-1.5 text-xs font-normal text-primary/60">(this section)</span>
                                                )}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <span className="text-[10px] font-mono text-zinc-600">{s.section_key}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                                    dt === "all"    ? "bg-blue-900/60 text-blue-300" :
                                                    dt === "cafes"  ? "bg-amber-900/60 text-amber-300" :
                                                    dt === "events" ? "bg-red-900/60 text-red-300" :
                                                                      "bg-zinc-800 text-zinc-400"
                                                }`}>
                                                    {dt === "all" ? "All tabs" : dt === "cafes" ? "Cafes" : dt === "events" ? "Events" : "Home"}
                                                </span>
                                                <span className="text-[10px] text-zinc-600">
                                                    {s.cafe_ids.length > 0 ? `${s.cafe_ids.length}☕ ` : ""}
                                                    {s.event_ids.length > 0 ? `${s.event_ids.length}🎭 ` : ""}
                                                    {(s.item_ids ?? []).length > 0 ? `${(s.item_ids ?? []).length}🍴` : ""}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Up / Down reorder buttons */}
                                        <div className="flex flex-col gap-0.5 shrink-0">
                                            <button
                                                onClick={() => move(idx, -1)}
                                                disabled={idx === 0}
                                                title="Move up"
                                                className="w-6 h-5 rounded flex items-center justify-center text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                onClick={() => move(idx, 1)}
                                                disabled={idx === tabSections.length - 1}
                                                title="Move down"
                                                className="w-6 h-5 rounded flex items-center justify-center text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                            >
                                                ▼
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Indicator when the current draft isn't published but belongs to this tab */}
            {currentDraft.section_key && currentDraft.status !== "published" && currentDraftBelongs && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                    <p className="text-sm font-medium text-primary">
                        &ldquo;{currentDraft.title || currentDraft.section_key}&rdquo; is not yet live
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        This section ({currentDraft.status}) will appear in this tab once published.
                    </p>
                </div>
            )}

            {hasChanges && (
                <p className="text-xs text-muted-foreground text-center">
                    Unsaved order changes highlighted in amber — click <strong>Save Order</strong> to persist.
                </p>
            )}
        </div>
    );
}

// ─── Buzz Item Picker — searchable dropdown for menu items ───────────────────
function BuzzItemPicker({
    items, selectedIds, onAdd, disabled,
}: {
    items: MenuItem[];
    selectedIds: string[];
    onAdd: (id: string) => void;
    disabled?: boolean;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const available = items.filter(
        (m) => !selectedIds.includes(m.item_id) &&
            (!query || m.item_name.toLowerCase().includes(query.toLowerCase()) ||
                m.cafe_name.toLowerCase().includes(query.toLowerCase()) ||
                (m.category ?? "").toLowerCase().includes(query.toLowerCase()))
    );

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search menu items by name, café, or category…"
                    className="pl-8 text-sm"
                    disabled={disabled}
                />
            </div>
            {open && available.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                    {available.slice(0, 20).map((m) => (
                        <button
                            key={m.item_id}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                            onClick={() => { onAdd(m.item_id); setQuery(""); setOpen(false); }}
                        >
                            {m.cover_img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.cover_img} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                            ) : (
                                <div className="w-9 h-9 rounded-lg bg-muted shrink-0 flex items-center justify-center text-base">🍽️</div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{m.item_name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {m.cafe_name}{m.area ? ` · ${m.area}` : ""}
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                {m.tag && <Badge variant="outline" className="text-[10px] mb-0.5">{m.tag}</Badge>}
                                {m.price ? <p className="text-xs text-muted-foreground">₹{m.price}</p> : null}
                            </div>
                        </button>
                    ))}
                    {available.length > 20 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                            Showing 20 of {available.length} — type to narrow
                        </p>
                    )}
                </div>
            )}
            {open && available.length === 0 && query && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border rounded-xl shadow-lg p-4 text-sm text-muted-foreground text-center">
                    No items match "{query}"
                </div>
            )}
        </div>
    );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
function SectionFormModal({
    open, initialDraft, onClose, onSave, saving, isPending,
}: {
    open: boolean;
    initialDraft: SectionDraft;
    onClose: () => void;
    onSave: (d: SectionDraft) => void;
    saving: boolean;
    isPending: boolean;
}) {
    const [draft, setDraft] = useState<SectionDraft>(initialDraft);
    const [layoutDraft, setLayoutDraft] = useState<Record<string, any>>({
        cardWidth: 171,
        cardHeight: 172,
        showCount: true,
        titleColor: "#ffffff",
        subtitleColor: "#9CA3AF",
        countColor: "#D4AF37",
    });
    const [activeTab, setActiveTab] = useState<"details" | "content" | "preview">("details");
    const isEdit = !!initialDraft.section_key;

    const { data: cafes = [] } = useCafeList();
    const { data: events = [] } = useEventList();
    const { data: menuItems = [] } = useMenuItemList();

    const DEFAULT_LAYOUT = {
        cardWidth: 171, cardHeight: 172, showCount: true,
        titleColor: "#ffffff", subtitleColor: "#9CA3AF", countColor: "#D4AF37",
    };

    useEffect(() => {
        setDraft({
            ...initialDraft,
            item_ids: (initialDraft as any).item_ids ?? [],
        });
        setLayoutDraft((initialDraft as any).layout ?? DEFAULT_LAYOUT);
        setActiveTab("details");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialDraft, open]);

    const set = (k: keyof SectionDraft, v: unknown) => setDraft((p) => ({ ...p, [k]: v }));
    const setLayout = (k: string, v: unknown) => setLayoutDraft((p) => ({ ...p, [k]: v }));
    const applyPreset = (w: number, h: number) => setLayoutDraft((p) => ({ ...p, cardWidth: w, cardHeight: h }));
    const applyTemplate = (tpl: (typeof LAYOUT_TEMPLATES[number]) & { layout: Record<string, any> }) =>
        // Preserve user-set displayTab (and any other "meta" fields) when switching templates
        setLayoutDraft((prev) => ({
            ...tpl.layout,
            _templateId: tpl.id,
            displayTab: prev.displayTab,  // never wipe the tab selection
        }));

    const addCafe = (id: string) => setDraft((p) => ({ ...p, cafe_ids: [...new Set([...p.cafe_ids, id])] }));
    const removeCafe = (id: string) => setDraft((p) => ({ ...p, cafe_ids: p.cafe_ids.filter((x) => x !== id) }));
    const addEvent = (id: string) => setDraft((p) => ({ ...p, event_ids: [...new Set([...p.event_ids, id])] }));
    const removeEvent = (id: string) => setDraft((p) => ({ ...p, event_ids: p.event_ids.filter((x) => x !== id) }));
    const addItem = (id: string) => setDraft((p) => ({ ...p, item_ids: [...new Set([...(p.item_ids ?? []), id])] }));
    const removeItem = (id: string) => setDraft((p) => ({ ...p, item_ids: (p.item_ids ?? []).filter((x) => x !== id) }));

    const tabs = ["details", "content", "preview"] as const;

    return (
        <Dialog open={open} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        {isEdit ? "Edit Section" : "New Section"}
                        {isPending && (
                            <Badge className="bg-amber-500 text-white text-xs">Pending Approval — Read Only</Badge>
                        )}
                    </DialogTitle>
                    <div className="flex gap-1 mt-3">
                        {tabs.map((t) => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === t ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {isPending && (
                        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                            <Clock className="size-4 shrink-0" />
                            This section is pending admin approval and cannot be edited. It will unlock once approved or rejected.
                        </div>
                    )}

                    {activeTab === "details" && (
                        <div className={`space-y-4 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Section Key *</Label>
                                    <Input
                                        value={draft.section_key}
                                        disabled={isEdit}
                                        onChange={(e) => set("section_key", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                                        placeholder="e.g. weekend_brunch"
                                        className={isEdit ? "opacity-60" : ""}
                                    />
                                    <p className="text-xs text-muted-foreground">Unique identifier, cannot be changed after creation</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Sort Order</Label>
                                    <Input type="number" value={draft.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} />
                                    <p className="text-xs text-muted-foreground">Lower = appears higher on home screen</p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Title *</Label>
                                <Input value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Weekend Brunch Picks" />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Subtitle</Label>
                                <Input value={draft.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} placeholder="Cozy spots for a slow morning" />
                            </div>

                            <div className="space-y-1.5">
                                <Label>Banner Image URL</Label>
                                <Input value={draft.banner_image ?? ""} onChange={(e) => set("banner_image", e.target.value)} placeholder="https://..." />
                                {draft.banner_image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={draft.banner_image} alt="preview" className="w-full h-28 object-cover rounded-lg mt-2" />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Valid From</Label>
                                    <Input
                                        type="datetime-local"
                                        value={draft.valid_from ? draft.valid_from.slice(0, 16) : ""}
                                        onChange={(e) => set("valid_from", e.target.value ? new Date(e.target.value).toISOString() : null)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Valid Until</Label>
                                    <Input
                                        type="datetime-local"
                                        value={draft.valid_until ? draft.valid_until.slice(0, 16) : ""}
                                        onChange={(e) => set("valid_until", e.target.value ? new Date(e.target.value).toISOString() : null)}
                                    />
                                </div>
                            </div>

                            {/* ── Display In (tab target) ──────────────────────── */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium flex items-center gap-1.5">
                                    <span>📍</span> Display In
                                    <span className="text-xs font-normal text-muted-foreground">— which tab shows this section</span>
                                </Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {([
                                        { value: "home", label: "🏠 Home", desc: "Home screen only" },
                                        { value: "cafes", label: "☕ Cafes", desc: "Cafes tab only" },
                                        { value: "events", label: "🎭 Events", desc: "Events tab only" },
                                        { value: "all", label: "🌐 All Tabs", desc: "Everywhere" },
                                    ] as const).map(({ value, label, desc }) => {
                                        const current = (layoutDraft as any).displayTab ?? "home";
                                        const isActive = current === value;
                                        return (
                                            <button
                                                key={value}
                                                onClick={() => setLayout("displayTab", value)}
                                                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs border transition-colors ${
                                                    isActive
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "border-muted-foreground/20 hover:border-muted-foreground/40 text-muted-foreground"
                                                }`}
                                            >
                                                <span className="font-semibold">{label}</span>
                                                <span className={`text-[10px] leading-tight text-center ${isActive ? "opacity-80" : "opacity-60"}`}>{desc}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <Separator className="my-4" />

                            {/* ── Premium Layout Templates ────────────────────── */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-3.5 text-amber-400" />
                                    <h3 className="font-semibold text-sm">Premium Templates</h3>
                                    <span className="text-xs text-muted-foreground">— one-click visual presets</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {LAYOUT_TEMPLATES.map((tpl) => {
                                        const isActive = (layoutDraft as any)._templateId === tpl.id;
                                        const [bg, mid, hi] = tpl.colors;

                                        // Shape preview: mini cards that match the template's card shape
                                        const isTall = tpl.cardShape === "tall" || tpl.cardShape === "tall-glow";
                                        const isWide = tpl.cardShape === "wide";
                                        const isList = tpl.cardShape === "list";
                                        const isSquare = tpl.cardShape === "square";

                                        return (
                                            <button
                                                key={tpl.id}
                                                onClick={() => applyTemplate(tpl as any)}
                                                className={`group relative text-left rounded-2xl overflow-hidden transition-all duration-200 ${
                                                    isActive
                                                        ? "ring-2 scale-[1.02]"
                                                        : "hover:scale-[1.01] hover:brightness-110"
                                                }`}
                                                style={{
                                                    background: `linear-gradient(155deg, ${bg} 0%, ${bg}ee 60%, ${mid}22 100%)`,
                                                    boxShadow: isActive
                                                        ? `0 0 0 2px ${hi}, 0 8px 24px ${bg}88`
                                                        : `0 4px 12px ${bg}66`,
                                                    border: `1px solid ${mid}40`,
                                                }}
                                            >
                                                {/* Pattern overlay — unique per template */}
                                                {tpl.pattern === "filmstrip" && (
                                                    <div className="absolute inset-y-0 right-0 w-5 flex flex-col justify-around opacity-20 px-1">
                                                        {[...Array(6)].map((_, i) => (
                                                            <div key={i} className="h-2 rounded-sm" style={{ backgroundColor: mid }} />
                                                        ))}
                                                    </div>
                                                )}
                                                {tpl.pattern === "diagonal" && (
                                                    <div className="absolute inset-0 opacity-10" style={{
                                                        backgroundImage: `repeating-linear-gradient(45deg, ${mid} 0px, ${mid} 1px, transparent 1px, transparent 8px)`
                                                    }} />
                                                )}
                                                {tpl.pattern === "shimmer" && (
                                                    <div className="absolute inset-0 opacity-15" style={{
                                                        backgroundImage: `linear-gradient(105deg, transparent 20%, ${hi}80 50%, transparent 80%)`
                                                    }} />
                                                )}
                                                {tpl.pattern === "waves" && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-6 opacity-20 flex items-end gap-0.5 px-2">
                                                        {[3, 5, 4, 6, 3, 5, 4, 3, 6, 4, 5, 3].map((h, i) => (
                                                            <div key={i} className="flex-1 rounded-t" style={{ height: `${h * 3}px`, backgroundColor: mid }} />
                                                        ))}
                                                    </div>
                                                )}
                                                {tpl.pattern === "floral" && (
                                                    <div className="absolute top-1 right-1 text-base opacity-20 select-none">✿✾✿</div>
                                                )}
                                                {tpl.pattern === "neon" && (
                                                    <div className="absolute inset-0 rounded-2xl opacity-20" style={{
                                                        boxShadow: `inset 0 0 20px ${mid}`,
                                                    }} />
                                                )}

                                                {/* Content */}
                                                <div className="relative z-10 p-3">
                                                    {/* Header row */}
                                                    <div className="flex items-start justify-between mb-2">
                                                        <span className="text-base leading-none">{tpl.emoji}</span>
                                                        {isActive ? (
                                                            <div className="w-4 h-4 rounded-full flex items-center justify-center"
                                                                style={{ backgroundColor: hi }}>
                                                                <Check className="size-2.5 text-black" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full border opacity-40"
                                                                style={{ borderColor: mid }} />
                                                        )}
                                                    </div>

                                                    {/* Mini card shape preview */}
                                                    <div className="flex gap-1 mb-2.5">
                                                        {isList ? (
                                                            // List rows
                                                            <div className="flex-1 space-y-0.5">
                                                                {[...Array(3)].map((_, i) => (
                                                                    <div key={i} className="h-2.5 rounded flex items-center gap-1 px-1"
                                                                        style={{ backgroundColor: mid + "25" }}>
                                                                        <div className="w-2.5 h-2 rounded-sm shrink-0" style={{ backgroundColor: mid + "60" }} />
                                                                        <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: mid + "40" }} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : isWide ? (
                                                            // Wide landscape cards
                                                            <div className="flex flex-col gap-1 flex-1">
                                                                {[...Array(2)].map((_, i) => (
                                                                    <div key={i} className="h-6 rounded-lg" style={{ backgroundColor: mid + "25", border: `1px solid ${mid}30` }} />
                                                                ))}
                                                            </div>
                                                        ) : isSquare ? (
                                                            // Square cards in a row
                                                            <div className="flex gap-1 flex-1">
                                                                {[...Array(3)].map((_, i) => (
                                                                    <div key={i} className="flex-1 rounded-lg" style={{
                                                                        aspectRatio: "1",
                                                                        backgroundColor: mid + "25",
                                                                        border: `1px solid ${mid}30`,
                                                                    }} />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            // Tall portrait cards (default + glow)
                                                            <div className="flex gap-1 flex-1">
                                                                {[...Array(3)].map((_, i) => (
                                                                    <div key={i} className="flex-1 rounded-lg"
                                                                        style={{
                                                                            height: 36,
                                                                            backgroundColor: mid + "25",
                                                                            border: `1px solid ${mid}30`,
                                                                            boxShadow: tpl.layout.cardType === "glow"
                                                                                ? `0 0 6px ${mid}60`
                                                                                : undefined,
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <p className="text-xs font-bold leading-none mb-0.5" style={{ color: hi }}>
                                                        {tpl.name}
                                                    </p>
                                                    <p className="text-[10px] leading-tight opacity-70" style={{ color: hi }}>
                                                        {tpl.desc}
                                                    </p>

                                                    {/* Type badge */}
                                                    <div className="mt-2 inline-flex items-center gap-1">
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                                                            style={{ backgroundColor: mid + "35", color: hi }}>
                                                            {tpl.layout.cardType}
                                                        </span>
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                                                            style={{ backgroundColor: hi + "20", color: hi + "cc" }}>
                                                            {tpl.layout.eventStyle === "list" ? "list" : "carousel"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                                    <span>Layout Settings</span>
                                    <span className="text-xs font-normal text-muted-foreground">fine-tune manually</span>
                                </h3>

                                {/* Event style — only relevant when section has events */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Event Display Style</Label>
                                    <div className="flex gap-2">
                                        {([
                                            { value: "card", label: "🎭 Card Carousel", desc: "Large portrait cards" },
                                            { value: "list", label: "☰ Compact List", desc: "Thumbnail + text rows" },
                                        ] as const).map(({ value, label, desc }) => (
                                            <button
                                                key={value}
                                                onClick={() => setLayout("eventStyle", value)}
                                                className={`flex-1 px-3 py-2 rounded-xl text-xs border transition-colors text-left ${
                                                    (layoutDraft.eventStyle ?? "card") === value
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "border-muted-foreground/20 hover:border-muted-foreground/40"
                                                }`}
                                            >
                                                <div className="font-semibold">{label}</div>
                                                <div className={`mt-0.5 ${(layoutDraft.eventStyle ?? "card") === value ? "opacity-80" : "text-muted-foreground"}`}>{desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                    {(layoutDraft.eventStyle ?? "card") === "card" && (
                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Event Card Width</Label>
                                                <Input type="number" min={140} max={300} value={layoutDraft.eventCardWidth ?? 200}
                                                    onChange={(e) => setLayout("eventCardWidth", Math.max(140, Math.min(300, Number(e.target.value))))} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Event Card Height</Label>
                                                <Input type="number" min={200} max={400} value={layoutDraft.eventCardHeight ?? 290}
                                                    onChange={(e) => setLayout("eventCardHeight", Math.max(200, Math.min(400, Number(e.target.value))))} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-1" />

                                <div className="space-y-3">
                                    <Label className="text-xs font-medium">Card Type (Cafes &amp; Items)</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {(['default', 'glow', 'wide', 'minimal', 'promo'] as const).map((type) => {
                                            const label = type === 'promo' ? 'Promo ✨' : type.charAt(0).toUpperCase() + type.slice(1);
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => setLayout("cardType", type)}
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

                                <div className="space-y-3">
                                    <Label className="text-xs font-medium">Card Size Presets</Label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => applyPreset(148, 148)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                                layoutDraft.cardWidth === 148 && layoutDraft.cardHeight === 148
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-muted-foreground/20 hover:border-muted-foreground/50"
                                            }`}
                                        >
                                            Square 148×148
                                        </button>
                                        <button
                                            onClick={() => applyPreset(171, 172)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                                layoutDraft.cardWidth === 171 && layoutDraft.cardHeight === 172
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-muted-foreground/20 hover:border-muted-foreground/50"
                                            }`}
                                        >
                                            Medium 171×172
                                        </button>
                                        <button
                                            onClick={() => applyPreset(220, 200)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                                layoutDraft.cardWidth === 220 && layoutDraft.cardHeight === 200
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-muted-foreground/20 hover:border-muted-foreground/50"
                                            }`}
                                        >
                                            Large 220×200
                                        </button>
                                        <button
                                            onClick={() => applyPreset(260, 150)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                                layoutDraft.cardWidth === 260 && layoutDraft.cardHeight === 150
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "border-muted-foreground/20 hover:border-muted-foreground/50"
                                            }`}
                                        >
                                            Wide 260×150
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="card-width" className="text-xs">Width (120–320)</Label>
                                        <Input
                                            id="card-width"
                                            type="number"
                                            min={120}
                                            max={320}
                                            value={layoutDraft.cardWidth ?? 171}
                                            onChange={(e) => setLayout("cardWidth", Math.max(120, Math.min(320, Number(e.target.value))))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="card-height" className="text-xs">Height (100–280)</Label>
                                        <Input
                                            id="card-height"
                                            type="number"
                                            min={100}
                                            max={280}
                                            value={layoutDraft.cardHeight ?? 172}
                                            onChange={(e) => setLayout("cardHeight", Math.max(100, Math.min(280, Number(e.target.value))))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="show-count" className="text-xs font-medium">Show item count</Label>
                                        <button
                                            onClick={() => setLayout("showCount", !layoutDraft.showCount)}
                                            className={`w-10 h-6 rounded-full transition-colors ${
                                                layoutDraft.showCount ? "bg-primary" : "bg-muted"
                                            } flex items-center px-1`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                                layoutDraft.showCount ? "translate-x-4" : "translate-x-0"
                                            }`} />
                                        </button>
                                    </div>
                                </div>

                                <Separator className="my-3" />

                                <div className="space-y-3">
                                    <Label className="text-xs font-medium">Title Color</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {["#ffffff", "#F9FAFB", "#D4AF37", "#FCD34D", "#F87171", "#60A5FA"].map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setLayout("titleColor", color)}
                                                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                                    layoutDraft.titleColor === color ? "border-primary" : "border-muted-foreground/20"
                                                }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <Input
                                        type="color"
                                        value={layoutDraft.titleColor ?? "#ffffff"}
                                        onChange={(e) => setLayout("titleColor", e.target.value)}
                                        className="h-10 w-16"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-medium">Subtitle Color</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {["#ffffff", "#F9FAFB", "#D4AF37", "#FCD34D", "#F87171", "#60A5FA"].map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setLayout("subtitleColor", color)}
                                                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                                    layoutDraft.subtitleColor === color ? "border-primary" : "border-muted-foreground/20"
                                                }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <Input
                                        type="color"
                                        value={layoutDraft.subtitleColor ?? "#9CA3AF"}
                                        onChange={(e) => setLayout("subtitleColor", e.target.value)}
                                        className="h-10 w-16"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-medium">Count Label Color</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {["#ffffff", "#F9FAFB", "#D4AF37", "#FCD34D", "#F87171", "#60A5FA"].map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setLayout("countColor", color)}
                                                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                                    layoutDraft.countColor === color ? "border-primary" : "border-muted-foreground/20"
                                                }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <Input
                                        type="color"
                                        value={layoutDraft.countColor ?? "#D4AF37"}
                                        onChange={(e) => setLayout("countColor", e.target.value)}
                                        className="h-10 w-16"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "content" && (
                        <div className="space-y-6">
                            <CafePicker
                                cafes={cafes}
                                selectedIds={draft.cafe_ids}
                                onAdd={addCafe}
                                onRemove={removeCafe}
                                disabled={isPending}
                            />
                            <Separator />
                            <ItemPicker
                                label="Events"
                                items={events}
                                selectedIds={draft.event_ids}
                                onAdd={addEvent}
                                onRemove={removeEvent}
                                idKey="event_id"
                                nameKey="title"
                                subKey="venue_city"
                                icon={Ticket}
                                disabled={isPending}
                            />
                            <Separator />
                            {/* Menu Items picker — for Items on the Buzz sections */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold flex items-center gap-1.5">
                                            <TrendingUp className="size-4 text-amber-400" />
                                            Menu Items on the Buzz
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Pick specific menu items to feature in the buzz section
                                        </p>
                                    </div>
                                    {(draft.item_ids ?? []).length > 0 && (
                                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                            {(draft.item_ids ?? []).length} item{(draft.item_ids ?? []).length > 1 ? "s" : ""}
                                        </Badge>
                                    )}
                                </div>

                                {/* Selected items */}
                                {(draft.item_ids ?? []).length > 0 && (
                                    <div className="space-y-1.5">
                                        {(draft.item_ids ?? []).map((id) => {
                                            const item = menuItems.find((m) => m.item_id === id);
                                            if (!item) return (
                                                <div key={id} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                                                    <span className="text-xs text-muted-foreground font-mono">{id}</span>
                                                    <button onClick={() => removeItem(id)} disabled={isPending}>
                                                        <X className="size-3.5 text-muted-foreground hover:text-destructive" />
                                                    </button>
                                                </div>
                                            );
                                            return (
                                                <div key={id} className="flex items-center gap-2 p-2 bg-muted/40 rounded-xl border border-muted-foreground/10 hover:border-muted-foreground/20 transition-colors">
                                                    {item.cover_img ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={item.cover_img} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                                                            <TrendingUp className="size-4 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{item.item_name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {item.cafe_name}{item.area ? ` · ${item.area}` : ""}
                                                            {item.price ? ` · ₹${item.price}` : ""}
                                                        </p>
                                                    </div>
                                                    {item.tag && (
                                                        <Badge variant="secondary" className="text-xs shrink-0">{item.tag}</Badge>
                                                    )}
                                                    <button
                                                        onClick={() => removeItem(id)}
                                                        disabled={isPending}
                                                        className="shrink-0 p-1 rounded hover:bg-destructive/10 transition-colors"
                                                    >
                                                        <X className="size-3.5 text-muted-foreground hover:text-destructive" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Item search picker */}
                                <BuzzItemPicker
                                    items={menuItems}
                                    selectedIds={draft.item_ids ?? []}
                                    onAdd={addItem}
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "preview" && (
                        <AppPreviewPanel currentDraft={draft} currentLayout={layoutDraft} />
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    {!isPending && (
                        <Button onClick={() => onSave({ ...draft, layout: layoutDraft } as any)} disabled={saving} className="min-w-32">
                            {saving ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                            {isEdit ? "Save Changes" : "Create Section"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status, isExpired }: { status: SectionStatus; isExpired: boolean }) {
    if (isExpired) return <Badge variant="secondary">Expired</Badge>;
    if (status === "published") return <Badge className="bg-green-500 hover:bg-green-600 text-white">Live</Badge>;
    if (status === "pending_approval") return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Pending</Badge>;
    if (status === "rejected") return <Badge className="bg-red-500 hover:bg-red-600 text-white">Rejected</Badge>;
    return <Badge variant="secondary">Draft</Badge>;
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
    section, onEdit, onToggle, onDelete, onSubmit, onApprove, onReject,
    toggling, deleting, submitting, approving, rejecting,
}: {
    section: Section;
    onEdit: () => void;
    onToggle: () => void;
    onDelete: () => void;
    onSubmit: () => void;
    onApprove: () => void;
    onReject: () => void;
    toggling: boolean;
    deleting: boolean;
    submitting: boolean;
    approving: boolean;
    rejecting: boolean;
}) {
    const isExpired = section.valid_until ? new Date(section.valid_until) < new Date() : false;
    const isPending = section.status === "pending_approval";
    const isPublished = section.status === "published";
    const canSubmit = section.status === "draft" || section.status === "rejected";

    return (
        <motion.div layout className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col">
            {section.banner_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={section.banner_image} alt="banner" className="w-full h-36 object-cover" />
            ) : (
                <div className="w-full h-36 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                    <Sparkles className="size-8 text-muted-foreground/40" />
                </div>
            )}

            <div className="p-5 flex flex-col flex-1 gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg leading-tight truncate">{section.title}</p>
                        {section.subtitle && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{section.subtitle}</p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1">
                            <StatusBadge status={section.status} isExpired={isExpired} />
                            {(section.layout as any)?.cardType === 'promo' && (
                                <Badge className="bg-purple-500 text-white text-xs">Promo</Badge>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">#{section.sort_order}</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <Coffee className="size-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{section.cafe_ids.length}</p>
                        <p className="text-xs text-muted-foreground">Cafés</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <Ticket className="size-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{section.event_ids.length}</p>
                        <p className="text-xs text-muted-foreground">Events</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <TrendingUp className="size-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{(section.item_ids ?? []).length}</p>
                        <p className="text-xs text-muted-foreground">Items</p>
                    </div>
                    <div className="bg-primary/10 rounded-xl p-3 text-center">
                        <Sparkles className="size-4 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold">{section.cafe_ids.length + section.event_ids.length + (section.item_ids ?? []).length}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{section.section_key}</span>
                    </div>
                    {(section.valid_from || section.valid_until) && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="size-3 shrink-0" />
                            {section.valid_from && <span>From {new Date(section.valid_from).toLocaleDateString()}</span>}
                            {section.valid_from && section.valid_until && <span>→</span>}
                            {section.valid_until && <span>Until {new Date(section.valid_until).toLocaleDateString()}</span>}
                        </div>
                    )}
                    {section.created_at && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="size-3 shrink-0" />
                            Created {new Date(section.created_at).toLocaleDateString()}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-auto pt-1">
                    {/* Pending: Approve / Reject */}
                    {isPending && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                onClick={onApprove}
                                disabled={approving || rejecting}
                            >
                                {approving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                                Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1.5 border-red-500/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={onReject}
                                disabled={approving || rejecting}
                            >
                                {rejecting ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                                Reject
                            </Button>
                        </div>
                    )}

                    {/* Published: Unpublish */}
                    {isPublished && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1.5 border-green-500/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={onToggle}
                            disabled={toggling || isExpired}
                        >
                            {toggling ? <Loader2 className="size-3.5 animate-spin" /> : <EyeOff className="size-3.5" />}
                            Unpublish
                        </Button>
                    )}

                    {/* Draft / Rejected: Submit for Approval + Edit */}
                    {canSubmit && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="flex-1 gap-1.5"
                                onClick={onSubmit}
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                                Submit for Approval
                            </Button>
                            <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
                                <Pencil className="size-3.5" /> Edit
                            </Button>
                        </div>
                    )}

                    {/* Pending: View-only edit button */}
                    {isPending && (
                        <Button size="sm" variant="outline" onClick={onEdit} className="w-full gap-1.5 opacity-70">
                            <Eye className="size-3.5" /> View Details
                        </Button>
                    )}

                    {/* Delete (always available) */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                                {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5 mr-1.5" />}
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete &ldquo;{section.title}&rdquo;?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This permanently removes the section. Users will no longer see it on the home screen.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={onDelete}>
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Refresh App Button ───────────────────────────────────────────────────────
// Shows a countdown after clicking, telling admin when users will see the change.
// The app polls for updates every 30s automatically — this button provides reassurance.
function RefreshAppButton() {
    const [state, setState] = useState<"idle" | "refreshing" | "done">("idle");
    const [countdown, setCountdown] = useState(30);

    const handleRefresh = async () => {
        setState("refreshing");
        try {
            // Invalidate the admin sections cache to show latest state
            await api.post("/admin/sections/broadcast").catch(() => null); // best-effort — endpoint may not exist
        } catch { /* ignore */ }

        // Show countdown: users will see changes within 30s (app polls every 30s)
        setState("done");
        setCountdown(30);
        const interval = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(interval);
                    setState("idle");
                    return 30;
                }
                return c - 1;
            });
        }, 1000);
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={state !== "idle"}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                state === "done"
                    ? "bg-green-500/10 border-green-500/40 text-green-600 dark:text-green-400"
                    : state === "refreshing"
                    ? "bg-muted border-muted-foreground/20 text-muted-foreground opacity-60"
                    : "border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-muted/50"
            }`}
        >
            {state === "refreshing" ? (
                <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Pushing…</span>
                </>
            ) : state === "done" ? (
                <>
                    <Zap className="size-3.5" />
                    <span>Users see it in ~{countdown}s</span>
                </>
            ) : (
                <>
                    <RefreshCw className="size-3.5" />
                    <span>Refresh App</span>
                </>
            )}
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function SectionsPageInner() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<SectionDraft | null>(null);
    const [saving, setSaving] = useState(false);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);
    const [deletingKey, setDeletingKey] = useState<string | null>(null);
    const [submittingKey, setSubmittingKey] = useState<string | null>(null);
    const [approvingKey, setApprovingKey] = useState<string | null>(null);
    const [rejectingKey, setRejectingKey] = useState<string | null>(null);
    const [showLayout, setShowLayout] = useState(false);

    const { data: sections = [], isLoading } = useQuery<Section[]>({
        queryKey: ["admin-sections"],
        queryFn: async () => {
            const { data } = await api.get("/admin/sections");
            return data.data ?? [];
        },
        staleTime: 30_000,
    });

    // Open edit dialog when ?edit=section_key is in URL (e.g. from Overview page "Edit Layout" link)
    useEffect(() => {
        const editKey = searchParams.get("edit");
        if (!editKey || sections.length === 0 || formOpen) return;
        const target = sections.find((s) => s.section_key === editKey);
        if (target) {
            setEditTarget({ ...target });
            setFormOpen(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, sections]);

    const liveSections = sections.filter((s) => s.status === "published");
    const pendingSections = sections.filter((s) => s.status === "pending_approval");
    const draftSections = sections.filter((s) => s.status === "draft" || s.status === "rejected");

    const openCreate = () => { setEditTarget({ ...EMPTY_DRAFT }); setFormOpen(true); };
    const openEdit = (s: Section) => { setEditTarget({ ...s }); setFormOpen(true); };

    const handleSave = async (draft: SectionDraft) => {
        if (!draft.section_key || !draft.title) { toast.error("Section key and title are required"); return; }
        setSaving(true);
        try {
            const isEdit = sections.some((s) => s.section_key === draft.section_key);
            if (isEdit) {
                const { section_key, status, is_active, ...payload } = draft;
                await api.patch(`/admin/sections/${section_key}`, payload);
                toast.success("Section updated");
            } else {
                await api.post("/admin/sections", draft);
                toast.success("Section created as draft");
            }
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            setFormOpen(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (s: Section) => {
        setSubmittingKey(s.section_key);
        try {
            await api.post(`/admin/sections/${s.section_key}/submit`);
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            toast.success("Submitted for approval — waiting for admin review");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit");
        } finally {
            setSubmittingKey(null);
        }
    };

    const handleApprove = async (s: Section) => {
        setApprovingKey(s.section_key);
        try {
            await api.post(`/admin/sections/${s.section_key}/approve`);
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            toast.success("🚀 Section approved and is now live on the app!");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve");
        } finally {
            setApprovingKey(null);
        }
    };

    const handleReject = async (s: Section) => {
        setRejectingKey(s.section_key);
        try {
            await api.post(`/admin/sections/${s.section_key}/reject`);
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            toast.success("Section rejected — moved back to drafts");
        } catch { toast.error("Failed to reject"); }
        finally { setRejectingKey(null); }
    };

    const handleUnpublish = async (s: Section) => {
        setTogglingKey(s.section_key);
        try {
            await api.patch(`/admin/sections/${s.section_key}`, { is_active: false, status: "draft" });
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            toast.success("Section unpublished — moved to drafts");
        } catch { toast.error("Failed to unpublish"); }
        finally { setTogglingKey(null); }
    };

    const handleDelete = async (key: string) => {
        setDeletingKey(key);
        try {
            await api.delete(`/admin/sections/${key}`);
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            toast.success("Section deleted");
        } catch { toast.error("Delete failed"); }
        finally { setDeletingKey(null); }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin size-6 text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-10 space-y-8">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Krown Sections</h1>
                        <p className="text-muted-foreground mt-1">
                            Curated home screen sections — cafés &amp; events that appear to users.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowLayout((v) => !v)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                                showLayout
                                    ? "bg-primary/10 border-primary/40 text-primary"
                                    : "border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-muted/50"
                            }`}
                        >
                            <LayoutGrid className="size-3.5" />
                            App Layout
                        </button>
                        <RefreshAppButton />
                        <Button onClick={openCreate} size="lg" className="gap-2">
                            <PlusCircle className="size-4" /> New Section
                        </Button>
                    </div>
                </div>

                {/* Summary bar */}
                {sections.length > 0 && (
                    <div className="grid grid-cols-4 gap-4">
                        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                            <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{liveSections.length}</p>
                                <p className="text-sm text-muted-foreground">Live</p>
                            </div>
                        </div>
                        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                            <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Clock className="size-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingSections.length}</p>
                                <p className="text-sm text-muted-foreground">Pending</p>
                            </div>
                        </div>
                        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                                <Sparkles className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{draftSections.length}</p>
                                <p className="text-sm text-muted-foreground">Drafts</p>
                            </div>
                        </div>
                        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
                            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <TrendingUp className="size-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {sections.reduce((acc, s) => acc + s.cafe_ids.length + s.event_ids.length + (s.item_ids ?? []).length, 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Total items</p>
                            </div>
                        </div>
                    </div>
                )}

                <Separator />

                {/* ── App Layout Preview Panel ─────────────────────────────── */}
                <AnimatePresence>
                    {showLayout && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="rounded-2xl border bg-card p-6 space-y-4 mb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold flex items-center gap-2">
                                            <LayoutGrid className="size-4 text-primary" />
                                            App Layout Preview
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Reorder live sections per tab — changes take effect in the app within 30s.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowLayout(false)}
                                        className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                                    >
                                        <ChevronDown className="size-4" />
                                    </button>
                                </div>
                                <AppPreviewPanel />
                            </div>
                            <Separator />
                        </motion.div>
                    )}
                </AnimatePresence>

                {sections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                        <div className="size-20 rounded-full bg-muted flex items-center justify-center">
                            <Sparkles className="size-9 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold">No sections yet</p>
                            <p className="text-muted-foreground mt-1 text-sm max-w-sm mx-auto">
                                Create your first curated section to show themed cafés and events on the app home screen.
                            </p>
                        </div>
                        <Button onClick={openCreate} size="lg">
                            <PlusCircle className="size-4 mr-2" /> Create First Section
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Pending Approval */}
                        {pendingSections.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                                    Pending Approval ({pendingSections.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {pendingSections.map((s) => (
                                        <SectionCard
                                            key={s.section_key}
                                            section={s}
                                            onEdit={() => openEdit(s)}
                                            onToggle={() => handleUnpublish(s)}
                                            onDelete={() => handleDelete(s.section_key)}
                                            onSubmit={() => handleSubmit(s)}
                                            onApprove={() => handleApprove(s)}
                                            onReject={() => handleReject(s)}
                                            toggling={togglingKey === s.section_key}
                                            deleting={deletingKey === s.section_key}
                                            submitting={submittingKey === s.section_key}
                                            approving={approvingKey === s.section_key}
                                            rejecting={rejectingKey === s.section_key}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Live */}
                        {liveSections.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-green-500 inline-block" />
                                    Live on App ({liveSections.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {liveSections.map((s) => (
                                        <SectionCard
                                            key={s.section_key}
                                            section={s}
                                            onEdit={() => openEdit(s)}
                                            onToggle={() => handleUnpublish(s)}
                                            onDelete={() => handleDelete(s.section_key)}
                                            onSubmit={() => handleSubmit(s)}
                                            onApprove={() => handleApprove(s)}
                                            onReject={() => handleReject(s)}
                                            toggling={togglingKey === s.section_key}
                                            deleting={deletingKey === s.section_key}
                                            submitting={submittingKey === s.section_key}
                                            approving={approvingKey === s.section_key}
                                            rejecting={rejectingKey === s.section_key}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Drafts & Rejected */}
                        {draftSections.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-zinc-400 inline-block" />
                                    Drafts &amp; Rejected ({draftSections.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {draftSections.map((s) => (
                                        <SectionCard
                                            key={s.section_key}
                                            section={s}
                                            onEdit={() => openEdit(s)}
                                            onToggle={() => handleUnpublish(s)}
                                            onDelete={() => handleDelete(s.section_key)}
                                            onSubmit={() => handleSubmit(s)}
                                            onApprove={() => handleApprove(s)}
                                            onReject={() => handleReject(s)}
                                            toggling={togglingKey === s.section_key}
                                            deleting={deletingKey === s.section_key}
                                            submitting={submittingKey === s.section_key}
                                            approving={approvingKey === s.section_key}
                                            rejecting={rejectingKey === s.section_key}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>

            {editTarget && (
                <SectionFormModal
                    open={formOpen}
                    initialDraft={editTarget}
                    onClose={() => setFormOpen(false)}
                    onSave={handleSave}
                    saving={saving}
                    isPending={editTarget.status === "pending_approval"}
                />
            )}
        </>
    );
}

// ─── Suspense wrapper (required for useSearchParams in Next.js App Router) ────
export default function SectionsPage() {
    return (
        <Suspense>
            <SectionsPageInner />
        </Suspense>
    );
}
