
"use client";

import { useState } from "react";
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

interface Subscription {
    subscription_id: number;
    price: number;
    subscription_name: string;
    subscription_desc: string[];
    valid_days: number;
    free_drinks: number;
    redemption_limit_per_cafe: number;
    applies_to_all_cafes: boolean;
}

export default function SubscriptionList({
    onEdit,
}: {
    onEdit: (plan: Subscription) => void;
}) {
    const queryClient = useQueryClient();

    // Fetch all subscriptions
    const { data = [], isLoading } = useQuery<Subscription[]>({
        queryKey: ["subscriptions"],
        queryFn: async () => {
            const res = await api.get("/subscriptions/all");
            return res.data?.subscriptions ?? res.data?.data ?? [];
        },
    });

    // Delete mutation
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
                    className="relative flex flex-col justify-between min-h-[250px] shadow-md border hover:shadow-lg transition-all"
                >
                    {/* ----- Action Buttons ----- */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full border border-border bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-all"
                            onClick={() => onEdit(plan)}
                        >
                            <Pencil className="w-4 h-4" strokeWidth={1.8} />
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-8 w-8 rounded-full flex items-center justify-center transition-all hover:bg-red-600"
                                    disabled={deletePlan.isPending}
                                >
                                    <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete “{plan.subscription_name}”?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => deletePlan.mutate(plan.subscription_id)}
                                        className="bg-destructive text-white hover:bg-red-600"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    {/* ----- Card Header ----- */}
                    <CardHeader className="pb-2 pr-10 p-6">
                        <CardTitle className="flex justify-between items-center">
                            <span className="truncate font-semibold text-lg">
                                {plan.subscription_name}
                            </span>
                            <span className="text-primary font-bold text-base whitespace-nowrap ml-2">
                                ₹{plan.price}
                            </span>
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            Valid {plan.valid_days} days • {plan.free_drinks} free drinks •{" "}
                            {plan.redemption_limit_per_cafe} redemption(s)/café
                        </CardDescription>
                    </CardHeader>

                    {/* ----- Card Body ----- */}
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                            {plan.subscription_desc.map((d, i) => (
                                <li key={i} className="leading-snug">
                                    {d}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-3 text-xs text-right text-muted-foreground italic">
                            {plan.applies_to_all_cafes ? "All Cafes" : "Specific Cafes Only"}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
