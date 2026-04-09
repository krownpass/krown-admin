"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    PlusCircle, Loader2, Pencil, Trash2, Eye, EyeOff,
    Sparkles, X, Calendar, Coffee, Ticket, Search,
    CheckCircle2, TrendingUp, Clock, Send, Check, XCircle,
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
    sort_order: number;
    is_active: boolean;
    status: SectionStatus;
    created_at?: string;
};

type SectionDraft = Omit<Section, "created_at">;

type Cafe = { cafe_id: string; cafe_name: string; city?: string; area?: string };
type Event = { event_id: string; title: string; venue_city?: string; start_time?: string; is_paid?: boolean; base_price?: number };

const EMPTY_DRAFT: SectionDraft = {
    section_key: "", title: "", subtitle: "", banner_image: "",
    valid_from: "", valid_until: "", cafe_ids: [], event_ids: [],
    sort_order: 10, is_active: false, status: "draft",
};

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

// ─── App Preview ──────────────────────────────────────────────────────────────
function SectionAppPreview({ draft, cafes, events }: { draft: SectionDraft; cafes: Cafe[]; events: Event[] }) {
    const selectedCafes = cafes.filter((c) => draft.cafe_ids.includes(c.cafe_id));
    const selectedEvents = events.filter((e) => draft.event_ids.includes(e.event_id));

    return (
        <div className="bg-zinc-950 rounded-2xl p-4 space-y-4 border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">App Preview</p>

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-white font-bold text-xl leading-tight">
                        {draft.title || "Section Title"}
                    </p>
                    {draft.subtitle && (
                        <p className="text-zinc-400 text-sm mt-1">{draft.subtitle}</p>
                    )}
                </div>
                <span className="text-xs text-amber-400 font-medium shrink-0 mt-1">
                    {draft.cafe_ids.length > 0 ? `${draft.cafe_ids.length} spots` : ""}
                    {draft.cafe_ids.length > 0 && draft.event_ids.length > 0 ? " · " : ""}
                    {draft.event_ids.length > 0 ? `${draft.event_ids.length} events` : ""}
                </span>
            </div>

            {selectedCafes.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedCafes.map((c) => (
                        <div key={c.cafe_id} className="shrink-0 w-32 bg-zinc-800 rounded-xl overflow-hidden">
                            <div className="h-16 bg-zinc-700 flex items-center justify-center">
                                <Coffee className="size-5 text-zinc-500" />
                            </div>
                            <div className="p-2">
                                <p className="text-white text-xs font-medium truncate">{c.cafe_name}</p>
                                <p className="text-zinc-500 text-xs truncate">{c.area ?? c.city ?? ""}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedEvents.map((ev) => (
                <div key={ev.event_id} className="flex items-center gap-3 bg-zinc-800 rounded-xl overflow-hidden">
                    <div className="w-16 h-16 bg-zinc-700 shrink-0 flex items-center justify-center">
                        <Ticket className="size-4 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0 py-2 pr-2">
                        <p className="text-white text-sm font-medium truncate">{ev.title}</p>
                        <p className="text-amber-400 text-xs mt-0.5">
                            {ev.venue_city ?? ""}
                            {ev.is_paid ? ` · ₹${ev.base_price}` : " · Free"}
                        </p>
                        {ev.start_time && (
                            <p className="text-zinc-500 text-xs mt-0.5">
                                {new Date(ev.start_time).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </p>
                        )}
                    </div>
                </div>
            ))}

            {selectedCafes.length === 0 && selectedEvents.length === 0 && (
                <div className="text-center py-8 text-zinc-600 text-sm">
                    Add cafés or events to see preview
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
    const [activeTab, setActiveTab] = useState<"details" | "content" | "preview">("details");
    const isEdit = !!initialDraft.section_key;

    const { data: cafes = [] } = useCafeList();
    const { data: events = [] } = useEventList();

    useEffect(() => { setDraft(initialDraft); setActiveTab("details"); }, [initialDraft, open]);

    const set = (k: keyof SectionDraft, v: unknown) => setDraft((p) => ({ ...p, [k]: v }));

    const addCafe = (id: string) => setDraft((p) => ({ ...p, cafe_ids: [...new Set([...p.cafe_ids, id])] }));
    const removeCafe = (id: string) => setDraft((p) => ({ ...p, cafe_ids: p.cafe_ids.filter((x) => x !== id) }));
    const addEvent = (id: string) => setDraft((p) => ({ ...p, event_ids: [...new Set([...p.event_ids, id])] }));
    const removeEvent = (id: string) => setDraft((p) => ({ ...p, event_ids: p.event_ids.filter((x) => x !== id) }));

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
                        </div>
                    )}

                    {activeTab === "content" && (
                        <div className="space-y-6">
                            <ItemPicker
                                label="Cafés"
                                items={cafes}
                                selectedIds={draft.cafe_ids}
                                onAdd={addCafe}
                                onRemove={removeCafe}
                                idKey="cafe_id"
                                nameKey="cafe_name"
                                subKey="city"
                                icon={Coffee}
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
                        </div>
                    )}

                    {activeTab === "preview" && (
                        <SectionAppPreview draft={draft} cafes={cafes} events={events} />
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    {!isPending && (
                        <Button onClick={() => onSave(draft)} disabled={saving} className="min-w-32">
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
                        <StatusBadge status={section.status} isExpired={isExpired} />
                        <span className="text-xs text-muted-foreground font-mono">#{section.sort_order}</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
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
                        <p className="text-lg font-bold">{section.cafe_ids.length + section.event_ids.length}</p>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SectionsPage() {
    const queryClient = useQueryClient();
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<SectionDraft | null>(null);
    const [saving, setSaving] = useState(false);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);
    const [deletingKey, setDeletingKey] = useState<string | null>(null);
    const [submittingKey, setSubmittingKey] = useState<string | null>(null);
    const [approvingKey, setApprovingKey] = useState<string | null>(null);
    const [rejectingKey, setRejectingKey] = useState<string | null>(null);

    const { data: sections = [], isLoading } = useQuery<Section[]>({
        queryKey: ["admin-sections"],
        queryFn: async () => {
            const { data } = await api.get("/admin/sections");
            return data.data ?? [];
        },
        staleTime: 30_000,
    });

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
                    <Button onClick={openCreate} size="lg" className="gap-2">
                        <PlusCircle className="size-4" /> New Section
                    </Button>
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
                                    {sections.reduce((acc, s) => acc + s.cafe_ids.length + s.event_ids.length, 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Total items</p>
                            </div>
                        </div>
                    </div>
                )}

                <Separator />

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
