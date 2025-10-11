"use client";

import { useAdmin } from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Store, Crown, BarChart, Settings, MoreVertical, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { clearToken } from "@/lib/auth";

const NAV_ITEMS = [
    { icon: Home, label: "Home", href: "/admin" },
    { icon: Store, label: "Cafes", href: "/admin/cafes" },
    { icon: Crown, label: "Krown", href: "/admin/krown" },
    { icon: BarChart, label: "Analytics", href: "/admin/analytics" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export function AdminSidebarMinimal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { admin } = useAdmin();
    const router = useRouter();
    const collapsed = !open;

    const handleLogout = async () => {
        try {
            // For Bearer token, no withCredentials needed
            await api.post("/admin/logout");
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            clearToken(); // Remove token from localStorage
            router.replace("/admin/login"); // Redirect after logout
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
                {NAV_ITEMS.map((item) => (
                    <Link key={item.href} href={item.href} className="flex items-center gap-3 px-2 py-2 hover:bg-muted">
                        <item.icon className="size-4" />
                        {!collapsed && <span>{item.label}</span>}
                    </Link>
                ))}
            </nav>

            <div className="p-3 border-t">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
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
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}
