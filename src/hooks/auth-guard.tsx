"use client";

import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { admin, loading } = useAdmin();

    useEffect(() => {
        if (!loading && !admin) {
            router.replace("/admin/login"); // redirect to login if not authenticated
        }
    }, [loading, admin, router]);

    if (loading) {
        return (
            <div className= "flex items-center justify-center h-screen" >
            <p className="text-sm text-muted-foreground" > Checking session...</p>
                </div>
    );
    }

    if (!admin) {
        return null; // Prevent rendering protected page content during redirect
    }

    return <>{ children } </>;
}
