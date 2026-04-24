"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowUp, ArrowDown, Edit3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionLayout = {
    cardWidth?: number;
    cardHeight?: number;
    cardBorderRadius?: number;
    cardBackground?: string;
    cardType?: "default" | "glow" | "wide" | "minimal" | "promo";
    cardStyle?: "shadow" | "border" | "none";
    showCount?: boolean;
    titleColor?: string;
    subtitleColor?: string;
    countColor?: string;
    cardNameColor?: string;
    cardSubColor?: string;
    cardPriceColor?: string;
    overlayOpacity?: number;
    overlayColor?: string;
    eventStyle?: "card" | "list";
    eventCardWidth?: number;
    eventCardHeight?: number;
    eventCardBorderRadius?: number;
    [key: string]: any; // allow extra fields like _templateId
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
    status: "draft" | "pending_approval" | "published" | "rejected";
    valid_from: string | null;
    valid_until: string | null;
    banner_image: string | null;
    layout?: SectionLayout;
};

// parse item_ids which may be stored as a JSON string or real array
function parseIds(val: any): string[] {
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.trim().startsWith("[")) {
        try { return JSON.parse(val); } catch { return []; }
    }
    return [];
}

// ─── Scaling constant (phone preview 308px inner vs real 390px) ───────────────
const S = 308 / 390; // ≈ 0.79 — multiply all RN pixel values by this

function px(n: number) { return Math.round(n * S); }

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomeOverviewPage() {
    const queryClient = useQueryClient();

    const { data: allSections = [], isLoading } = useQuery<Section[]>({
        queryKey: ["admin-sections"],
        queryFn: async () => {
            const { data } = await api.get("/admin/sections");
            const sections = (data.data ?? []) as Section[];
            return sections
                .filter((s) => s.status === "published")
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        },
        staleTime: 0,
        refetchOnMount: true,
    });

    const [reordering, setReordering] = useState(false);

    const moveSection = async (idx: number, dir: "up" | "down") => {
        const swapIdx = dir === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= allSections.length) return;

        const sectionA = allSections[idx];
        const sectionB = allSections[swapIdx];
        const orderA = sectionA.sort_order ?? idx;
        const orderB = sectionB.sort_order ?? swapIdx;

        setReordering(true);
        try {
            await Promise.all([
                api.patch(`/admin/sections/${sectionA.section_key}`, { sort_order: orderB }),
                api.patch(`/admin/sections/${sectionB.section_key}`, { sort_order: orderA }),
            ]);
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            toast.success("Order updated");
        } catch {
            toast.error("Failed to reorder sections");
        } finally {
            setReordering(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Figure out which system static sections are overridden by admin sections
    const dynamicKeys = new Set(allSections.map((s) => s.section_key));

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Top bar */}
            <div className="px-6 py-4 border-b shrink-0 bg-background flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold">Home Screen Preview</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Exact replica of what users see · {allSections.length} published sections
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-sections"] })}
                >
                    <RefreshCw className="size-3.5" />
                    Refresh
                </Button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
                {/* LEFT: Phone mockup */}
                <div className="flex flex-col items-center justify-start w-[45%] border-r overflow-y-auto p-8 bg-zinc-950/30 gap-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium self-start">Live Preview</p>
                    <PhoneMockup sections={allSections} dynamicKeys={dynamicKeys} />
                    <p className="text-xs text-zinc-500 text-center max-w-[200px]">
                        Scroll inside the phone to see all sections
                    </p>
                </div>

                {/* RIGHT: Section controls */}
                <div className="flex flex-col w-[55%] overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-3">
                        <div className="mb-4">
                            <h2 className="font-semibold text-sm">Published Sections ({allSections.length})</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Reorder or edit layout — changes reflect live in the preview</p>
                        </div>

                        {/* Static system sections (read-only info) */}
                        <div className="space-y-2">
                            {[
                                { key: "header", label: "Header", sub: "Wine gradient · Location · Search bar", fixed: true },
                                { key: "banner", label: "Banner Carousel", sub: "Promotional images · auto-scroll", fixed: true },
                                { key: "stories", label: "KROWN Stories", sub: "Story bubbles row", fixed: true },
                                ...(!dynamicKeys.has("cafes_with_offers")
                                    ? [{ key: "cafes_with_offers_static", label: "Cafes With Offers", sub: "Auto-generated · API data", fixed: true }]
                                    : []),
                                ...(!dynamicKeys.has("items_on_the_buzz")
                                    ? [{ key: "items_buzz_static", label: "Items on the Buzz", sub: "Auto-generated · API data", fixed: true }]
                                    : []),
                                ...(!dynamicKeys.has("recommended_for_you")
                                    ? [{ key: "recommended_static", label: "Recommended For You", sub: "Auto-generated · API data", fixed: true }]
                                    : []),
                            ].map((item) => (
                                <div
                                    key={item.key}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-zinc-700/50 bg-zinc-900/20"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                                        <p className="text-xs text-zinc-600">{item.sub}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs shrink-0 border-zinc-700 text-zinc-500">Fixed</Badge>
                                </div>
                            ))}
                        </div>

                        {/* Separator */}
                        {allSections.length > 0 && (
                            <div className="flex items-center gap-2 py-1">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">Admin Sections</span>
                                <div className="flex-1 h-px bg-border" />
                            </div>
                        )}

                        {/* Admin dynamic sections */}
                        {allSections.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-center gap-2 border border-dashed rounded-xl">
                                <p className="text-sm text-muted-foreground">No published sections</p>
                                <p className="text-xs text-zinc-500">Create and publish sections to see them here</p>
                            </div>
                        ) : (
                            allSections.map((section, idx) => (
                                <SectionCard
                                    key={section.section_key}
                                    section={section}
                                    idx={idx}
                                    total={allSections.length}
                                    reordering={reordering}
                                    onMoveUp={() => moveSection(idx, "up")}
                                    onMoveDown={() => moveSection(idx, "down")}
                                />
                            ))
                        )}

                        {/* Footer marker */}
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-zinc-700/50 bg-zinc-900/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground">Footer</p>
                                <p className="text-xs text-zinc-600">Sip. Save. Discover. · Copyright</p>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0 border-zinc-700 text-zinc-500">Fixed</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Section card (right panel) ───────────────────────────────────────────────
function SectionCard({
    section, idx, total, reordering, onMoveUp, onMoveDown,
}: {
    section: Section; idx: number; total: number; reordering: boolean;
    onMoveUp: () => void; onMoveDown: () => void;
}) {
    const layout = section.layout ?? {};
    const cardType = layout.cardType ?? "default";
    const itemCount = parseIds(section.item_ids).length;
    const totalItems = (section.cafe_ids?.length ?? 0) + (section.event_ids?.length ?? 0) + itemCount;

    const typeColors: Record<string, string> = {
        default: "bg-zinc-700 text-zinc-200",
        glow: "bg-amber-900/60 text-amber-300",
        wide: "bg-blue-900/60 text-blue-300",
        minimal: "bg-zinc-800 text-zinc-300",
        promo: "bg-purple-900/60 text-purple-300",
    };

    return (
        <div className="p-3.5 rounded-xl border bg-card space-y-3 hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate" style={{ color: layout.titleColor ?? undefined }}>
                            {section.title}
                        </p>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeColors[cardType] ?? typeColors.default}`}>
                            {cardType}
                        </span>
                    </div>
                    {section.subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{section.subtitle}</p>
                    )}
                    <p className="text-xs font-mono text-zinc-600 mt-1">{section.section_key}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={onMoveUp}
                        disabled={reordering || idx === 0}
                        title="Move up"
                        className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowUp className="size-3.5" />
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={reordering || idx === total - 1}
                        title="Move down"
                        className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowDown className="size-3.5" />
                    </button>
                </div>
            </div>

            {/* Layout strip */}
            <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-muted/50 px-2 py-1 rounded font-mono">
                    {layout.cardWidth ?? 171}×{layout.cardHeight ?? 172}
                </span>
                <span className="bg-muted/50 px-2 py-1 rounded flex items-center gap-1.5">
                    <span
                        className="w-3 h-3 rounded-full border border-zinc-600 inline-block"
                        style={{ backgroundColor: layout.titleColor ?? "#ffffff" }}
                    />
                    Title
                </span>
                <span className="bg-muted/50 px-2 py-1 rounded flex items-center gap-1.5">
                    <span
                        className="w-3 h-3 rounded-full border border-zinc-600 inline-block"
                        style={{ backgroundColor: layout.countColor ?? "#D4AF37" }}
                    />
                    Accent
                </span>
                <span className="bg-muted/50 px-2 py-1 rounded font-mono text-muted-foreground">
                    #{section.sort_order ?? 0}
                </span>
                <span className="bg-muted/50 px-2 py-1 rounded text-muted-foreground">
                    {totalItems} items
                </span>
            </div>

            <Link href={`/admin/dashboard/krown/sections?edit=${section.section_key}`}>
                <Button size="sm" variant="outline" className="w-full gap-1.5 h-8">
                    <Edit3 className="size-3" />
                    Edit Layout
                </Button>
            </Link>
        </div>
    );
}

// ─── Phone frame ──────────────────────────────────────────────────────────────
function PhoneMockup({ sections, dynamicKeys }: { sections: Section[]; dynamicKeys: Set<string> }) {
    return (
        // Outer phone body
        <div
            className="relative flex-shrink-0 shadow-2xl"
            style={{
                width: 336,
                height: 680,
                borderRadius: 44,
                backgroundColor: "#0a0a0a",
                border: "8px solid #1a1a1a",
                boxShadow: "0 0 0 1px #2a2a2a, 0 40px 80px rgba(0,0,0,0.8)",
                overflow: "hidden",
            }}
        >
            {/* Notch */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
                style={{
                    width: 120,
                    height: 28,
                    backgroundColor: "#0a0a0a",
                    borderRadius: "0 0 20px 20px",
                }}
            />

            {/* Screen */}
            <div
                className="absolute inset-0 overflow-hidden"
                style={{ borderRadius: 36, backgroundColor: "#000000" }}
            >
                {/* Status bar */}
                <div
                    className="flex items-center justify-between px-5 z-10 relative"
                    style={{ height: 40, backgroundColor: "#000", paddingTop: 10 }}
                >
                    <span className="text-white text-xs font-semibold">9:41</span>
                    <div className="flex items-center gap-1.5">
                        <svg width="14" height="10" viewBox="0 0 14 10" fill="white">
                            <rect x="0" y="3" width="2.5" height="7" rx="0.5" opacity="0.4"/>
                            <rect x="3.5" y="2" width="2.5" height="8" rx="0.5" opacity="0.6"/>
                            <rect x="7" y="1" width="2.5" height="9" rx="0.5" opacity="0.8"/>
                            <rect x="10.5" y="0" width="2.5" height="10" rx="0.5"/>
                        </svg>
                        <svg width="14" height="10" viewBox="0 0 22 14" fill="white">
                            <rect x="0" y="2" width="18" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
                            <rect x="2" y="4" width="11" height="6" rx="1" fill="white"/>
                            <path d="M19 5v4a2 2 0 000-4z" fill="white" opacity="0.5"/>
                        </svg>
                    </div>
                </div>

                {/* Scrollable screen content */}
                <div
                    className="overflow-y-auto"
                    style={{
                        height: "calc(100% - 40px)",
                        scrollbarWidth: "none",
                        backgroundColor: "#000000",
                    }}
                >
                    {/* ── HEADER ── */}
                    <HeaderSection />

                    {/* ── BANNER CAROUSEL ── */}
                    <BannerSection />

                    {/* ── STORIES ── */}
                    <StoriesSection />

                    {/* ── STATIC SYSTEM SECTIONS (only if not overridden) ── */}
                    {!dynamicKeys.has("cafes_with_offers") && <CafesWithOffersSection />}
                    {!dynamicKeys.has("items_on_the_buzz") && <ItemsOnBuzzSection />}
                    {!dynamicKeys.has("recommended_for_you") && <RecommendedSection />}

                    {/* ── DYNAMIC KROWN SECTIONS ── */}
                    {sections.map((section) => (
                        <DynamicSectionPreview key={section.section_key} section={section} />
                    ))}

                    {/* ── FOOTER ── */}
                    <FooterSection />
                </div>
            </div>
        </div>
    );
}

// ─── Header ──────────────────────────────────────────────────────────────────
function HeaderSection() {
    return (
        <div
            style={{
                background: "linear-gradient(180deg, #8B0024 0%, #800020 45%, #1A0007 100%)",
                paddingTop: px(18),
                paddingLeft: px(16),
                paddingRight: px(16),
                paddingBottom: px(22),
                borderBottomLeftRadius: px(28),
                borderBottomRightRadius: px(28),
                position: "relative",
            }}
        >
            {/* Top row */}
            <div className="flex items-center justify-between">
                <div>
                    <div style={{ fontSize: px(14), color: "#fff", fontWeight: 500, lineHeight: 1.3 }}>
                        Hey&nbsp;&nbsp;
                        <span style={{ fontStyle: "italic", fontWeight: 400 }}>there</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                        <svg width={px(12)} height={px(12)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                            <circle cx="12" cy="9" r="2.5"/>
                        </svg>
                        <span style={{ fontSize: px(14), color: "white", marginLeft: px(4) }}>
                            Bengaluru, Karnataka
                        </span>
                        <svg width={px(14)} height={px(14)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </div>
                </div>
                {/* Notification bell */}
                <div className="relative">
                    <svg width={px(26)} height={px(26)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 01-3.46 0"/>
                    </svg>
                    <div
                        style={{
                            position: "absolute", top: 1, right: 1,
                            width: px(7), height: px(7),
                            borderRadius: "50%", backgroundColor: "#C11E38",
                        }}
                    />
                </div>
            </div>

            {/* Search bar */}
            <div
                style={{
                    marginTop: px(16),
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderRadius: px(12),
                    paddingLeft: px(12),
                    paddingRight: px(12),
                    height: px(40),
                    display: "flex",
                    alignItems: "center",
                    gap: px(8),
                    border: "1px solid rgba(255,255,255,0.25)",
                }}
            >
                <svg width={px(14)} height={px(14)} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span style={{ fontSize: px(13), color: "rgba(255,255,255,0.6)" }}>
                    Search cafes, offers...
                </span>
            </div>

            {/* Bottom fade overlay */}
            <div
                style={{
                    position: "absolute",
                    bottom: -2,
                    left: 0,
                    right: 0,
                    height: px(40),
                    background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%)",
                    borderBottomLeftRadius: px(28),
                    borderBottomRightRadius: px(28),
                }}
            />
        </div>
    );
}

// ─── Banner carousel ──────────────────────────────────────────────────────────
function BannerSection() {
    return (
        <div style={{ paddingLeft: px(8), paddingRight: px(8), paddingTop: px(10) }}>
            <div
                style={{
                    width: "100%",
                    height: px(130),
                    borderRadius: px(16),
                    background: "linear-gradient(135deg, #1a1a1a 0%, #2a1a1a 50%, #1a1020 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: px(8),
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {/* Fake image placeholder with shimmer look */}
                <div
                    style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
                    }}
                />
                <svg width={px(28)} height={px(28)} viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span style={{ fontSize: px(11), color: "#555" }}>Banner Carousel</span>
                {/* Pagination dots */}
                <div className="flex gap-1 absolute bottom-2">
                    <div style={{ width: px(20), height: px(6), borderRadius: 3, backgroundColor: "#800020" }} />
                    <div style={{ width: px(6), height: px(6), borderRadius: 3, backgroundColor: "#444" }} />
                    <div style={{ width: px(6), height: px(6), borderRadius: 3, backgroundColor: "#444" }} />
                </div>
            </div>
        </div>
    );
}

// ─── Stories ──────────────────────────────────────────────────────────────────
function StoriesSection() {
    const RING = px(72);
    const INNER = px(66);
    const stories = ["Café Picks", "Weekends", "New Opens", "Offers"];

    return (
        <div style={{ paddingTop: px(16), paddingLeft: px(8) }}>
            <p style={{ fontSize: px(18), color: "#fff", fontWeight: 600, paddingLeft: px(8), marginBottom: px(12) }}>
                KROWN Stories
            </p>
            <div className="flex gap-4 overflow-hidden" style={{ paddingLeft: px(12), paddingBottom: px(8) }}>
                {stories.map((label, i) => (
                    <div key={i} className="flex flex-col items-center shrink-0" style={{ width: px(90), gap: px(8) }}>
                        {/* Gradient ring */}
                        <div
                            style={{
                                width: RING, height: RING,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #630F24, #D80237, #630F24)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 3,
                            }}
                        >
                            {/* Inner circle */}
                            <div
                                style={{
                                    width: INNER, height: INNER,
                                    borderRadius: "50%",
                                    backgroundColor: "#1a1a1a",
                                    border: "2.5px solid #000",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    overflow: "hidden",
                                }}
                            >
                                <svg width={px(24)} height={px(24)} viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
                                    <circle cx="12" cy="8" r="4"/>
                                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                                </svg>
                            </div>
                        </div>
                        <span style={{ fontSize: px(12), color: "#E0E0E0", textAlign: "center", lineHeight: 1.3, fontWeight: 500 }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Cafes With Offers (static) ───────────────────────────────────────────────
function CafesWithOffersSection() {
    const CARD_W = px(171);
    const CARD_H = px(172);

    return (
        <div style={{ padding: px(16), paddingTop: px(20) }}>
            <p style={{ fontSize: px(20), color: "#fff", fontWeight: 600, marginBottom: px(16) }}>
                Cafes With Offers
            </p>
            <div className="flex overflow-hidden" style={{ gap: px(18) }}>
                {[0, 1, 2].map((i) => (
                    <div key={i} className="shrink-0 flex flex-col" style={{ width: CARD_W, gap: px(10) }}>
                        {/* Card image */}
                        <div
                            style={{
                                width: CARD_W, height: CARD_H,
                                borderRadius: px(8),
                                background: "linear-gradient(180deg, #242424 0%, #3a0f1a 100%)",
                                position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            <div style={{
                                position: "absolute", bottom: px(12), left: px(12), right: px(12),
                            }}>
                                <div style={{
                                    height: px(12), width: "70%",
                                    backgroundColor: "rgba(249,250,251,0.8)", borderRadius: 3,
                                }} />
                            </div>
                            {/* Heart icon */}
                            <div style={{ position: "absolute", top: px(10), right: px(10) }}>
                                <svg width={px(20)} height={px(20)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                                </svg>
                            </div>
                        </div>
                        {/* Cafe info below card */}
                        <div>
                            <div style={{ height: px(12), width: "75%", backgroundColor: "#2a2a2a", borderRadius: 3, marginBottom: px(6) }} />
                            <div style={{ display: "flex", alignItems: "center", gap: px(4) }}>
                                <svg width={px(13)} height={px(13)} viewBox="0 0 24 24" fill="#F4C430">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                                <div style={{ height: px(10), width: "55%", backgroundColor: "#2a2a2a", borderRadius: 3 }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Items on the Buzz (static) ───────────────────────────────────────────────
function ItemsOnBuzzSection() {
    const TILE = px(80);
    return (
        <div style={{ padding: px(16), paddingTop: px(4) }}>
            <p style={{ fontSize: px(20), color: "#fff", fontWeight: 600, marginBottom: px(16) }}>
                Items on the Buzz
            </p>
            <div className="flex overflow-hidden" style={{ gap: px(14) }}>
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center shrink-0" style={{ width: TILE }}>
                        <div
                            style={{
                                width: TILE, height: TILE,
                                borderRadius: px(12),
                                backgroundColor: "#242424",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <svg width={px(24)} height={px(24)} viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
                                <path d="M18 8h1a4 4 0 010 8h-1"/>
                                <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
                                <line x1="6" y1="1" x2="6" y2="4"/>
                                <line x1="10" y1="1" x2="10" y2="4"/>
                                <line x1="14" y1="1" x2="14" y2="4"/>
                            </svg>
                        </div>
                        <div style={{ height: px(10), width: "80%", backgroundColor: "#2a2a2a", borderRadius: 3, marginTop: px(6) }} />
                        <div style={{ height: px(9), width: "60%", backgroundColor: "#1a1a1a", borderRadius: 3, marginTop: px(4) }} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Recommended (static) ────────────────────────────────────────────────────
function RecommendedSection() {
    const CARD_W = px(225);
    const IMG_H = px(150);

    return (
        <div style={{ paddingLeft: px(16), paddingRight: px(16), paddingTop: px(4), height: px(280) }}>
            <p style={{ fontSize: px(20), color: "#fff", fontWeight: 600, marginBottom: px(20) }}>
                Recommended for you
            </p>
            <div className="flex overflow-hidden" style={{ gap: px(18) }}>
                {[0, 1].map((i) => (
                    <div key={i} className="shrink-0" style={{ width: CARD_W }}>
                        <div
                            style={{
                                backgroundColor: "#212121",
                                borderRadius: px(8),
                                overflow: "hidden",
                            }}
                        >
                            {/* Image area */}
                            <div style={{ width: "100%", height: IMG_H, backgroundColor: "#2a2a2a", position: "relative" }}>
                                {/* Offer badge */}
                                <div
                                    style={{
                                        position: "absolute", top: px(10), left: px(10),
                                        backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 4,
                                        padding: `${px(2)}px ${px(6)}px`,
                                    }}
                                >
                                    <span style={{ color: "#fff", fontSize: px(11), fontWeight: 700 }}>20% OFF</span>
                                </div>
                                {/* Heart */}
                                <div style={{ position: "absolute", top: px(10), right: px(10) }}>
                                    <svg width={px(20)} height={px(20)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                                    </svg>
                                </div>
                            </div>
                            {/* Details */}
                            <div style={{ padding: px(12) }}>
                                <div style={{ height: px(14), width: "65%", backgroundColor: "#3a3a3a", borderRadius: 3, marginBottom: px(8) }} />
                                <div className="flex items-center" style={{ gap: px(4) }}>
                                    <svg width={px(14)} height={px(14)} viewBox="0 0 24 24" fill="#F4C430">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                    </svg>
                                    <div style={{ height: px(10), width: "45%", backgroundColor: "#2a2a2a", borderRadius: 3 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Dynamic section preview ──────────────────────────────────────────────────
function DynamicSectionPreview({ section }: { section: Section }) {
    const layout = section.layout ?? {};
    const cardType = layout.cardType ?? "default";
    const eventStyle = layout.eventStyle ?? "card";
    const titleColor = layout.titleColor ?? "#ffffff";
    const subtitleColor = layout.subtitleColor ?? "#9CA3AF";
    const countColor = layout.countColor ?? "#D4AF37";
    const showCount = layout.showCount !== false;
    const cardW = px(layout.cardWidth ?? 171);
    const cardH = px(layout.cardHeight ?? 172);

    const itemCount = parseIds(section.item_ids).length;
    const cafeCount = section.cafe_ids?.length ?? 0;
    const eventCount = section.event_ids?.length ?? 0;
    const totalCount = cafeCount + eventCount + itemCount;
    const hasData = totalCount > 0;

    // Event-only section → show event cards (portrait for "card", rows for "list")
    const isEventOnly = eventCount > 0 && cafeCount === 0 && itemCount === 0;
    const isItems = itemCount > 0 && cafeCount === 0 && eventCount === 0;

    // PROMO card type — only show promo banner when no real content
    if (cardType === "promo" && !hasData) {
        return (
            <div style={{ padding: px(24), paddingTop: px(8) }}>
                <div
                    style={{
                        borderRadius: px(16),
                        border: `1px solid ${countColor}50`,
                        padding: px(24),
                        textAlign: "center",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: `0 0 ${px(16)}px ${countColor}30`,
                        background: `linear-gradient(135deg, ${titleColor}12 0%, ${countColor}10 100%)`,
                    }}
                >
                    <p style={{ fontSize: px(22), color: titleColor, fontWeight: 700, lineHeight: 1.3 }}>
                        {section.title}
                    </p>
                    {section.subtitle && (
                        <p style={{ fontSize: px(14), color: subtitleColor, marginTop: px(8), opacity: 0.9 }}>
                            {section.subtitle}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // EVENT-ONLY section — large portrait cards ("card" style) or compact list rows ("list" style)
    if (isEventOnly) {
        const evtW = px(layout.eventCardWidth ?? 160);
        const evtH = px(layout.eventCardHeight ?? 230);

        if (eventStyle === "list") {
            // Compact list rows
            return (
                <div style={{ padding: px(24), paddingTop: px(8) }}>
                    <SectionHeader title={section.title} subtitle={section.subtitle} titleColor={titleColor} subtitleColor={subtitleColor} countColor={countColor} showCount={showCount} count={eventCount} />
                    <div style={{ display: "flex", flexDirection: "column", gap: px(10) }}>
                        {Array.from({ length: Math.min(3, eventCount || 3) }).map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex", alignItems: "center", gap: px(10),
                                    backgroundColor: "#1a1a1a", borderRadius: px(10),
                                    padding: px(10), overflow: "hidden",
                                }}
                            >
                                {/* Thumbnail */}
                                <div style={{
                                    width: px(60), height: px(60), borderRadius: px(8), flexShrink: 0,
                                    background: "linear-gradient(135deg, #2a1a2e 0%, #1a1a2e 100%)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <svg width={px(20)} height={px(20)} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                </div>
                                {/* Text */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ height: px(11), width: "75%", backgroundColor: `${titleColor}70`, borderRadius: 3, marginBottom: px(5) }} />
                                    <div style={{ height: px(9), width: "55%", backgroundColor: "#2a2a2a", borderRadius: 3, marginBottom: px(4) }} />
                                    <div style={{ height: px(9), width: "40%", backgroundColor: countColor + "60", borderRadius: 3 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Large portrait card carousel (default for events)
        return (
            <div style={{ padding: px(24), paddingTop: px(8) }}>
                <SectionHeader title={section.title} subtitle={section.subtitle} titleColor={titleColor} subtitleColor={subtitleColor} countColor={countColor} showCount={showCount} count={eventCount} />
                <div style={{ display: "flex", overflow: "hidden", gap: px(12), marginLeft: -px(8) }}>
                    {Array.from({ length: Math.min(3, eventCount || 3) }).map((_, i) => (
                        <div
                            key={i}
                            className="shrink-0"
                            style={{
                                width: evtW, height: evtH,
                                borderRadius: px(14),
                                background: "linear-gradient(160deg, #2a1a2e 0%, #1a1a3e 50%, #0a0a1a 100%)",
                                position: "relative",
                                overflow: "hidden",
                                flexShrink: 0,
                            }}
                        >
                            {/* Gradient scrim */}
                            <div style={{
                                position: "absolute", inset: 0,
                                background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)",
                            }} />
                            {/* Price badge top-left */}
                            <div style={{
                                position: "absolute", top: px(8), left: px(8),
                                backgroundColor: "rgba(0,0,0,0.55)", borderRadius: px(6),
                                padding: `${px(3)}px ${px(7)}px`,
                            }}>
                                <span style={{ color: countColor, fontSize: px(9), fontWeight: 700 }}>FREE</span>
                            </div>
                            {/* Heart top-right */}
                            <div style={{
                                position: "absolute", top: px(8), right: px(8),
                                width: px(26), height: px(26), borderRadius: "50%",
                                backgroundColor: "rgba(255,255,255,0.12)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <svg width={px(12)} height={px(12)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                            </div>
                            {/* Bottom content */}
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: px(10) }}>
                                <div style={{ height: px(9), width: "50%", backgroundColor: countColor + "90", borderRadius: 3, marginBottom: px(5) }} />
                                <div style={{ height: px(11), width: "85%", backgroundColor: `${titleColor}CC`, borderRadius: 3, marginBottom: px(4) }} />
                                <div style={{ height: px(9), width: "60%", backgroundColor: "#3a3a3a", borderRadius: 3 }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ITEMS-ONLY section — buzz items (square cards with name + price)
    if (isItems) {
        const TILE = px(80);
        const numTiles = Math.max(3, Math.min(5, itemCount || 4));
        return (
            <div style={{ padding: px(24), paddingTop: px(8) }}>
                <SectionHeader title={section.title} subtitle={section.subtitle} titleColor={titleColor} subtitleColor={subtitleColor} countColor={countColor} showCount={showCount} count={itemCount} />
                <div style={{ display: "flex", overflow: "hidden", gap: px(14) }}>
                    {Array.from({ length: numTiles }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center shrink-0" style={{ width: TILE }}>
                            <div
                                style={{
                                    width: TILE, height: TILE,
                                    borderRadius: px(12),
                                    background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
                                    overflow: "hidden",
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    ...(cardType === "glow" ? {
                                        boxShadow: `0 0 ${px(10)}px ${countColor}50`,
                                        border: `1px solid ${countColor}40`,
                                    } : {}),
                                }}
                            >
                                {/* Trending badge */}
                                <div style={{
                                    position: "absolute", bottom: px(5), left: px(5),
                                    backgroundColor: "rgba(0,0,0,0.7)", borderRadius: px(5),
                                    padding: `${px(2)}px ${px(5)}px`,
                                }}>
                                    <span style={{ color: countColor, fontSize: px(8), fontWeight: 600 }}>buzz</span>
                                </div>
                                <svg width={px(24)} height={px(24)} viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
                                    <path d="M18 8h1a4 4 0 010 8h-1"/>
                                    <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
                                    <line x1="6" y1="1" x2="6" y2="4"/>
                                    <line x1="10" y1="1" x2="10" y2="4"/>
                                    <line x1="14" y1="1" x2="14" y2="4"/>
                                </svg>
                            </div>
                            <div style={{ height: px(10), width: "80%", backgroundColor: `${titleColor}40`, borderRadius: 3, marginTop: px(7) }} />
                            <div style={{ height: px(8), width: "55%", backgroundColor: countColor + "50", borderRadius: 3, marginTop: px(4) }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const numCards = Math.max(2, Math.min(4, totalCount || 3));

    // WIDE card type
    if (cardType === "wide") {
        return (
            <div style={{ padding: px(24), paddingTop: px(8) }}>
                <SectionHeader title={section.title} subtitle={section.subtitle} titleColor={titleColor} subtitleColor={subtitleColor} countColor={countColor} showCount={showCount} count={totalCount} />
                <div className="flex overflow-hidden" style={{ gap: px(12), marginLeft: -px(8) }}>
                    {Array.from({ length: numCards }).map((_, i) => (
                        <div
                            key={i}
                            className="shrink-0"
                            style={{
                                width: cardW, height: cardH,
                                borderRadius: px(10),
                                backgroundColor: "#1a1a1a",
                                position: "relative",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "flex-end",
                            }}
                        >
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.65) 100%)" }} />
                            <div style={{ padding: px(12), zIndex: 1 }}>
                                <div style={{ height: px(11), width: "70%", backgroundColor: `${titleColor}80`, borderRadius: 2 }} />
                                <div style={{ height: px(9), width: "45%", backgroundColor: "#4a4a4a", borderRadius: 2, marginTop: px(4) }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // MINIMAL card type
    if (cardType === "minimal") {
        return (
            <div style={{ padding: px(24), paddingTop: px(8) }}>
                <SectionHeader title={section.title} subtitle={section.subtitle} titleColor={titleColor} subtitleColor={subtitleColor} countColor={countColor} showCount={showCount} count={totalCount} />
                <div className="flex overflow-hidden" style={{ gap: px(12) }}>
                    {Array.from({ length: numCards }).map((_, i) => (
                        <div
                            key={i}
                            className="shrink-0 flex items-center justify-center"
                            style={{
                                width: cardW, height: cardH,
                                borderRadius: px(10),
                                backgroundColor: "#1A1A1A",
                            }}
                        >
                            <div style={{ height: px(13), width: "60%", backgroundColor: `${titleColor}50`, borderRadius: 3 }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // DEFAULT and GLOW (cafes / items / mixed)
    return (
        <div style={{ padding: px(24), paddingTop: px(8) }}>
            <SectionHeader title={section.title} subtitle={section.subtitle} titleColor={titleColor} subtitleColor={subtitleColor} countColor={countColor} showCount={showCount} count={totalCount} />
            {/* Card carousel */}
            <div
                style={{
                    marginLeft: -px(8),
                    display: "flex",
                    overflow: "hidden",
                    gap: isItems ? px(12) : px(18),
                }}
            >
                {Array.from({ length: numCards }).map((_, i) => (
                    <div key={i} className="shrink-0 flex flex-col" style={{ width: cardW, gap: px(10) }}>
                        {/* Card image */}
                        <div
                            style={{
                                width: cardW, height: cardH,
                                borderRadius: isItems ? px(10) : px(8),
                                background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
                                overflow: "hidden",
                                position: "relative",
                                ...(cardType === "glow" ? {
                                    boxShadow: `0 0 ${px(12)}px ${countColor}50`,
                                    border: `1px solid ${countColor}40`,
                                } : {}),
                            }}
                        >
                            {/* inner icon */}
                            <div
                                style={{
                                    position: "absolute", inset: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >
                                <div style={{ width: px(32), height: px(32), borderRadius: "50%", backgroundColor: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {isItems ? (
                                        <svg width={px(16)} height={px(16)} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                                            <path d="M18 8h1a4 4 0 010 8h-1"/>
                                            <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
                                            <line x1="6" y1="1" x2="6" y2="4"/>
                                            <line x1="10" y1="1" x2="10" y2="4"/>
                                            <line x1="14" y1="1" x2="14" y2="4"/>
                                        </svg>
                                    ) : (
                                        <svg width={px(16)} height={px(16)} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                                        </svg>
                                    )}
                                </div>
                            </div>
                            {/* Bottom overlay gradient */}
                            {!isItems && (
                                <div style={{
                                    position: "absolute", bottom: 0, left: 0, right: 0,
                                    height: "40%",
                                    background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.45) 100%)",
                                }} />
                            )}
                            {/* Item tag badge */}
                            {isItems && (
                                <div style={{
                                    position: "absolute", bottom: px(8), left: px(8),
                                    backgroundColor: "rgba(0,0,0,0.65)", borderRadius: px(6),
                                    paddingLeft: px(7), paddingRight: px(7), paddingTop: px(3), paddingBottom: px(3),
                                }}>
                                    <span style={{ color: countColor, fontSize: px(10), fontWeight: 500 }}>trending</span>
                                </div>
                            )}
                        </div>
                        {/* Info below card */}
                        <div>
                            <div style={{ height: px(12), width: "78%", backgroundColor: "#2a2a2a", borderRadius: 3, marginBottom: px(5) }} />
                            <div style={{ display: "flex", alignItems: "center", gap: px(4) }}>
                                {isItems ? (
                                    <div style={{ height: px(10), width: "55%", backgroundColor: "#1f1f1f", borderRadius: 3 }} />
                                ) : (
                                    <>
                                        <svg width={px(12)} height={px(12)} viewBox="0 0 24 24" fill="#F4C430">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                        </svg>
                                        <div style={{ height: px(10), width: "50%", backgroundColor: "#1f1f1f", borderRadius: 3 }} />
                                    </>
                                )}
                            </div>
                            {isItems && (
                                <div style={{ height: px(11), width: "45%", backgroundColor: countColor + "80", borderRadius: 3, marginTop: px(3) }} />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Section header (title + count) ──────────────────────────────────────────
function SectionHeader({ title, subtitle, titleColor, subtitleColor, countColor, showCount, count }: {
    title: string; subtitle: string | null;
    titleColor: string; subtitleColor: string; countColor: string;
    showCount: boolean; count: number;
}) {
    return (
        <div
            className="flex items-start justify-between"
            style={{ marginBottom: px(16) }}
        >
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: px(20), color: titleColor, fontWeight: 600, lineHeight: 1.2 }}>{title}</p>
                {subtitle && (
                    <p style={{ fontSize: px(13), color: subtitleColor, marginTop: px(3) }}>{subtitle}</p>
                )}
            </div>
            {showCount && count > 0 && (
                <p style={{ fontSize: px(13), color: countColor, marginTop: px(3), flexShrink: 0 }}>
                    {count} {count === 1 ? "spot" : "spots"}
                </p>
            )}
        </div>
    );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function FooterSection() {
    return (
        <div style={{ padding: px(16), paddingLeft: px(24), paddingBottom: px(80) }}>
            <p style={{ fontSize: px(40), fontWeight: 800, color: "#9CA3AF", lineHeight: 1.2 }}>Sip.</p>
            <p style={{ fontSize: px(40), fontWeight: 800, color: "#9CA3AF", lineHeight: 1.2 }}>Save.</p>
            <p style={{ fontSize: px(40), color: "#9CA3AF", lineHeight: 1.2, fontStyle: "italic" }}>Discover.</p>
            <p style={{ fontSize: px(12), color: "#6B7280", marginTop: px(32), textAlign: "center" }}>
                © {new Date().getFullYear()} Krown · Made with ☕ in India
            </p>
        </div>
    );
}
