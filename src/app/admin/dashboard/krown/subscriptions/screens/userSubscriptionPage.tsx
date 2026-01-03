
"use client";

import { useUserPlans } from "@/hooks/userUserPlan";


export default function UserSubscriptionsPage() {
    const { data = [], isLoading } = useUserPlans();

    if (isLoading) return <p>Loading...</p>;

    return (
        <div className="grid md:grid-cols-3 gap-6">
            {data.map((p: any) => (
                <div
                    key={p.subscription_id}
                    className="border p-4 rounded"
                >
                    <h3 className="font-semibold">
                        {p.subscription_name}
                    </h3>
                    <p>₹{p.price}</p>
                    <p>{p.valid_days} days</p>
                    <p className="text-xs mt-2">
                        {p.cafe_names || "All Cafes"}
                    </p>
                </div>
            ))}
        </div>
    );
}
