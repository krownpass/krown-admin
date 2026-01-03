"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import api from "@/lib/api";

interface User {
    user_id: string;
    user_name: string;
    user_mobile_no: string;
}

export default function UserSearchDropdown({
    selectedUsers,
    onChange,
}: {
    selectedUsers: User[];
    onChange: (users: User[]) => void;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    /* ---------------- TOP USERS ---------------- */

    const { data: topUsers = [], isLoading: topLoading } = useQuery<User[]>({
        queryKey: ["top-users"],
        queryFn: async () => {
            const res = await api.get("/subscriptions/users/top");
            return res.data.data;
        },
        enabled: open && query.length < 2,
    });

    /* ---------------- SEARCH USERS ---------------- */

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
        enabled: open && query.length >= 2, // 👈 important
    });

    const usersToShow =
        query.length >= 2 ? searchResults : topUsers;

    /* ---------------- HELPERS ---------------- */

    const addUser = (user: User) => {
        if (selectedUsers.some((u) => u.user_id === user.user_id)) return;
        onChange([...selectedUsers, user]);
        setQuery("");
        setOpen(false);
    };

    const removeUser = (id: string) => {
        onChange(selectedUsers.filter((u) => u.user_id !== id));
    };

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setOpen(false);
        }
    };

    /* ---------------- RENDER ---------------- */

    return (
        <div
            ref={containerRef}
            onBlur={handleBlur}
            tabIndex={-1}
            className="relative space-y-2"
        >
            <Input
                placeholder="Search user by name or phone"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
            />

            {/* DROPDOWN */}
            {open && (
                <div className="absolute z-50 w-full bg-background border rounded-md shadow-md max-h-60 overflow-y-auto">
                    {/* LOADING */}
                    {(topLoading || searchLoading) && (
                        <div className="flex justify-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    )}

                    {/* EMPTY */}
                    {!topLoading &&
                        !searchLoading &&
                        usersToShow.length === 0 && (
                            <p className="text-xs text-muted-foreground px-3 py-2">
                                No users found
                            </p>
                        )}

                    {/* LABEL */}
                    {!searchLoading && usersToShow.length > 0 && (
                        <p className="px-3 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {query.length >= 2
                                ? "Search results"
                                : "Recent users"}
                        </p>
                    )}

                    {/* USERS */}
                    {usersToShow.map((user) => (
                        <button
                            key={user.user_id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()} // 👈 prevents blur
                            onClick={() => addUser(user)}
                            className="w-full text-left px-3 py-2 hover:bg-muted focus:bg-muted"
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

            {/* SELECTED USERS */}
            <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                    <Badge
                        key={user.user_id}
                        variant="secondary"
                        className="flex items-center gap-1"
                    >
                        {user.user_name} ({user.user_mobile_no})
                        <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => removeUser(user.user_id)}
                        />
                    </Badge>
                ))}
            </div>
        </div>
    );
}
