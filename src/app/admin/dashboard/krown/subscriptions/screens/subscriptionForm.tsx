"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
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


async function uploadIcon(file: File, fileName: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("file_name", fileName);
    form.append("bucket", "krown-admin");

    const res = await api.post("/subscriptions/feature/icon-upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data.icon_url;
}

async function deleteIcon(fileName: string) {
    return api.post("/subscriptions/feature/icon-delete", {
        file_name: fileName,
    });
}

interface Cafe {
    cafe_id: string;
    cafe_name: string;
}

interface Feature {
    title?: string;
    description?: string;
    icon_url?: string;

    // rupee fields allowed but not used per-feature
    rupeecoin?: string;
    rupeecoinText?: string;
}

interface SubscriptionInput {
    subscription_id?: number;
    subscription_name: string;
    price: number;
    valid_days: number;
    free_drinks: number;
    redemption_limit_per_cafe: number;
    applies_to_all_cafes: boolean;
    cafe_ids: string[];
    is_subscription_available: boolean;

    // features[] also contains global rupee entry
    features: Feature[];
}


export default function SubscriptionForm({
    plan,
    onSuccess,
}: {
    plan?: SubscriptionInput | null;
    onSuccess: () => void;
}) {
    const queryClient = useQueryClient();


    const [name, setName] = useState(plan?.subscription_name || "");
    const [price, setPrice] = useState(String(plan?.price || ""));
    const [validDays, setValidDays] = useState(String(plan?.valid_days || 30));
    const [freeDrinks, setFreeDrinks] = useState(String(plan?.free_drinks || 0));
    const [redemptionLimit, setRedemptionLimit] = useState(
        String(plan?.redemption_limit_per_cafe || 1)
    );

    const [appliesAll, setAppliesAll] = useState(
        plan?.applies_to_all_cafes ?? true
    );
    const [selectedCafes, setSelectedCafes] = useState<string[]>(
        plan?.cafe_ids ?? []
    );

    const [isAvailable, setIsAvailable] = useState(
        plan?.is_subscription_available ?? true
    );

    // Filter out rupee entry if present
    const initialNormalFeatures = plan?.features?.filter(
        f => !f.rupeecoin && !f.rupeecoinText
    ) || [];

    const [features, setFeatures] = useState<Feature[]>(
        initialNormalFeatures.length
            ? initialNormalFeatures
            : [{ title: "", description: "", icon_url: "" }]
    );


    const rupeeEntry = plan?.features?.find(
        f => f.rupeecoin || f.rupeecoinText
    ) || null;

    const [rupeeIcon, setRupeeIcon] = useState<string>(
        rupeeEntry?.rupeecoin || ""
    );
    const [rupeeText, setRupeeText] = useState<string>(
        rupeeEntry?.rupeecoinText || ""
    );

    useEffect(() => {
        if (!plan) return;

        // Extract rupee entry
        const rupee = plan.features.find(
            f => f.rupeecoin || f.rupeecoinText
        );

        setRupeeIcon(rupee?.rupeecoin || "");
        setRupeeText(rupee?.rupeecoinText || "");

        // Set features without rupee entry
        setFeatures(
            plan.features.filter(f => !f.rupeecoin && !f.rupeecoinText)
        );

    }, [plan]);

    const { data: cafes = [] } = useQuery({
        queryKey: ["cafes-list"],
        queryFn: async () => {
            const res = await api.get("/admin/cafe_name/list");
            return res.data.data;
        },
    });


    const createOrUpdate = useMutation({
        mutationFn: async () => {
            // Remove previous rupee entries
            const cleanedFeatures = features.filter(
                f => !f.rupeecoin && !f.rupeecoinText
            );

            // Add latest rupee entry
            if (rupeeIcon || rupeeText) {
                cleanedFeatures.push({
                    rupeecoin: rupeeIcon,
                    rupeecoinText: rupeeText,
                });
            }

            const payload = {
                subscription_name: name,
                price: Number(price),
                valid_days: Number(validDays),
                free_drinks: Number(freeDrinks),
                redemption_limit_per_cafe: Number(redemptionLimit),
                features: cleanedFeatures,
                applies_to_all_cafes: appliesAll,
                cafe_ids: appliesAll ? [] : selectedCafes,
                is_subscription_available: isAvailable,
            };

            if (plan?.subscription_id) {
                return (
                    await api.put(`/subscriptions/${plan.subscription_id}`, payload)
                ).data;
            }
            return (await api.post("/subscriptions/add", payload)).data;
        },

        onSuccess: () => {
            toast.success(plan ? "Subscription updated" : "Subscription created");
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            onSuccess();
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || "Failed to save subscription"
            );
        },
    });
    const toggleCafeSelection = (id: string) => {
        setSelectedCafes((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const updateFeature = (
        index: number,
        key: keyof Feature,
        value: string
    ) => {
        setFeatures((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [key]: value };
            return updated;
        });
    };

    const addFeature = () => {
        setFeatures((prev) => [
            ...prev,
            { title: "", description: "", icon_url: "" },
        ]);
    };

    const removeFeature = (index: number) => {
        setFeatures((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadRupeeIconHandler = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.click();

        input.onchange = async () => {
            if (!input.files?.length) return;
            const file = input.files[0];
            const ext = file.name.split(".").pop();
            const fileName = `rupeecoin_${Date.now()}.${ext}`;

            try {
                toast.loading("Uploading rupee icon...");
                const url = await uploadIcon(file, fileName);
                toast.dismiss();
                setRupeeIcon(url);
                toast.success("Rupee icon uploaded");
            } catch {
                toast.dismiss();
                toast.error("Upload failed");
            }
        };
    };

    const deleteRupeeIconHandler = async () => {
        if (!rupeeIcon) return;

        const fileName = rupeeIcon.split("/").pop();
        try {
            toast.loading("Deleting rupee icon...");
            await deleteIcon(fileName!);
            toast.dismiss();
            setRupeeIcon("");
            toast.success("Rupee icon deleted");
        } catch {
            toast.dismiss();
            toast.error("Delete failed");
        }
    };


    return (
        <Card className="shadow-xl border border-border">
            <CardHeader>
                <CardTitle>
                    {plan ? "Edit Subscription Plan" : "Create Subscription Plan"}
                </CardTitle>
                <CardDescription>
                    {plan ? "Update plan details." : "Add pricing, validity, and perks."}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* BASIC INFO */}
                <div>
                    <Label>Plan Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Price (₹)</Label>
                        <Input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Validity (Days)</Label>
                        <Input
                            type="number"
                            value={validDays}
                            onChange={(e) => setValidDays(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Free Drinks</Label>
                        <Input
                            type="number"
                            value={freeDrinks}
                            onChange={(e) => setFreeDrinks(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Redemptions per Café</Label>
                        <Input
                            type="number"
                            value={redemptionLimit}
                            onChange={(e) => setRedemptionLimit(e.target.value)}
                        />
                    </div>
                </div>

                {/* TOGGLES */}
                <div className="flex items-center justify-between border p-3 rounded-lg">
                    <Label>Show to Users</Label>
                    <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
                </div>

                <div className="flex items-center justify-between border p-3 rounded-lg">
                    <Label>Apply to All Cafés</Label>
                    <Switch checked={appliesAll} onCheckedChange={setAppliesAll} />
                </div>

                {/* CAFES */}
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

                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedCafes.map((id) => {
                                const cafe = cafes.find((c: Cafe) => c.cafe_id === id);
                                return <Badge key={id}>{cafe?.cafe_name}</Badge>;
                            })}
                        </div>
                    </div>
                )}

                {/* GLOBAL RUPEE COIN */}
                <div className="border rounded-lg p-3 space-y-3">
                    <Label>Rupee Coin (Global)</Label>
                    <p className="text-xs text-muted-foreground">
                        This rupee coin applies globally (not per feature).
                    </p>

                    <div className="flex items-center justify-between border rounded-md p-3">
                        <div className="flex items-center gap-3">
                            {rupeeIcon ? (
                                <img
                                    src={rupeeIcon}
                                    className="w-10 h-10 rounded object-contain border"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-muted flex items-center justify-center rounded text-xs">
                                    No Icon
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={uploadRupeeIconHandler}
                            >
                                {rupeeIcon ? "Replace" : "Upload"}
                            </Button>

                            {rupeeIcon && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={deleteRupeeIconHandler}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>

                    <Input
                        placeholder="Rupee Coin Text"
                        value={rupeeText}
                        onChange={(e) => setRupeeText(e.target.value)}
                    />
                </div>

                {/* FEATURES */}
                <div>
                    <Label>Subscription Features</Label>

                    <div className="space-y-3 mt-2">
                        {features.map((f, i) => (
                            <div key={i} className="border rounded-lg p-3 space-y-3">
                                {/* TITLE + DELETE */}
                                <div className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Feature Title"
                                        value={f.title}
                                        onChange={(e) =>
                                            updateFeature(i, "title", e.target.value)
                                        }
                                    />

                                    {features.length > 1 && (
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => removeFeature(i)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* DESCRIPTION */}
                                <Input
                                    placeholder="Feature Description"
                                    value={f.description}
                                    onChange={(e) =>
                                        updateFeature(i, "description", e.target.value)
                                    }
                                />

                                {/* ICON */}
                                <div className="flex items-center justify-between border rounded-md p-3">
                                    <div className="flex items-center gap-3">
                                        {f.icon_url ? (
                                            <img
                                                src={f.icon_url}
                                                className="w-10 h-10 rounded object-contain border"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs">
                                                No Icon
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const input = document.createElement("input");
                                                input.type = "file";
                                                input.accept = "image/*";
                                                input.click();

                                                input.onchange = async () => {
                                                    if (!input.files?.length) return;
                                                    const file = input.files[0];
                                                    const ext = file.name.split(".").pop();
                                                    const fileName = `feature_${i}_${Date.now()}.${ext}`;

                                                    try {
                                                        toast.loading("Uploading...");
                                                        const url = await uploadIcon(file, fileName);
                                                        toast.dismiss();
                                                        updateFeature(i, "icon_url", url);
                                                        toast.success("Icon uploaded");
                                                    } catch {
                                                        toast.dismiss();
                                                        toast.error("Upload failed");
                                                    }
                                                };
                                            }}
                                        >
                                            Upload
                                        </Button>
                                        {f.icon_url && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={async () => {
                                                    const fileName =
                                                        f.icon_url?.split("/").pop();
                                                    try {
                                                        toast.loading("Deleting...");
                                                        await deleteIcon(fileName!);
                                                        toast.dismiss();
                                                        updateFeature(i, "icon_url", "");
                                                        toast.success("Icon deleted");
                                                    } catch {
                                                        toast.dismiss();
                                                        toast.error("Delete failed");
                                                    }
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button variant="outline" size="sm" onClick={addFeature}>
                            <Plus className="w-4 h-4 mr-1" /> Add Feature
                        </Button>
                    </div>
                </div>

                {/* SUBMIT */}
                <Button
                    className="w-full"
                    disabled={createOrUpdate.isPending}
                    onClick={() => createOrUpdate.mutate()}
                >
                    {createOrUpdate.isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Saving...
                        </>
                    ) : plan ? (
                        "Update Plan"
                    ) : (
                        "Create Plan"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
