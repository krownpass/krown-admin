"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type QueueItem = {
    organizer_id: string;
    org_name: string;
    organizer_type: "individual" | "team" | "company" | null;
    verification_status:
    | "pending"
    | "email_verified"
    | "mobile_verified"
    | "kyc_submitted"
    | "verified"
    | "rejected"
    | "suspended";
    org_is_verified: boolean;
    is_active: boolean;
    overall_status: "not_started" | "pending" | "verified" | "failed" | "manual_review" | null;
    verification_progress: number;
    owner_email: string | null;
    owner_mobile_number: string | null;
    created_at: string;
    updated_at: string;
};

type QueueResponse = {
    items: QueueItem[];
    total: number;
    page: number;
    limit: number;
};

type OrganizerDetails = {
    organizer: {
        organizer_id: string;
        org_name: string;
        organizer_type: string | null;
        verification_status: string;
        org_is_verified: boolean;
        is_active: boolean;
        created_at: string;
        updated_at: string;
    };
    owner: {
        org_user_id: string;
        email: string | null;
        mobile_number: string | null;
        status: string;
        signup_step: string | null;
        last_login_at: string | null;
    } | null;
    kyc: {
        overall_status: string;
        pan_status: string;
        bank_status: string;
        selfie_status: string;
        company_status: string | null;
        verification_progress: number;
        rejection_reason: string | null;
        updated_at: string;
    } | null;
    pan: {
        pan_number_masked: string | null;
        pan_name: string | null;
        date_of_birth: string | null;
        verification_status: string;
    } | null;
    banks: Array<{
        bank_id: string;
        account_holder_name: string | null;
        account_number_masked: string | null;
        ifsc_code: string | null;
        account_type: string | null;
        bank_name: string | null;
        branch_name: string | null;
        verification_status: string;
        is_primary: boolean;
    }>;
    company: {
        legal_name: string | null;
        trade_name: string | null;
        company_type: string | null;
        company_pan_masked: string | null;
        cin: string | null;
        gstin: string | null;
        verification_status: string;
    } | null;
    liveness: {
        status: string;
        liveness_score: number | null;
        face_match_score: number | null;
        face_image_reference: string | null;
        failure_reason: string | null;
        verified_at: string | null;
    } | null;
    logs: Array<{
        verification_type: string | null;
        previous_status: string | null;
        new_status: string | null;
        remarks: string | null;
        created_at: string;
    }>;
};

type OrganizerSensitiveDetails = {
    pan_number: string | null;
    company_pan_number: string | null;
    banks: Array<{
        bank_id: string;
        account_number: string | null;
    }>;
};

const statusBadgeVariant = (status?: string) => {
    if (!status) return "outline";
    if (status === "verified" || status === "approved") return "success";
    if (status === "rejected" || status === "failed" || status === "suspended") return "destructive";
    return "secondary";
};

const formatDate = (value?: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
};

export default function KrownOrganizersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [selectedOrganizerId, setSelectedOrganizerId] = useState<string | null>(null);
    const [showSensitiveDetails, setShowSensitiveDetails] = useState(false);

    const queueQuery = useQuery({
        queryKey: ["organizers-queue", search, status],
        queryFn: async () => {
            const { data } = await api.get<{ success: boolean; data: QueueResponse }>(
                "/admin/organizers/verification-queue",
                {
                    params: {
                        page: 1,
                        limit: 50,
                        search: search.trim() || undefined,
                        status: status === "all" ? undefined : status,
                    },
                }
            );
            return data.data;
        },
    });

    const organizers = queueQuery.data?.items ?? [];
    const selectedFromList = useMemo(
        () => organizers.find((item) => item.organizer_id === selectedOrganizerId) ?? null,
        [organizers, selectedOrganizerId]
    );

    const detailsQuery = useQuery({
        queryKey: ["organizer-details", selectedOrganizerId],
        queryFn: async () => {
            const { data } = await api.get<{ success: boolean; data: OrganizerDetails }>(
                `/admin/organizers/${selectedOrganizerId}`
            );
            return data.data;
        },
        enabled: Boolean(selectedOrganizerId),
    });

    const sensitiveDetailsQuery = useQuery({
        queryKey: ["organizer-sensitive-details", selectedOrganizerId],
        queryFn: async () => {
            const { data } = await api.get<{ success: boolean; data: OrganizerSensitiveDetails }>(
                `/admin/organizers/${selectedOrganizerId}/sensitive`
            );
            return data.data;
        },
        enabled: false,
        retry: false,
    });

    useEffect(() => {
        setShowSensitiveDetails(false);
    }, [selectedOrganizerId]);

    const sensitiveBanksById = useMemo(
        () =>
            new Map(
                (sensitiveDetailsQuery.data?.banks ?? []).map((bank) => [
                    bank.bank_id,
                    bank.account_number,
                ])
            ),
        [sensitiveDetailsQuery.data]
    );

    const loadSensitiveDetails = async () => {
        const result = await sensitiveDetailsQuery.refetch();
        if (result.error) {
            toast.error("Failed to load sensitive details");
            return;
        }
        setShowSensitiveDetails(true);
    };

    const moderationMutation = useMutation({
        mutationFn: async (payload: { action: "approve" | "reject" | "block" | "unblock"; reason?: string }) => {
            if (!selectedOrganizerId) return;
            await api.patch(`/admin/organizers/${selectedOrganizerId}/moderate`, payload);
        },
        onSuccess: () => {
            toast.success("Organizer status updated");
            queryClient.invalidateQueries({ queryKey: ["organizers-queue"] });
            queryClient.invalidateQueries({ queryKey: ["organizer-details", selectedOrganizerId] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to update organizer");
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Organizer Verification</h1>
                    <p className="text-sm text-muted-foreground">
                        Review KYC, selfie evidence, and approve/reject event organizer access.
                    </p>
                </div>
                <Button variant="outline" onClick={() => queueQuery.refetch()} disabled={queueQuery.isFetching}>
                    {queueQuery.isFetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Organizer Queue</CardTitle>
                    <CardDescription>Only approved organizers can create or edit events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                        <Input
                            placeholder="Search org name, email, mobile..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="all">All statuses</option>
                            <option value="kyc_submitted">KYC Submitted</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                            <option value="suspended">Blocked</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organizer</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Verification</TableHead>
                                <TableHead>KYC</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {queueQuery.isLoading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            )}
                            {!queueQuery.isLoading && organizers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No organizers found
                                    </TableCell>
                                </TableRow>
                            )}
                            {organizers.map((item) => (
                                <TableRow
                                    key={item.organizer_id}
                                    className="cursor-pointer"
                                    onClick={() => setSelectedOrganizerId(item.organizer_id)}
                                    data-state={selectedOrganizerId === item.organizer_id ? "selected" : undefined}
                                >
                                    <TableCell>
                                        <div className="font-medium">{item.org_name}</div>
                                        <div className="text-xs text-muted-foreground">{item.organizer_type ?? "-"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{item.owner_email ?? "-"}</div>
                                        <div className="text-xs text-muted-foreground">{item.owner_mobile_number ?? "-"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusBadgeVariant(item.verification_status) as any}>
                                            {item.verification_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusBadgeVariant(item.overall_status ?? "") as any}>
                                            {item.overall_status ?? "not_started"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.verification_progress}%</TableCell>
                                    <TableCell>{formatDate(item.updated_at)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedOrganizerId && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Organizer Details {selectedFromList ? `- ${selectedFromList.org_name}` : ""}
                        </CardTitle>
                        <CardDescription>Review full KYC evidence before moderation action.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {detailsQuery.isLoading && (
                            <div className="py-6 text-center">
                                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                            </div>
                        )}

                        {detailsQuery.data && (
                            <>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant={statusBadgeVariant(detailsQuery.data.organizer.verification_status) as any}>
                                        {detailsQuery.data.organizer.verification_status}
                                    </Badge>
                                    <Badge variant={detailsQuery.data.organizer.org_is_verified ? "success" : "secondary"}>
                                        {detailsQuery.data.organizer.org_is_verified ? "Approved" : "Not Approved"}
                                    </Badge>
                                    <Badge variant={detailsQuery.data.organizer.is_active ? "secondary" : "destructive"}>
                                        {detailsQuery.data.organizer.is_active ? "Active" : "Blocked"}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={loadSensitiveDetails}
                                        disabled={sensitiveDetailsQuery.isFetching}
                                    >
                                        {sensitiveDetailsQuery.isFetching ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Loading...
                                            </>
                                        ) : showSensitiveDetails ? (
                                            "Reload Sensitive Details"
                                        ) : (
                                            "Load Sensitive Details"
                                        )}
                                    </Button>
                                    {!showSensitiveDetails && (
                                        <p className="text-xs text-muted-foreground">
                                            Sensitive PAN/bank numbers stay hidden until loaded.
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-6 lg:grid-cols-2">
                                    <div className="space-y-3 text-sm">
                                        <h3 className="font-semibold">Owner</h3>
                                        <p>Email: {detailsQuery.data.owner?.email ?? "-"}</p>
                                        <p>Phone: {detailsQuery.data.owner?.mobile_number ?? "-"}</p>
                                        <p>User Status: {detailsQuery.data.owner?.status ?? "-"}</p>
                                        <p>Signup Step: {detailsQuery.data.owner?.signup_step ?? "-"}</p>
                                        <p>Last Login: {formatDate(detailsQuery.data.owner?.last_login_at)}</p>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <h3 className="font-semibold">KYC Summary</h3>
                                        <p>Overall: {detailsQuery.data.kyc?.overall_status ?? "-"}</p>
                                        <p>PAN: {detailsQuery.data.kyc?.pan_status ?? "-"}</p>
                                        <p>Bank: {detailsQuery.data.kyc?.bank_status ?? "-"}</p>
                                        <p>Selfie: {detailsQuery.data.kyc?.selfie_status ?? "-"}</p>
                                        <p>Company: {detailsQuery.data.kyc?.company_status ?? "-"}</p>
                                        <p>Progress: {detailsQuery.data.kyc?.verification_progress ?? 0}%</p>
                                        <p>Rejection Reason: {detailsQuery.data.kyc?.rejection_reason ?? "-"}</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-2 text-sm">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">PAN Details</h3>
                                        <p>Masked PAN: {detailsQuery.data.pan?.pan_number_masked ?? "-"}</p>
                                        <p>
                                            PAN Number:{" "}
                                            {showSensitiveDetails
                                                ? sensitiveDetailsQuery.data?.pan_number ?? "-"
                                                : "Hidden"}
                                        </p>
                                        <p>Name: {detailsQuery.data.pan?.pan_name ?? "-"}</p>
                                        <p>DOB: {detailsQuery.data.pan?.date_of_birth ?? "-"}</p>
                                        <p>Status: {detailsQuery.data.pan?.verification_status ?? "-"}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">Selfie Verification</h3>
                                        <p>Status: {detailsQuery.data.liveness?.status ?? "-"}</p>
                                        <p>Liveness Score: {detailsQuery.data.liveness?.liveness_score ?? "-"}</p>
                                        <p>Face Match Score: {detailsQuery.data.liveness?.face_match_score ?? "-"}</p>
                                        <p>Failure Reason: {detailsQuery.data.liveness?.failure_reason ?? "-"}</p>
                                        {detailsQuery.data.liveness?.face_image_reference && (
                                            <img
                                                src={detailsQuery.data.liveness.face_image_reference}
                                                alt="Organizer selfie verification"
                                                className="mt-2 max-h-72 rounded-md border object-contain"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <h3 className="font-semibold">Bank Accounts</h3>
                                    {detailsQuery.data.banks.length === 0 && <p className="text-muted-foreground">No bank details</p>}
                                    {detailsQuery.data.banks.map((bank) => (
                                        <div key={bank.bank_id} className="rounded-md border p-3">
                                            <p>{bank.account_holder_name ?? "-"}</p>
                                            <p>Masked: {bank.account_number_masked ?? "-"}</p>
                                            <p>
                                                Account Number:{" "}
                                                {showSensitiveDetails
                                                    ? sensitiveBanksById.get(bank.bank_id) ?? "-"
                                                    : "Hidden"}
                                            </p>
                                            <p>Type: {bank.account_type ?? "-"}</p>
                                            <p>{bank.bank_name ?? "-"} / {bank.ifsc_code ?? "-"}</p>
                                            <p>Status: {bank.verification_status}{bank.is_primary ? " - Primary" : ""}</p>
                                        </div>
                                    ))}
                                </div>

                                {detailsQuery.data.company && (
                                    <div className="space-y-2 text-sm">
                                        <h3 className="font-semibold">Company Details</h3>
                                        <p>Legal Name: {detailsQuery.data.company.legal_name ?? "-"}</p>
                                        <p>Trade Name: {detailsQuery.data.company.trade_name ?? "-"}</p>
                                        <p>Type: {detailsQuery.data.company.company_type ?? "-"}</p>
                                        <p>CIN: {detailsQuery.data.company.cin ?? "-"}</p>
                                        <p>GSTIN: {detailsQuery.data.company.gstin ?? "-"}</p>
                                        <p>Company PAN: {detailsQuery.data.company.company_pan_masked ?? "-"}</p>
                                        <p>
                                            Company PAN Number:{" "}
                                            {showSensitiveDetails
                                                ? sensitiveDetailsQuery.data?.company_pan_number ?? "-"
                                                : "Hidden"}
                                        </p>
                                        <p>Status: {detailsQuery.data.company.verification_status}</p>
                                    </div>
                                )}

                                <div className="space-y-2 text-sm">
                                    <h3 className="font-semibold">Verification Logs</h3>
                                    <div className="max-h-64 overflow-auto rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Time</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>From</TableHead>
                                                    <TableHead>To</TableHead>
                                                    <TableHead>Remarks</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {detailsQuery.data.logs.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                            No logs
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                {detailsQuery.data.logs.map((log, index) => (
                                                    <TableRow key={`${log.created_at}-${index}`}>
                                                        <TableCell>{formatDate(log.created_at)}</TableCell>
                                                        <TableCell>{log.verification_type ?? "-"}</TableCell>
                                                        <TableCell>{log.previous_status ?? "-"}</TableCell>
                                                        <TableCell>{log.new_status ?? "-"}</TableCell>
                                                        <TableCell>{log.remarks ?? "-"}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button
                                        onClick={() => moderationMutation.mutate({ action: "approve" })}
                                        disabled={moderationMutation.isPending}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            const reason = window.prompt("Reason for rejection (optional)") || undefined;
                                            moderationMutation.mutate({ action: "reject", reason });
                                        }}
                                        disabled={moderationMutation.isPending}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => moderationMutation.mutate({ action: "block" })}
                                        disabled={moderationMutation.isPending}
                                    >
                                        Block
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => moderationMutation.mutate({ action: "unblock" })}
                                        disabled={moderationMutation.isPending}
                                    >
                                        Unblock
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
