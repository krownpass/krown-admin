"use client"

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    X,
    Eye,
    Clock,
    RefreshCcw,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogHeader,
    DialogTitle,
    DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

/* ---------------- TYPES ---------------- */

type Platform = {
    platform: "youtube" | "instagram" | "facebook" | "twitter" | "other";
    link: string;
    followers: number;
};

type ApplicationStatus = "pending" | "approved" | "rejected";

type InfluencerApplication = {
    application_id: string;
    full_name: string;
    email: string;
    phone: string | null;
    platforms: Platform[];
    status: ApplicationStatus;
    admin_note: string | null;
    user_id: string | null;
};

type SubscriptionPlan = {
    subscription_id: number;
    subscription_name: string;
    price: string;
    valid_days: number;
};

/* ---------------- PAGE ---------------- */

export default function InfluencerAdminPage() {
    const qc = useQueryClient();

    const [status, setStatus] =
        useState<"all" | ApplicationStatus>("pending");
    const [sort, setSort] = useState<"newest" | "oldest">("newest");
    const [selected, setSelected] =
        useState<InfluencerApplication | null>(null);
    const [adminNote, setAdminNote] = useState("");
    const [planId, setPlanId] = useState<number | null>(null);

    /* ---------------- FETCH APPLICATIONS ---------------- */

    const { data: applications, isLoading } =
        useQuery<InfluencerApplication[]>({
            queryKey: ["applications", status, sort],
            queryFn: async () => {
                const res = await api.get("/influencers/applications", {
                    params: {
                        status: status === "all" ? undefined : status,
                        sort,
                    },
                });
                return res.data.data;
            },
        });

    /* ---------------- FETCH PLANS ---------------- */

    const { data: plans } = useQuery<SubscriptionPlan[]>({
        queryKey: ["subscription-plans"],
        queryFn: async () => {
            const res = await api.get("/subscriptions/all");
            return res.data.data
        },
    });
    /* ---------------- MUTATIONS ---------------- */

    const approve = useMutation({
        mutationFn: () =>
            api.post(
                `/influencers/application/${selected?.application_id}/approve`,
                {
                    admin_note: adminNote,
                    plan_id: planId,
                }
            ),
        onSuccess: () => {
            toast.success("Influencer approved 🎉");
            qc.invalidateQueries({ queryKey: ["applications"] });
            closeModal();
        },
    });

    const reject = useMutation({
        mutationFn: () =>
            api.post(
                `/influencers/application/${selected?.application_id}/reject`,
                { admin_note: adminNote }
            ),
        onSuccess: () => {
            toast.success("Application rejected");
            qc.invalidateQueries({ queryKey: ["applications"] });
            closeModal();
        },
    });

    const expire = useMutation({
        mutationFn: (userId: string) =>
            api.post(`/influencers/subscription/${userId}/expire`),
        onSuccess: () => {
            toast.success("Subscription expired");
            qc.invalidateQueries({ queryKey: ["applications"] });
        },
    });

    const renew = useMutation({
        mutationFn: (payload: { userId: string; planId: number }) =>
            api.post(`/influencers/subscription/${payload.userId}/renew`, {
                plan_id: payload.planId,
            }),
        onSuccess: () => {
            toast.success("Subscription renewed");
            qc.invalidateQueries({ queryKey: ["applications"] });
        },
    });

    const closeModal = () => {
        setSelected(null);
        setAdminNote("");
        setPlanId(null);
    };

    /* ---------------- UI ---------------- */

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin w-6 h-6" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">
                Influencer Applications
            </h1>

            {/* FILTERS */}
            <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
                <TabsList>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                    {applications?.map((app) => (
                        <motion.div key={app.application_id}>
                            <Card>
                                <CardHeader>
                                    <h3 className="font-semibold">
                                        {app.full_name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {app.email}
                                    </p>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <Badge>{app.status}</Badge>
                                    <Separator />

                                    <Button
                                        variant="outline"
                                        onClick={() => setSelected(app)}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Review
                                    </Button>

                                    {app.status === "approved" && app.user_id && plans?.length && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="flex items-center gap-2"
                                                onClick={() => expire.mutate(app.user_id!)}
                                            >
                                                <Clock className="w-4 h-4" />
                                                <span>Expire</span>
                                            </Button>

                                            <Button
                                                variant="outline"
                                                className="flex items-center gap-2"
                                                onClick={() =>
                                                    renew.mutate({
                                                        userId: app.user_id!,
                                                        planId: plans[0].subscription_id,
                                                    })
                                                }
                                            >
                                                <RefreshCcw className="w-4 h-4" />
                                                <span>Renew</span>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* REVIEW MODAL */}
            <Dialog open={!!selected} onOpenChange={closeModal}>
                <DialogContent className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>
                            Review Application
                        </DialogTitle>
                    </DialogHeader>

                    {selected?.status === "pending" && (
                        <>
                            {/* PLAN SELECT */}
                            <Select
                                onValueChange={(v) =>
                                    setPlanId(Number(v))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select influencer plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans?.map((plan) => (
                                        <SelectItem
                                            key={plan.subscription_id}
                                            value={String(
                                                plan.subscription_id
                                            )}
                                        >
                                            {plan.subscription_name} · ₹
                                            {plan.price} ·{" "}
                                            {plan.valid_days} days
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* ADMIN NOTE */}
                            <Textarea
                                placeholder="Admin note (optional)"
                                value={adminNote}
                                onChange={(e) =>
                                    setAdminNote(e.target.value)
                                }
                            />

                            {/* ACTIONS */}
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="destructive"
                                    onClick={() => reject.mutate()}
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Reject
                                </Button>
                                <Button
                                    disabled={!planId}
                                    onClick={() => approve.mutate()}
                                >
                                    <Check className="w-4 h-4 mr-1" />
                                    Approve
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
