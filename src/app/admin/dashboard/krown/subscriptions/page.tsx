
"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Coffee } from "lucide-react";
import SubscriptionList from "./screens/SubscriptionList";
import SubscriptionForm from "./screens/subscriptionForm";

export default function SubscriptionPlansPage() {
    const [tab, setTab] = useState("view");
    const [editPlan, setEditPlan] = useState<any | null>(null);

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold tracking-tight">
                    Subscription Plans
                </h1>
                <Coffee className="text-amber-500" />
            </div>

            <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="view">View All</TabsTrigger>
                    <TabsTrigger value="create">Create / Edit</TabsTrigger>
                </TabsList>

                <TabsContent value="view">
                    <SubscriptionList
                        onEdit={(plan) => {
                            setEditPlan(plan);
                            setTab("create");
                        }}
                    />
                </TabsContent>

                <TabsContent value="create">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-2xl"
                    >
                        <SubscriptionForm
                            plan={editPlan}
                            onSuccess={() => {
                                setEditPlan(null);
                                setTab("view");
                            }}
                        />
                    </motion.div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
