"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import api from "@/lib/api";

import {
    Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
    Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";

// Searchable Select Components
import {
    Command,
    CommandInput,
    CommandList,
    CommandItem,
    CommandGroup,
    CommandEmpty,
} from "@/components/ui/command";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";

export default function NotificationsPage() {
    const router = useRouter();
    const { admin, loading } = useAdmin();

    const [mode, setMode] = useState("single");

    const [users, setUsers] = useState<any[]>([]);
    const [openUserSelect, setOpenUserSelect] = useState(false);

    const [selectedUser, setSelectedUser] = useState<any>(null);

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [data, setData] = useState('{ "screen": "Home" }');
    const [response, setResponse] = useState("");
    const [sending, setSending] = useState(false);

    // Fetch users
    useEffect(() => {
        async function loadUsers() {
            try {
                const res = await api.get("/push/users");
                setUsers(res.data.users || []);
            } catch (err) {
                console.log("Error loading users", err);
            }
        }
        loadUsers();
    }, []);

    // Wait for admin
    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading admin…</div>;
    }

    if (!admin) {
        router.push("/admin/login");
        return null;
    }

    function parseJSONSafe(text: string) {
        try {
            return text.trim() ? JSON.parse(text) : {};
        } catch {
            throw new Error("Invalid JSON in additional data");
        }
    }

    // SEND TO SINGLE USER
    async function sendToSingleUser() {
        try {
            setSending(true);
            setResponse("");

            if (!selectedUser) {
                return setResponse("❌ Select a user first.");
            }

            if (!title.trim() || !body.trim()) {
                return setResponse("❌ Title and Body are required.");
            }

            const payload = {
                user_id: selectedUser.user_id,
                title,
                body,
                data: parseJSONSafe(data)
            };

            const res = await api.post("/push/send", payload);
            console.log(res)
            setResponse(JSON.stringify(res.data, null, 2));

        } catch (err: any) {
            setResponse("❌ " + (err.response?.data?.message || err.message));
        } finally {
            setSending(false);
        }
    }

    // BROADCAST
    async function sendBroadcast() {
        try {
            setSending(true);
            setResponse("");

            if (!title.trim() || !body.trim()) {
                return setResponse("❌ Title and Body are required.");
            }

            if (!(admin?.role === "master_admin" || admin?.role === "krown_admin")) {
                return setResponse("❌ You are not allowed to broadcast messages.");
            }

            const payload = {
                title,
                body,
                data: parseJSONSafe(data)
            };

            const res = await api.post("/push/broadcast", payload);
            setResponse(JSON.stringify(res.data, null, 2));

        } catch (err: any) {
            setResponse("❌ " + (err.response?.data?.message || err.message));
        } finally {
            setSending(false);
        }
    }

    const handleSend = () => {
        if (mode === "single") return sendToSingleUser();
        return sendBroadcast();
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>
                        Send Notifications
                        <span className="text-sm text-gray-500 ml-2">
                            (Logged in as {admin.name} — {admin.role})
                        </span>
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">

                    {/* MODE */}
                    <div>
                        <Label>Mode</Label>
                        <Select value={mode} onValueChange={setMode}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Send to One User</SelectItem>

                                {(admin.role === "master_admin" || admin.role === "krown_admin") && (
                                    <SelectItem value="broadcast">Send Broadcast</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* USER DROPDOWN */}
                    {mode === "single" && (
                        <div className="space-y-2">
                            <Label>Select User</Label>

                            <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between"
                                    >
                                        {selectedUser
                                            ? `${selectedUser.user_name} — ${selectedUser.user_mobile_no}`
                                            : "Search user..."}
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Search by name or mobile..." />

                                        <CommandList>
                                            <CommandEmpty>No user found.</CommandEmpty>

                                            <CommandGroup>
                                                {users.map((u) => (
                                                    <CommandItem
                                                        key={u.user_id}
                                                        value={u.user_id}
                                                        onSelect={() => {
                                                            setSelectedUser(u);
                                                            setOpenUserSelect(false);
                                                        }}
                                                    >
                                                        {u.user_name} — {u.user_mobile_no}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {/* TITLE */}
                    <div>
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    {/* BODY */}
                    <div>
                        <Label>Message Body</Label>
                        <Textarea value={body} onChange={(e) => setBody(e.target.value)} />
                    </div>

                    {/* JSON */}
                    <div>
                        <Label>Additional Data (JSON)</Label>
                        <Textarea
                            className="font-mono text-sm"
                            rows={4}
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                        />
                    </div>

                    {/* SEND */}
                    <Button onClick={handleSend} disabled={sending} className="w-full">
                        {sending ? "Sending..." : "Send Notification"}
                    </Button>

                    {/* RESPONSE */}
                    {response && (
                        <pre className="bg-black text-green-400 p-4 rounded-md text-sm overflow-x-auto">
                            {response}
                        </pre>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
