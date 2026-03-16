"use client";

import { useState } from "react";
import Image from "next/image";
import api from "@/lib/api";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Package } from "lucide-react";

interface CafeItemsTableProps {
    cafeId: string;
}

export default function CafeItemsTable({ cafeId }: CafeItemsTableProps) {
    const queryClient = useQueryClient();
    const [pendingFlags, setPendingFlags] = useState<Record<string, boolean>>({});

    const { data: items = [], isLoading } = useQuery<any[]>({
        queryKey: ["cafe-items", cafeId],
        enabled: !!cafeId,
        queryFn: async () => {
            const res = await api.get(`/cafes/cafe/${cafeId}`);
            return res.data?.data ?? res.data ?? [];
        },
    });

    const flagMutation = useMutation({
        mutationFn: async ({ itemId, flag, value }: { itemId: string; flag: "recommended" | "is_redeemable"; value: boolean }) => {
            return api.patch(`/cafes/items/${itemId}/flags`, { [flag]: value });
        },
        onSuccess: (_, { itemId, flag }) => {
            const key = `${itemId}_${flag}`;
            setPendingFlags((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
            queryClient.invalidateQueries({ queryKey: ["cafe-items", cafeId] });
            toast.success("Item updated");
        },
        onError: (_, { itemId, flag }) => {
            const key = `${itemId}_${flag}`;
            setPendingFlags((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
            toast.error("Failed to update item");
        },
    });

    const handleToggle = (itemId: string, flag: "recommended" | "is_redeemable", currentValue: boolean) => {
        const key = `${itemId}_${flag}`;
        setPendingFlags((prev) => ({ ...prev, [key]: true }));
        flagMutation.mutate({ itemId, flag, value: !currentValue });
    };

    if (isLoading) return (
        <div className="px-6 md:px-10 py-6">
            <p className="text-sm text-muted-foreground">Loading items...</p>
        </div>
    );

    return (
        <div className="px-6 md:px-10 py-6 space-y-4">
            <Separator />
            <div className="flex items-center gap-2 pt-2">
                <Package className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Items Management</h2>
                <Badge variant="secondary">{items.length} items</Badge>
            </div>

            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No items found for this café.</p>
            ) : (
                <div className="divide-y divide-border rounded-lg border">
                    {items.map((item: any) => {
                        const isRedeemablePending = pendingFlags[`${item.item_id}_is_redeemable`];
                        const isRecommendedPending = pendingFlags[`${item.item_id}_recommended`];
                        return (
                            <div key={item.item_id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                                {/* Thumbnail */}
                                <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted">
                                    {item.cover_img ? (
                                        <Image
                                            src={item.cover_img}
                                            alt={item.item_name}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <Package className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{item.item_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-muted-foreground capitalize">{item.category ?? "—"}</span>
                                        {item.price && (
                                            <span className="text-xs text-muted-foreground">· ₹{item.price}</span>
                                        )}
                                        <Badge
                                            variant={item.availability === "available" ? "default" : "secondary"}
                                            className="text-xs h-4 px-1.5"
                                        >
                                            {item.availability ?? "available"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="flex items-center gap-6 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id={`redeemable-${item.item_id}`}
                                            checked={item.is_redeemable ?? false}
                                            disabled={isRedeemablePending}
                                            onCheckedChange={() => handleToggle(item.item_id, "is_redeemable", item.is_redeemable ?? false)}
                                        />
                                        <Label htmlFor={`redeemable-${item.item_id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                                            Redeemable
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id={`recommended-${item.item_id}`}
                                            checked={item.recommended ?? false}
                                            disabled={isRecommendedPending}
                                            onCheckedChange={() => handleToggle(item.item_id, "recommended", item.recommended ?? false)}
                                        />
                                        <Label htmlFor={`recommended-${item.item_id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                                            Krown Recommends
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
