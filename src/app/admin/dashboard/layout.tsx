
"use client";
import { AdminContent } from "@/app/components/layout/AdminContent";
import { AdminHeader } from "@/app/components/layout/AdminHeader";
import { AdminSidebar } from "@/app/components/layout/sidebars";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
      const router = useRouter();

      React.useEffect(() => {
    const token = localStorage.getItem("krown_admin_token");
    if (!token) {
      router.push("/admin/login");
    }
  }, []);
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    const [mode, setMode] = React.useState<"hover" | "click">("hover");

    return (
        <div className="flex h-dvh w-full bg-background text-foreground">
            <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="border-b bg-background/70 backdrop-blur">
                    <div className="flex items-center justify-between px-4">
                        <AdminHeader
                            title="Krown Dashboard"
                            onToggleSidebar={() => setSidebarOpen((v) => !v)}
                            right={
                                <div className="hidden md:flex items-center gap-2">
                                    <label className="text-sm text-muted-foreground">Mode:</label>
                                    <select
                                        value={mode}
                                        onChange={(e) => setMode(e.target.value as any)}
                                        className="rounded-md border bg-background px-2 py-1 text-sm"
                                    >
                                        <option value="hover">Hover expand</option>
                                        <option value="click">Click toggle</option>
                                    </select>
                                </div>
                            }
                        />
                    </div>
                </div>
                <AdminContent>{children}</AdminContent>
            </div>
        </div>
    );
}

