"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Store, Crown, BarChart, Settings, MoreVertical, LogOut, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api";
import { clearToken } from "@/lib/auth";

export function AdminSidebarMinimal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { admin } = useAdmin();
    const router = useRouter();
    const collapsed = !open;

    const [cafesOpen, setCafesOpen] = useState(false);
    const [krownOpen, setKrownOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await api.post("/admin/logout");
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            clearToken();
            router.replace("/admin/login");
        }
    };

    return (
        <aside className={(collapsed ? "w-[64px]" : "w-[220px]") + " h-screen border-r flex flex-col"}>
            <div className="flex h-14 items-center justify-between px-3 border-b">
                <div className="flex items-center gap-2">
                    <Crown className="size-5" />
                    {!collapsed && <span className="font-medium">Krown</span>}
                </div>
                {!collapsed && (
                    <button onClick={onClose} className="text-sm rounded-md px-2 py-1 border">
                        Hide
                    </button>
                )}
            </div>

            <nav className="p-2 flex-1 space-y-1">
                <Link href="/admin/dashboard" className="flex items-center gap-3 px-2 py-2 hover:bg-muted">
                    <Home className="size-4" />
                    {!collapsed && <span>Home</span>}
                </Link>

                {/* Cafes Inline Expand */}
                <button
                    onClick={() => setCafesOpen(!cafesOpen)}
                    className="flex items-center gap-3 px-2 py-2 hover:bg-muted w-full text-left"
                >
                    <Store className="size-4" />
                    {!collapsed && <span>Cafes</span>}
                    {!collapsed && (
                        <ChevronDown
                            className={`ml-auto size-4 transform transition-transform ${cafesOpen ? "rotate-180" : ""}`}
                        />
                    )}
                </button>

                <AnimatePresence>
                    {!collapsed && cafesOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <Link href="/admin/dashboard/cafes" className="block pl-8 py-1 text-sm hover:underline">All Cafes</Link>
                            <Link href="/admin/dashboard/cafes/create/cafe" className="block pl-8 py-1 text-sm hover:underline">Create Cafe</Link>
                            <Link href="/admin/dashboard/cafes/create/users" className="block pl-8 py-1 text-sm hover:underline">Create Cafe Users</Link>
                            <Link href="/admin/dashboard/cafes/update/" className="block pl-8 py-1 text-sm hover:underline">Update Cafe Users</Link>


                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Krown Inline Expand */}
                <button
                    onClick={() => setKrownOpen(!krownOpen)}
                    className="flex items-center gap-3 px-2 py-2 hover:bg-muted w-full text-left"
                >
                    <Crown className="size-4" />
                    {!collapsed && <span>Krown</span>}
                    {!collapsed && (
                        <ChevronDown
                            className={`ml-auto size-4 transform transition-transform ${krownOpen ? "rotate-180" : ""}`}
                        />
                    )}
                </button>

                <AnimatePresence>
                    {!collapsed && krownOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <Link href="#" className="block pl-8 py-1 text-sm hover:underline">Banners</Link>
                            <Link href="#" className="block pl-8 py-1 text-sm hover:underline">Rewards</Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Link href="/admin/dashboard/analytics" className="flex items-center gap-3 px-2 py-2 hover:bg-muted">
                    <BarChart className="size-4" />
                    {!collapsed && <span>Analytics</span>}
                </Link>

                <Link href="/admin/dashboard/settings" className="flex items-center gap-3 px-2 py-2 hover:bg-muted">
                    <Settings className="size-4" />
                    {!collapsed && <span>Settings</span>}
                </Link>
            </nav>

            <div className="p-3 border-t">
                <button className={"flex items-center w-full gap-2 px-2 py-2 hover:bg-muted " + (collapsed ? "justify-center" : "")}>
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{admin?.name?.charAt(0)?.toUpperCase() || "A"}</AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="grid text-left text-sm">
                            <span className="truncate font-medium">{admin?.name || "Unknown"}</span>
                            <span className="text-xs">{admin?.role === "master_admin" ? "Master Admin" : "Admin"}</span>
                            <span className="text-xs text-muted-foreground">{admin?.phone}</span>
                        </div>
                    )}
                    {!collapsed && <MoreVertical className="ml-auto size-4" />}
                </button>
                {!collapsed && (
                    <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-2 px-2 py-2 hover:bg-muted text-sm">
                        <LogOut className="size-4" /> Logout
                    </button>
                )}
            </div>
        </aside>
    );
}
