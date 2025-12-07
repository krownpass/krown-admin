"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";


interface Feature {
    title?: string;
    description?: string;
    icon_url?: string;
    rupeecoin?: string;
    rupeecoinText?: string;
}

interface Subscription {
    subscription_id: number;
    price: number;
    subscription_name: string;
    features: Feature[];
    valid_days: number;
    free_drinks: number;
    redemption_limit_per_cafe: number;
    applies_to_all_cafes: boolean;
    rupeecoin?: string;
    rupeecoinText?: string;
}

export default function SubscriptionList({
    onEdit,
}: {
    onEdit: (plan: Subscription) => void;
}) {
    const queryClient = useQueryClient();


    const { data = [], isLoading } = useQuery<Subscription[]>({
        queryKey: ["subscriptions"],
        queryFn: async () => {
            const res = await api.get("/subscriptions/all");

            const subs = res.data?.subscriptions ?? res.data?.data ?? [];

            return subs.map((s: Subscription) => {
                const rupee = s.features.find((f) => f.rupeecoin);

                const normalFeatures = s.features.filter(
                    (f) => !f.rupeecoin && !f.rupeecoinText
                );

                return {
                    ...s,
                    features: normalFeatures,
                    rupeecoin: rupee?.rupeecoin,
                    rupeecoinText: rupee?.rupeecoinText,
                };
            });
        },
    });


    const deletePlan = useMutation({
        mutationFn: async (id: number) => {
            const res = await api.delete(`/subscriptions/${id}`);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Subscription deleted");
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to delete plan");
        },
    });


    if (isLoading)
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
            </div>
        );

    if (data.length === 0)
        return (
            <p className="text-center text-muted-foreground py-8">
                No subscription plans found.
            </p>
        );


    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((plan) => (
                <Card
                    key={plan.subscription_id}
                    className="relative flex flex-col justify-between min-h-[260px] shadow-md border hover:shadow-lg transition-all"
                >
                    {/* ACTION BUTTONS */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full"
                            onClick={() => onEdit(plan)}
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-8 w-8 rounded-full"
                                    disabled={deletePlan.isPending}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete &quot;
                                        {plan.subscription_name}&quot;?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                                    <AlertDialogAction
                                        onClick={() =>
                                            deletePlan.mutate(plan.subscription_id)
                                        }
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    {/* HEADER */}
                    <CardHeader className="pb-2 pr-10">
                        <CardTitle className="flex justify-between items-center">
                            <span className="truncate font-semibold text-lg">
                                {plan.subscription_name}
                            </span>

                            <span className="text-primary font-bold text-base whitespace-nowrap ml-2">
                                ₹{plan.price}
                            </span>
                        </CardTitle>

                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            Valid {plan.valid_days} days • {plan.free_drinks} free
                            drinks • {plan.redemption_limit_per_cafe} redemption(s)/café
                        </CardDescription>

                        {/* GLOBAL RUPEE COIN */}
                        {plan.rupeecoin && (
                            <div className="flex items-center gap-2 mt-2">
                                <img
                                    src={plan.rupeecoin}
                                    alt="rupee coin"
                                    className="w-5 h-5 object-contain"
                                />
                                <span className="text-xs font-medium">
                                    {plan.rupeecoinText}
                                </span>
                            </div>
                        )}
                    </CardHeader>

                    {/* FEATURES */}
                    <CardContent className="flex-1">
                        <div className="space-y-2 mt-2">
                            {plan.features?.map((f, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 border rounded-md p-2 bg-muted/30"
                                >
                                    {/* ICON */}
                                    {f.icon_url ? (
                                        <img
                                            src={f.icon_url}
                                            alt="feature icon"
                                            className="w-8 h-8 rounded object-contain border"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground">
                                            No Icon
                                        </div>
                                    )}

                                    {/* TEXT */}
                                    <div>
                                        <p className="text-sm font-semibold">{f.title}</p>
                                        <p className="text-xs text-muted-foreground leading-snug">
                                            {f.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 text-xs text-right text-muted-foreground italic">
                            {plan.applies_to_all_cafes
                                ? "All Cafes"
                                : "Specific Cafes Only"}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
