"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface Cafe {
    cafe_id: string;
    cafe_name: string;
}

interface SubscriptionInput {
    subscription_id?: number;
    subscription_name: string;
    price: number;
    subscription_desc: string[];
    valid_days: number;
    free_drinks: number;
    redemption_limit_per_cafe: number;
    applies_to_all_cafes: boolean;
    cafe_ids: string[];
    is_subscription_available: boolean;
}

export default function SubscriptionForm({ plan, onSuccess }: {
    plan?: SubscriptionInput | null;
    onSuccess: () => void;
}) {
    const queryClient = useQueryClient();

    // ✨ NEW UI STATES
    const [appliesAll, setAppliesAll] = useState(plan?.applies_to_all_cafes ?? true);
    const [selectedCafes, setSelectedCafes] = useState<string[]>(plan?.cafe_ids ?? []);
    const [isAvailable, setIsAvailable] = useState(plan?.is_subscription_available ?? true);

    // Load all cafes
    const { data: cafes = [] } = useQuery({
        queryKey: ["cafes-list"],
        queryFn: async () => {
            const res = await api.get("/admin/cafe_name/list");
            return res.data.data;
        }
    });

    // OLD STATES
    const [name, setName] = useState(plan?.subscription_name || "");
    const [price, setPrice] = useState(String(plan?.price || ""));
    const [validDays, setValidDays] = useState(String(plan?.valid_days || 30));
    const [freeDrinks, setFreeDrinks] = useState(String(plan?.free_drinks || 0));
    const [redemptionLimit, setRedemptionLimit] =
        useState(String(plan?.redemption_limit_per_cafe || 1));
    const [desc, setDesc] = useState<string[]>(plan?.subscription_desc || [""]);

    useEffect(() => {
        if (plan) {
            setAppliesAll(plan.applies_to_all_cafes);
            setSelectedCafes(plan.cafe_ids || []);
            setIsAvailable(plan.is_subscription_available);
        }
    }, [plan]);


    /* ------------------------------------------------------- */
    /* 🔥 CREATE/UPDATE MUTATION                               */
    /* ------------------------------------------------------- */

    const createOrUpdate = useMutation({
        mutationFn: async () => {
            const payload = {
                subscription_name: name,
                price: Number(price),
                valid_days: Number(validDays),
                free_drinks: Number(freeDrinks),
                redemption_limit_per_cafe: Number(redemptionLimit),
                subscription_desc: desc,
                applies_to_all_cafes: appliesAll,
                cafe_ids: appliesAll ? [] : selectedCafes,
                is_subscription_available: isAvailable,
            };

            if (plan?.subscription_id) {
                return (await api.put(`/subscriptions/${plan.subscription_id}`, payload)).data;
            }
            return (await api.post("/subscriptions/add", payload)).data;
        },
        onSuccess: () => {
            toast.success(plan ? "Subscription updated" : "Subscription created");
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            onSuccess();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to save subscription");
        }
    });



    /* ------------------------------------------------------- */
    /* UI HANDLERS                                             */
    /* ------------------------------------------------------- */

    const toggleCafeSelection = (id: string) => {
        setSelectedCafes((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    /* ------------------------------------------------------- */
    /*  UI COMPONENT                                            */
    /* ------------------------------------------------------- */

    return (
        <Card className="shadow-xl border border-border">
            <CardHeader>
                <CardTitle>{plan ? "Edit Subscription Plan" : "Create Subscription Plan"}</CardTitle>
                <CardDescription>
                    {plan ? "Update plan details." : "Add pricing, validity, and perks."}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">

                {/* ---------------- BASIC FIELDS ---------------- */}
                <div>
                    <Label>Plan Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Price (₹)</Label>
                        <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                    </div>
                    <div>
                        <Label>Validity (Days)</Label>
                        <Input type="number" value={validDays} onChange={(e) => setValidDays(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Free Drinks</Label>
                        <Input type="number" value={freeDrinks} onChange={(e) => setFreeDrinks(e.target.value)} />
                    </div>
                    <div>
                        <Label>Redemptions per Café</Label>
                        <Input type="number" value={redemptionLimit} onChange={(e) => setRedemptionLimit(e.target.value)} />
                    </div>
                </div>

                {/* ---------------- TOGGLES ---------------- */}
                <div className="flex items-center justify-between border p-3 rounded-lg">
                    <Label className="font-medium">Show to Users</Label>
                    <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
                </div>

                <div className="flex items-center justify-between border p-3 rounded-lg">
                    <Label className="font-medium">Apply to All Cafés</Label>
                    <Switch checked={appliesAll} onCheckedChange={setAppliesAll} />
                </div>

                {/* ---------------- CAFÉ MULTI SELECT ---------------- */}
                {!appliesAll && (
                    <div>
                        <Label>Select Cafés</Label>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    {selectedCafes.length === 0
                                        ? "Choose Cafés"
                                        : `${selectedCafes.length} Selected`}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 max-h-64 overflow-y-auto">
                                <div className="space-y-2">
                                    {cafes.map((c: Cafe) => (
                                        <div key={c.cafe_id} className="flex items-center gap-2">
                                            <Checkbox
                                                checked={selectedCafes.includes(c.cafe_id)}
                                                onCheckedChange={() => toggleCafeSelection(c.cafe_id)}
                                            />
                                            <span>{c.cafe_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Selected café badges */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedCafes.map((id) => {
                                const cafe = cafes.find((c: Cafe) => c.cafe_id === id);
                                return (
                                    <Badge key={id} variant="secondary">
                                        {cafe?.cafe_name}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ---------------- DESC FEATURES LIST ---------------- */}
                <div>
                    <Label>Subscription Features</Label>
                    <div className="space-y-2">
                        {desc.map((d, i) => (
                            <div key={i} className="flex gap-2">
                                <Input
                                    value={d}
                                    onChange={(e) => {
                                        const updated = [...desc];
                                        updated[i] = e.target.value;
                                        setDesc(updated);
                                    }}
                                />
                                {desc.length > 1 && (
                                    <Button variant="destructive" size="icon" onClick={() =>
                                        setDesc(desc.filter((_, idx) => idx !== i))
                                    }>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => setDesc([...desc, ""])}>
                            <Plus className="w-4 h-4" /> Add Feature
                        </Button>
                    </div>
                </div>

                {/* ---------------- SUBMIT ---------------- */}
                <Button className="w-full" disabled={createOrUpdate.isPending}
                    onClick={() => createOrUpdate.mutate()}
                >
                    {createOrUpdate.isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Saving...
                        </>
                    ) : plan ? "Update Plan" : "Create Plan"}
                </Button>
            </CardContent>
        </Card>
    );
}
