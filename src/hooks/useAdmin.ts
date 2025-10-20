"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";

type Admin = {
    admin_id: string;
    name: string;
    phone: string;
    role: "admin" | "master_admin";
};

export function useAdmin() {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setAdmin(null);
            setLoading(false);
            return;
        }

        api.get("/admin/me")
            .then((res) => {
                console.log("/admin/me Response:", res.data);
                setAdmin(res.data?.data ?? null);  // FIXED
            })
            .catch((err) => {
                console.error(" Admin Fetch Error:", err);
                setAdmin(null);
            })
            .finally(() => setLoading(false));
    }, []);

    return { admin, loading, setAdmin };
}