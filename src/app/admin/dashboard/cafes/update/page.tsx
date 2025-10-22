"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Save,
  PencilLine,
  X,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

type CafeUser = {
  user_id: string;
  user_name: string;
  user_email: string;
  user_mobile_no: string;
  password_hash?: string;
  login_user_name: string;
  user_role: "cafe_admin" | "cafe_staff";
  cafe_id: string;
  created_at?: string;
};

type UpdatePayload = Partial<
  Pick<
    CafeUser,
    | "user_name"
    | "user_email"
    | "user_mobile_no"
    | "login_user_name"
    | "password_hash"
  >
> & { user_id: string };

const trim15 = (s?: string) =>
  (s ?? "").length > 15 ? (s ?? "").slice(0, 15) + "…" : (s ?? "");


const fetchCafeUsers = async (): Promise<CafeUser[]> => {
  const res = await api.get("/admin/cafe/users");
  const data = res.data?.data || res.data || [];
  return data.map((u: any) => ({
    ...u,
    password_hash: "",
  }));
};

export default function Page() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, UpdatePayload>>({});
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  //  useQuery for fetching users
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["cafeUsers"],
    queryFn: fetchCafeUsers,
  });

  //  Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (user_ids: string[]) =>
      api.delete("/admin/cafe/user/delete", { data: { user_ids } }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ["cafeUsers"] });
      const prev = queryClient.getQueryData<CafeUser[]>(["cafeUsers"]);
      if (prev) {
        queryClient.setQueryData(
          ["cafeUsers"],
          prev.filter((u) => !ids.includes(u.user_id))
        );
      }
      return { prev };
    },
    onError: (err, _, ctx) => {
      queryClient.setQueryData(["cafeUsers"], ctx?.prev);
      toast.error("Delete failed", {
        description:
          (err as any)?.response?.data?.message ||
          (err as any)?.message ||
          "Something went wrong",
      });
    },
    onSuccess: (_, ids) => {
      toast.success(`Deleted ${ids.length} user(s)`);
      setSelectedIds(new Set());
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["cafeUsers"] }),
  });

  // Update Mutation
const updateMutation = useMutation({
  mutationFn: async (payload: UpdatePayload) => {
const cleaned = { ...payload };

// only send password if user typed a new one
if (!cleaned.password_hash) delete cleaned.password_hash;

await api.put("/admin/cafe/user/update", cleaned);
    return cleaned;
  },
onMutate: async (payload) => {
  await queryClient.cancelQueries({ queryKey: ["cafeUsers"] });
  const prev = queryClient.getQueryData<CafeUser[]>(["cafeUsers"]);
  if (prev) {
    queryClient.setQueryData(["cafeUsers"], () =>
      prev.map((u) =>
        u.user_id === payload.user_id
          ? {
              ...u,
              ...payload,
              password_hash: undefined, 
            }
          : u
      )
    );
  }
  return { prev };
},
  onError: (err, _, ctx) => {
    queryClient.setQueryData(["cafeUsers"], ctx?.prev);
    toast.error("Update failed", {
      description:
        (err as any)?.response?.data?.message ||
        (err as any)?.message ||
        "Something went wrong",
    });
  },
  onSuccess: () => {
    toast.success("User updated");
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["cafeUsers"] });
  },
});

  // Filtered rows
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.user_name, r.user_email, r.user_mobile_no, r.login_user_name, r.user_role]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, query]);

  // Local UI Handlers
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSelectAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(filtered.map((r) => r.user_id)) : new Set());

  const startEdit = (id: string) => {
    setEditingIds((prev) => new Set(prev).add(id));
    const u = rows.find((r) => r.user_id === id);
    if (u)
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          user_id: id,
          user_name: u.user_name,
          user_email: u.user_email,
          user_mobile_no: u.user_mobile_no,
          login_user_name: u.login_user_name,
        },
      }));
  };

  const cancelEdit = (id: string) => {
    setEditingIds((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });
    setDrafts((p) => {
      const { [id]: _, ...r } = p;
      return r;
    });
  };

  const setDraft = (id: string, field: keyof UpdatePayload, value: string) =>
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { user_id: id }), [field]: value },
    }));

  const saveAll = async () => {
    if (!Object.keys(drafts).length) {
      toast.message("Nothing to update");
      return;
    }
    for (const id of Object.keys(drafts)) {
      await updateMutation.mutateAsync(drafts[id]);
    }
    setEditingIds(new Set());
    setDrafts({});
  };

  const deleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      toast.message("Select users to delete");
      return;
    }
    if (!window.confirm(`Permanently delete ${ids.length} user(s)?`)) return;
    deleteMutation.mutate(ids);
  };

  const toggleShowPassword = (id: string) =>
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));

  // UI
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
          <Input
            placeholder="Search by name, email, phone, username, role…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            onClick={saveAll}
            disabled={updateMutation.isPending || isLoading}
            className="gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Update
          </Button>

          <Button
            variant="destructive"
            onClick={deleteSelected}
            disabled={deleteMutation.isPending || isLoading}
            className="gap-2"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableCaption className="text-sm">
            Showing {filtered.length} of {rows.length} users
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onCheckedChange={(v: any) => toggleSelectAll(Boolean(v))}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                  Loading users…
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence initial={false}>
                {filtered.map((u) => {
                  const isEditing = editingIds.has(u.user_id);
                  const d = drafts[u.user_id] || {};
                  const showPass = !!showPasswordMap[u.user_id];
                  return (
                    <motion.tr
                      key={u.user_id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="hover:bg-neutral-50"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(u.user_id)}
                          onCheckedChange={() => toggleSelect(u.user_id)}
                        />
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={d.user_name ?? u.user_name ?? ""}
                            onChange={(e) => setDraft(u.user_id, "user_name", e.target.value)}
                          />
                        ) : (
                          <span title={u.user_name}>{trim15(u.user_name)}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={d.user_email ?? u.user_email ?? ""}
                            onChange={(e) => setDraft(u.user_id, "user_email", e.target.value)}
                          />
                        ) : (
                          <span title={u.user_email}>{trim15(u.user_email)}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={d.user_mobile_no ?? u.user_mobile_no ?? ""}
                            onChange={(e) =>
                              setDraft(u.user_id, "user_mobile_no", e.target.value)
                            }
                          />
                        ) : (
                          <span title={u.user_mobile_no}>{trim15(u.user_mobile_no)}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={d.login_user_name ?? u.login_user_name ?? ""}
                            onChange={(e) =>
                              setDraft(u.user_id, "login_user_name", e.target.value)
                            }
                          />
                        ) : (
                          <span title={u.login_user_name}>{trim15(u.login_user_name)}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <div className="relative">
                            <Input
                              type={showPass ? "text" : "password"}
                              placeholder="Set new password (optional)"
                              value={d.password_hash ?? ""}
                              onChange={(e) =>
                                setDraft(u.user_id, "password_hash", e.target.value)
                              }
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-2"
                              onClick={() => toggleShowPassword(u.user_id)}
                            >
                              {showPass ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span>•••••••••••••••</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge>{u.user_role}</Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        {isEditing ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelEdit(u.user_id)}
                          >
                            <X className="h-4 w-4" /> Cancel
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(u.user_id)}
                          >
                            <PencilLine className="h-4 w-4" /> Update
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  );
                })}
                {!filtered.length && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
