"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
  login_user_name: string;
  password_hash?: string;
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

export default function page() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<CafeUser[]>([]);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, UpdatePayload>>({});
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [deleting,setDeleting] = useState(false);

  // ✅ Fixed Fetch URL
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/cafe/users");
      setRows(res.data?.data || res.data || []);
    } catch (err: any) {
      toast.error("Failed to load users", {
        description: err?.response?.data?.message || err?.message || String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.user_name, r.user_email, r.user_mobile_no, r.login_user_name, r.user_role]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, query]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filtered.map((r) => r.user_id)) : new Set());
  };

  const startEdit = (id: string) => {
    setEditingIds((prev) => new Set(prev).add(id));
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        user_id: id,
        user_name: rows.find((r) => r.user_id === id)?.user_name,
        user_email: rows.find((r) => r.user_id === id)?.user_email,
        user_mobile_no: rows.find((r) => r.user_id === id)?.user_mobile_no,
        login_user_name: rows.find((r) => r.user_id === id)?.login_user_name,
      },
    }));
  };

  const cancelEdit = (id: string) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDrafts((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setShowPasswordMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const deleteSelected = async () => {
  const ids = Array.from(selectedIds);
  if (!ids.length) {
    toast.message("Select users to delete");
    return;
  }

  const confirm = window.confirm(`Permanently delete ${ids.length} user(s)? This cannot be undone.`);
  if (!confirm) return;

  setDeleting(true);
  try {
    // Optimistic UI
    const prevRows = [...rows];
    setRows(r => r.filter(x => !selectedIds.has(x.user_id)));

    // Call backend
    await api.delete("/admin/cafe/user/delete", { data: { user_ids: ids } });

    setSelectedIds(new Set());
    toast.success(`Deleted ${ids.length} user(s)`);
  } catch (err: any) {
    // Rollback on error
    await load();
    toast.error("Delete failed", {
      description: err?.response?.data?.message || err?.message || String(err),
    });
  } finally {
    setDeleting(false);
  }
};

  const setDraft = (id: string, field: keyof UpdatePayload, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { user_id: id }), [field]: value },
    }));
  };

  // FINAL FIX — Prevent empty password from being sent
  const saveAll = async () => {
    if (!Object.keys(drafts).length) {
      toast.message("Nothing to update");
      return;
    }
    setSaving(true);
    try {
      const updatedRows = [...rows];
      for (const id of Object.keys(drafts)) {
        const payload = drafts[id];
const cleaned = { ...payload };

// Remove fields not accepted by backend Zod
delete cleaned.login_user_name;

// Remove empty password if unchanged
if (!cleaned.password_hash) {
  delete cleaned.password_hash;
}
        console.log(payload)
        await api.put("/admin/cafe/user/update", cleaned);
        const idx = updatedRows.findIndex((r) => r.user_id === id);
        if (idx >= 0) {
          updatedRows[idx] = {
            ...updatedRows[idx],
            ...cleaned,
            password_hash: cleaned.password_hash
              ? trim15(cleaned.password_hash)
              : updatedRows[idx].password_hash,
          };
        }
      }
      setRows(updatedRows);
      setEditingIds(new Set());
      setDrafts({});
      setShowPasswordMap({});
      toast.success("Updated successfully");
    } catch (err: any) {
      toast.error("Update failed", {
        description: err?.response?.data?.message || err?.message || String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
          <Button onClick={saveAll} disabled={saving || loading} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Update
          </Button>
          <Button
  variant="destructive"
  onClick={deleteSelected}
  disabled={deleting || loading}
  className="gap-2"
>
  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading users…</span>
                  </div>
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
                            onChange={(e) => setDraft(u.user_id, "user_mobile_no", e.target.value)}
                          />
                        ) : (
                          <span title={u.user_mobile_no}>{trim15(u.user_mobile_no)}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={d.login_user_name ?? u.login_user_name ?? ""}
                            onChange={(e) => setDraft(u.user_id, "login_user_name", e.target.value)}
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
                              onChange={(e) => setDraft(u.user_id, "password_hash", e.target.value)}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center pr-2"
                              onClick={() => toggleShowPassword(u.user_id)}
                            >
                              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

                {!filtered.length && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
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
