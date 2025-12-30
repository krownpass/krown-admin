"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface User {
    user_id: string;
    user_name: string;
    user_mobile_no: string;
}

export default function GenerateGiftCodesModal({
    planId,
    open,
    onClose,
}: {
    planId: number;
    open: boolean;
    onClose: () => void;
}) {
    const [count, setCount] = useState(1);
    const [query, setQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLifetime, setIsLifetime] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    /* ---------------- USERS ---------------- */

    const { data: topUsers = [], isLoading: topLoading } = useQuery<User[]>({
        queryKey: ["top-users"],
        queryFn: async () => {
            const res = await api.get("/subscriptions/users/top");
            return res.data.data;
        },
        enabled: open && showDropdown && !selectedUser && query.length < 2,
    });

    const {
        data: searchResults = [],
        isFetching: searchLoading,
    } = useQuery<User[]>({
        queryKey: ["user-search", query],
        queryFn: async () => {
            const res = await api.get("/subscriptions/users/search", {
                params: { q: query },
            });
            return res.data.data;
        },
        enabled: open && showDropdown && !selectedUser && query.length >= 2,
    });

    const usersToShow =
        query.length >= 2 ? searchResults : topUsers;

    /* ---------------- GENERATE ---------------- */

    const generate = async () => {
        try {
            setLoading(true);

            const res = await api.post(
                "/subscriptions/gift/admin-generate",
                {
                    plan_id: planId,
                    count,
                    assigned_to_user: selectedUser?.user_id || null,
                    is_lifetime: isLifetime,
                }
            );

            toast.success(`${res.data.codes.length} codes generated`);
            onClose();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed");
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- RENDER ---------------- */

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="
                    space-y-6
                    max-w-2xl
                    w-full
                    max-h-[85vh]
                    overflow-y-auto
                "
            >
                <DialogHeader>
                    <DialogTitle>Generate Gift Codes</DialogTitle>
                </DialogHeader>

                {/* COUNT */}
                <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    placeholder="Number of codes (max 1000)"
                />

                {/* ASSIGN USER */}
                <div className="relative space-y-2">
                    <div className="relative">
                        <Input
                            placeholder="Assign to a single user (optional)"
                            value={
                                selectedUser
                                    ? `${selectedUser.user_name} (${selectedUser.user_mobile_no})`
                                    : query
                            }
                            readOnly={!!selectedUser}
                            onClick={() => setShowDropdown(true)}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setShowDropdown(true);
                            }}
                        />

                        {/* ❌ CLEAR */}
                        {(query || selectedUser) && (
                            <X
                                className="absolute right-2 top-2.5 w-4 h-4 cursor-pointer text-muted-foreground"
                                onClick={() => {
                                    setQuery("");
                                    setSelectedUser(null);
                                    setShowDropdown(false);
                                }}
                            />
                        )}
                    </div>

                    {/* DROPDOWN */}
                    {showDropdown && !selectedUser && (
                        <div className="absolute z-50 w-full bg-background border rounded-md shadow-md max-h-48 overflow-y-auto">
                            {(topLoading || searchLoading) && (
                                <div className="flex justify-center py-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                            )}

                            {!topLoading &&
                                !searchLoading &&
                                usersToShow.length === 0 && (
                                    <p className="text-xs text-muted-foreground px-3 py-2">
                                        No users found
                                    </p>
                                )}

                            {usersToShow.map((user) => (
                                <button
                                    key={user.user_id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setQuery("");
                                        setShowDropdown(false);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-muted"
                                >
                                    <div className="text-sm font-medium">
                                        {user.user_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {user.user_mobile_no}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        All generated codes will be assigned to this user
                    </p>
                </div>

                {/* LIFETIME */}
                <div className="flex items-center justify-between">
                    <span>Lifetime</span>
                    <Switch
                        checked={isLifetime}
                        onCheckedChange={setIsLifetime}
                    />
                </div>

                {/* SUBMIT */}
                <Button
                    onClick={generate}
                    disabled={loading || count < 1}
                >
                    {loading ? "Generating..." : "Generate Codes"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
