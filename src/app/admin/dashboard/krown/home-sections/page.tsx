"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    PlusCircle, Loader2, Pencil, Trash2, Eye, EyeOff,
    Sparkles, X, Calendar, Coffee, Ticket, Search,
    TrendingUp, Star, Clock, Send, Check, XCircle,
    LayoutGrid, Info,
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
    item_ids?: string[];
    sort_order: number;
    is_active: boolean;
    status: SectionStatus;
    created_at?: string;
};

type SectionDraft = Omit<Section, "created_at">;
type Cafe = { cafe_id: string; cafe_name: string; city?: string; area?: string };
type BuzzItem = { item_id: string; item_name: string; cafe_name: string; cafe_id: string; category?: string };

// ─── System section definitions ───────────────────────────────────────────────
const SYSTEM_SECTIONS = [
    {
        key: "recommended_for_you",
        label: "Recommended for You",
        description: "Handpicked cafés shown to users on the home screen.",
        icon: Star,
        defaultTitle: "Recommended for You",
        defaultSubtitle: "Cafés we think you'll love",
        sortOrder: 1,
        pickerType: "cafes" as const,
    },
    {
        key: "cafes_with_offers",
        label: "Cafes with Offers",
        description: "Cafés currently running deals or promotions.",
        icon: Coffee,
        defaultTitle: "Cafes with Offers",
        defaultSubtitle: "Great deals waiting for you",
        sortOrder: 2,
        pickerType: "cafes" as const,
    },
    {
        key: "items_on_the_buzz",
        label: "Items on the Buzz",
        description: "Trending menu items shown in the Buzz section.",
        icon: TrendingUp,
        defaultTitle: "Items on the Buzz",
        defaultSubtitle: "Trending right now ✨",
        sortOrder: 3,
        pickerType: "items" as const,
    },
] as const;

// ─── Data hooks ───────────────────────────────────────────────────────────────
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

function useBuzzItems() {
    return useQuery<BuzzItem[]>({
        queryKey: ["admin-buzz-items"],
        queryFn: async () => {
            const { data } = await api.get("/admin/items/list");
            return data.data ?? [];
        },
        staleTime: 5 * 60_000,
    });
}

// ─── Item Picker (same as sections page) ─────────────────────────────────────
function ItemPicker({
    label, items, selectedIds, onAdd, onRemove,
    idKey, nameKey, subKey, icon: Icon, disabled,
}: {
    label: string; items: any[]; selectedIds: string[];
    onAdd: (id: string) => void; onRemove: (id: string) => void;
    idKey: string; nameKey: string; subKey?: string;
    icon: React.ElementType; disabled?: boolean;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const filtered = items.filter(
        (it) =>
            !selectedIds.includes(String(it[idKey])) &&
            [it[nameKey], subKey ? it[subKey] : ""]
                .filter(Boolean).join(" ").toLowerCase().includes(query.toLowerCase())
    );
    const selectedItems = items.filter((it) => selectedIds.includes(String(it[idKey])));

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
                        <span key={it[idKey]}
                            className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary text-xs px-2.5 py-1 rounded-full">
                            <span className="font-medium">{it[nameKey]}</span>
                            {subKey && it[subKey] && (
                                <span className="text-primary/60">· {it[subKey]}</span>
                            )}
                            <button onClick={() => onRemove(String(it[idKey]))} className="ml-0.5 hover:text-destructive">
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
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                            {filtered.slice(0, 30).map((it) => (
                                <button key={it[idKey]}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2"
                                    onClick={() => { onAdd(String(it[idKey])); setQuery(""); setOpen(false); }}>
                                    <span className="font-medium truncate">{it[nameKey]}</span>
                                    {subKey && it[subKey] && (
                                        <span className="text-xs text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
                                            {it[subKey]}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    )}
                    {open && query && filtered.length === 0 && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="absolute z-50 w-full mt-1 bg-popover border rounded-xl shadow-xl px-4 py-3 text-sm text-muted-foreground">
                            No results for &ldquo;{query}&rdquo;
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
    open, draft: initialDraft, pickerType, sectionLabel,
    onClose, onSave, saving,
}: {
    open: boolean;
    draft: SectionDraft;
    pickerType: "cafes" | "items";
    sectionLabel: string;
    onClose: () => void;
    onSave: (d: SectionDraft) => void;
    saving: boolean;
}) {
    const [draft, setDraft] = useState<SectionDraft>(initialDraft);
    const [tab, setTab] = useState<"details" | "content">("details");
    const isPending = draft.status === "pending_approval";

    const { data: cafes = [] } = useCafeList();
    const { data: buzzItems = [] } = useBuzzItems();

    useEffect(() => { setDraft(initialDraft); setTab("details"); }, [initialDraft, open]);

    const set = (k: keyof SectionDraft, v: unknown) => setDraft((p) => ({ ...p, [k]: v }));

    const addCafe = (id: string) => setDraft((p) => ({ ...p, cafe_ids: [...new Set([...p.cafe_ids, id])] }));
    const removeCafe = (id: string) => setDraft((p) => ({ ...p, cafe_ids: p.cafe_ids.filter((x) => x !== id) }));
    const addItem = (id: string) => setDraft((p) => ({ ...p, item_ids: [...new Set([...(p.item_ids ?? []), id])] }));
    const removeItem = (id: string) => setDraft((p) => ({ ...p, item_ids: (p.item_ids ?? []).filter((x) => x !== id) }));

    return (
        <Dialog open={open} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        {sectionLabel}
                        {isPending && (
                            <Badge className="bg-amber-500 text-white text-xs">Pending Approval — Read Only</Badge>
                        )}
                    </DialogTitle>
                    <div className="flex gap-1 mt-3">
                        {(["details", "content"] as const).map((t) => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {isPending && (
                        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                            <Clock className="size-4 shrink-0" />
                            Pending admin approval — read only until approved or rejected.
                        </div>
                    )}

                    {tab === "details" && (
                        <div className={`space-y-4 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
                            <div className="space-y-1.5">
                                <Label>Section Key</Label>
                                <Input value={draft.section_key} disabled className="opacity-60 font-mono text-sm" />
                                <p className="text-xs text-muted-foreground">Fixed identifier — used by the app to render this section</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Title *</Label>
                                    <Input value={draft.title} onChange={(e) => set("title", e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Sort Order</Label>
                                    <Input type="number" value={draft.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} />
                                    <p className="text-xs text-muted-foreground">Lower = higher on home screen</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Subtitle</Label>
                                <Input value={draft.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} placeholder="Short description shown under the title" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Banner Image URL</Label>
                                <Input value={draft.banner_image ?? ""} onChange={(e) => set("banner_image", e.target.value)} placeholder="https://..." />
                                {draft.banner_image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={draft.banner_image} alt="banner preview" className="w-full h-28 object-cover rounded-lg mt-2" />
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Valid From</Label>
                                    <Input type="datetime-local"
                                        value={draft.valid_from ? draft.valid_from.slice(0, 16) : ""}
                                        onChange={(e) => set("valid_from", e.target.value ? new Date(e.target.value).toISOString() : null)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Valid Until</Label>
                                    <Input type="datetime-local"
                                        value={draft.valid_until ? draft.valid_until.slice(0, 16) : ""}
                                        onChange={(e) => set("valid_until", e.target.value ? new Date(e.target.value).toISOString() : null)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "content" && (
                        <div className={`space-y-6 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
                            {pickerType === "cafes" && (
                                <ItemPicker
                                    label="Cafés"
                                    items={cafes}
                                    selectedIds={draft.cafe_ids}
                                    onAdd={addCafe}
                                    onRemove={removeCafe}
                                    idKey="cafe_id"
                                    nameKey="cafe_name"
                                    subKey="area"
                                    icon={Coffee}
                                />
                            )}

                            {pickerType === "items" && (
                                <>
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                                        <Info className="size-3.5 shrink-0 mt-0.5" />
                                        Search items by name or café — both are shown so you can identify them easily.
                                    </div>
                                    <ItemPicker
                                        label="Buzz Items"
                                        items={buzzItems}
                                        selectedIds={draft.item_ids ?? []}
                                        onAdd={addItem}
                                        onRemove={removeItem}
                                        idKey="item_id"
                                        nameKey="item_name"
                                        subKey="cafe_name"
                                        icon={TrendingUp}
                                    />
                                    {(draft.item_ids ?? []).length > 0 && (
                                        <div className="rounded-xl border overflow-hidden">
                                            <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Selected Items</p>
                                                <Badge variant="secondary" className="text-xs">{(draft.item_ids ?? []).length}</Badge>
                                            </div>
                                            <div className="divide-y">
                                                {(draft.item_ids ?? []).map((id, idx) => {
                                                    const item = buzzItems.find((b) => b.item_id === id);
                                                    if (!item) return null;
                                                    return (
                                                        <div key={id} className="flex items-center justify-between px-4 py-2.5">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs text-muted-foreground w-4 text-right shrink-0">{idx + 1}</span>
                                                                <div>
                                                                    <p className="text-sm font-medium">{item.item_name}</p>
                                                                    <p className="text-xs text-muted-foreground">{item.cafe_name}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {item.category && <Badge variant="secondary" className="text-xs">{item.category}</Badge>}
                                                                <button onClick={() => removeItem(id)} className="text-muted-foreground hover:text-destructive transition-colors">
                                                                    <X className="size-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    {!isPending && (
                        <Button onClick={() => onSave(draft)} disabled={saving} className="min-w-32">
                            {saving ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                            Save Changes
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, isExpired }: { status?: SectionStatus; isExpired?: boolean }) {
    if (isExpired) return <Badge variant="secondary">Expired</Badge>;
    if (status === "published") return <Badge className="bg-green-500 hover:bg-green-600 text-white">Live</Badge>;
    if (status === "pending_approval") return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Pending</Badge>;
    if (status === "rejected") return <Badge className="bg-red-500 hover:bg-red-600 text-white">Rejected</Badge>;
    if (status === "draft") return <Badge variant="secondary">Draft</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Not Created</Badge>;
}

// ─── System Section Card ──────────────────────────────────────────────────────
function SystemSectionCard({
    def, section,
    onEdit, onCreate, onSubmit, onApprove, onReject, onUnpublish, onDelete,
    togglingKey, deletingKey, submittingKey, approvingKey, rejectingKey,
}: {
    def: typeof SYSTEM_SECTIONS[number];
    section?: Section;
    onEdit: () => void;
    onCreate: () => void;
    onSubmit: () => void;
    onApprove: () => void;
    onReject: () => void;
    onUnpublish: () => void;
    onDelete: () => void;
    togglingKey: string | null;
    deletingKey: string | null;
    submittingKey: string | null;
    approvingKey: string | null;
    rejectingKey: string | null;
}) {
    const Icon = def.icon;
    const isExpired = section?.valid_until ? new Date(section.valid_until) < new Date() : false;
    const status = section?.status;
    const isPending = status === "pending_approval";
    const isPublished = status === "published";
    const canSubmit = status === "draft" || status === "rejected";
    const key = def.key;

    const itemCount = section
        ? def.pickerType === "items"
            ? (section.item_ids?.length ?? 0)
            : section.cafe_ids.length
        : 0;

    return (
        <motion.div layout className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col">
            {/* Header banner */}
            {section?.banner_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={section.banner_image} alt="banner" className="w-full h-32 object-cover" />
            ) : (
                <div className="w-full h-32 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                    <Icon className="size-8 text-muted-foreground/30" />
                </div>
            )}

            <div className="p-5 flex flex-col flex-1 gap-4">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Icon className="size-4 text-muted-foreground shrink-0" />
                            <p className="font-bold text-base leading-tight truncate">{def.label}</p>
                        </div>
                        {section?.subtitle ? (
                            <p className="text-sm text-muted-foreground line-clamp-2">{section.subtitle}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground/60 italic">{def.description}</p>
                        )}
                    </div>
                    <StatusBadge status={status} isExpired={isExpired} />
                </div>

                {/* Stats */}
                {section ? (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/50 rounded-xl p-3 text-center">
                            <Icon className="size-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-lg font-bold">{itemCount}</p>
                            <p className="text-xs text-muted-foreground">
                                {def.pickerType === "items" ? "Items" : "Cafés"}
                            </p>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-3 text-center">
                            <span className="font-mono text-xs text-muted-foreground block mb-1 truncate">key</span>
                            <p className="text-xs font-mono font-medium truncate">{section.section_key}</p>
                            {section.created_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(section.created_at).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-muted/30 border border-dashed rounded-xl p-4 text-center space-y-1">
                        <LayoutGrid className="size-5 mx-auto text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Not set up yet</p>
                        <p className="text-xs text-muted-foreground/60">Create this section to make it manageable</p>
                    </div>
                )}

                {/* Validity */}
                {section && (section.valid_from || section.valid_until) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3 shrink-0" />
                        {section.valid_from && <span>From {new Date(section.valid_from).toLocaleDateString()}</span>}
                        {section.valid_from && section.valid_until && <span>→</span>}
                        {section.valid_until && <span>Until {new Date(section.valid_until).toLocaleDateString()}</span>}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-auto pt-1">
                    {/* Not created yet */}
                    {!section && (
                        <Button size="sm" className="w-full gap-1.5" onClick={onCreate}>
                            <PlusCircle className="size-3.5" /> Create Section
                        </Button>
                    )}

                    {/* Pending: Approve / Reject */}
                    {isPending && (
                        <div className="flex gap-2">
                            <Button size="sm" className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                onClick={onApprove} disabled={approvingKey === key || rejectingKey === key}>
                                {approvingKey === key ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                                Approve
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 gap-1.5 border-red-500/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={onReject} disabled={approvingKey === key || rejectingKey === key}>
                                {rejectingKey === key ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                                Reject
                            </Button>
                        </div>
                    )}

                    {/* Published: Unpublish */}
                    {isPublished && (
                        <Button size="sm" variant="outline"
                            className="w-full gap-1.5 border-green-500/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={onUnpublish} disabled={togglingKey === key || isExpired}>
                            {togglingKey === key ? <Loader2 className="size-3.5 animate-spin" /> : <EyeOff className="size-3.5" />}
                            Unpublish
                        </Button>
                    )}

                    {/* Draft / Rejected: Submit + Edit */}
                    {canSubmit && (
                        <div className="flex gap-2">
                            <Button size="sm" className="flex-1 gap-1.5" onClick={onSubmit} disabled={submittingKey === key}>
                                {submittingKey === key ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                                Submit for Approval
                            </Button>
                            <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
                                <Pencil className="size-3.5" /> Edit
                            </Button>
                        </div>
                    )}

                    {/* Pending: View only */}
                    {isPending && (
                        <Button size="sm" variant="outline" onClick={onEdit} className="w-full gap-1.5 opacity-70">
                            <Eye className="size-3.5" /> View Details
                        </Button>
                    )}

                    {/* Published: Edit */}
                    {isPublished && (
                        <Button size="sm" variant="outline" onClick={onEdit} className="w-full gap-1.5">
                            <Pencil className="size-3.5" /> Edit Content
                        </Button>
                    )}

                    {/* Delete (if section exists) */}
                    {section && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                                    {deletingKey === key ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5 mr-1.5" />}
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete &ldquo;{def.label}&rdquo;?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This removes the section from the app. Users will no longer see it on the home screen. You can recreate it later.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={onDelete}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomeSectionsPage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [activeDef, setActiveDef] = useState<typeof SYSTEM_SECTIONS[number] | null>(null);
    const [activeDraft, setActiveDraft] = useState<SectionDraft | null>(null);
    const [saving, setSaving] = useState(false);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);
    const [deletingKey, setDeletingKey] = useState<string | null>(null);
    const [submittingKey, setSubmittingKey] = useState<string | null>(null);
    const [approvingKey, setApprovingKey] = useState<string | null>(null);
    const [rejectingKey, setRejectingKey] = useState<string | null>(null);

    const { data: allSections = [], isLoading } = useQuery<Section[]>({
        queryKey: ["admin-sections"],
        queryFn: async () => {
            const { data } = await api.get("/admin/sections");
            return data.data ?? [];
        },
        staleTime: 30_000,
    });

    // Filter only the 3 system sections
    const systemKeys: string[] = SYSTEM_SECTIONS.map((s) => s.key);
    const sectionMap = Object.fromEntries(
        allSections.filter((s) => systemKeys.includes(s.section_key)).map((s) => [s.section_key, s])
    );

    const openEdit = (def: typeof SYSTEM_SECTIONS[number], section: Section) => {
        setActiveDef(def);
        setActiveDraft({ ...section });
        setModalOpen(true);
    };

    const openCreate = (def: typeof SYSTEM_SECTIONS[number]) => {
        setActiveDef(def);
        setActiveDraft({
            section_key: def.key,
            title: def.defaultTitle,
            subtitle: def.defaultSubtitle,
            banner_image: null,
            valid_from: null,
            valid_until: null,
            cafe_ids: [],
            event_ids: [],
            item_ids: [],
            sort_order: def.sortOrder,
            is_active: false,
            status: "draft",
        });
        setModalOpen(true);
    };

    const handleSave = async (draft: SectionDraft) => {
        if (!draft.title) { toast.error("Title is required"); return; }
        setSaving(true);
        try {
            const isEdit = !!sectionMap[draft.section_key];
            if (isEdit) {
                const { section_key, status, is_active, ...payload } = draft;
                await api.patch(`/admin/sections/${section_key}`, payload);
                toast.success(`${draft.title} updated`);
            } else {
                await api.post("/admin/sections", draft);
                toast.success(`${draft.title} created as draft`);
            }
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            setModalOpen(false);
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
            toast.success("Submitted for approval");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit");
        } finally { setSubmittingKey(null); }
    };

    const handleApprove = async (s: Section) => {
        setApprovingKey(s.section_key);
        try {
            await api.post(`/admin/sections/${s.section_key}/approve`);
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            toast.success("🚀 Section is now live on the app!");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to approve");
        } finally { setApprovingKey(null); }
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
            toast.success("Section unpublished");
        } catch { toast.error("Failed to unpublish"); }
        finally { setTogglingKey(null); }
    };

    const handleDelete = async (key: string) => {
        setDeletingKey(key);
        try {
            await api.delete(`/admin/sections/${key}`);
            queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
            toast.success("Section deleted");
        } catch { toast.error("Failed to delete"); }
        finally { setDeletingKey(null); }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Home Screen Sections</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage the three core home screen sections. Same publish workflow as regular sections.
                    </p>
                </div>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {SYSTEM_SECTIONS.map((def) => {
                    const section = sectionMap[def.key];
                    return (
                        <SystemSectionCard
                            key={def.key}
                            def={def}
                            section={section}
                            onEdit={() => section && openEdit(def, section)}
                            onCreate={() => openCreate(def)}
                            onSubmit={() => section && handleSubmit(section)}
                            onApprove={() => section && handleApprove(section)}
                            onReject={() => section && handleReject(section)}
                            onUnpublish={() => section && handleUnpublish(section)}
                            onDelete={() => section && handleDelete(def.key)}
                            togglingKey={togglingKey}
                            deletingKey={deletingKey}
                            submittingKey={submittingKey}
                            approvingKey={approvingKey}
                            rejectingKey={rejectingKey}
                        />
                    );
                })}
            </div>

            {/* Edit / Create Modal */}
            {activeDraft && activeDef && (
                <EditModal
                    open={modalOpen}
                    draft={activeDraft}
                    pickerType={activeDef.pickerType}
                    sectionLabel={activeDef.label}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                    saving={saving}
                />
            )}
        </div>
    );
}
