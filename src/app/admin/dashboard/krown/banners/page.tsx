"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
    Upload,
    Trash2,
    PlusCircle,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useAdmin } from "@/hooks/useAdmin";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function BannersPage() {
    const { admin, loading } = useAdmin();
    const queryClient = useQueryClient();

    const [creatingSection, setCreatingSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // 🔹 Fetch banners grouped by section
    const fetchBanners = async () => {
        const { data } = await api.get("/admin/banner/all");
        return data.data || {};
    };

    const { data: bannersBySection, isLoading } = useQuery({
        queryKey: ["banners"],
        queryFn: fetchBanners,
    });

    //  Upload banner
    const handleUpload = async (file: File, section: string) => {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("section", section);
        formData.append("file_name", file.name);
        formData.append("bucket", "krown-admin");
        formData.append("admin_id", admin?.admin_id || "");

        try {
            await api.post("/admin/banner/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Banner uploaded successfully!");
            queryClient.invalidateQueries({ queryKey: ["banners"] });
        } catch (err: any) {
            console.error("Upload error:", err.response?.data);
            toast.error(err.response?.data?.message || "Failed to upload banner");
        } finally {
            setUploading(false);
        }
    };

    //  Delete banner
    const handleDelete = async (imageId: string) => {
        setDeletingId(imageId);
        try {
            await api.delete(`/admin/banner/delete/${imageId}`);
            toast.success("Banner deleted");
            queryClient.invalidateQueries({ queryKey: ["banners"] });
        } catch {
            toast.error("Delete failed");
        } finally {
            setDeletingId(null);
        }
    };

    //  Add a new section
    const handleAddSection = () => {
        const section = newSectionName.trim().toLowerCase();
        if (!section) return toast.error("Enter a section name");
        if (bannersBySection && bannersBySection[section]) {
            return toast.error("Section already exists");
        }

        queryClient.setQueryData(["banners"], (prev: any) => ({
            ...prev,
            [section]: [],
        }));
        toast.success(`New section "${section}" created`);
        setNewSectionName("");
        setCreatingSection(false);
    };

    if (loading || isLoading)
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
            </div>
        );

    const sections = bannersBySection || {};

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 md:p-10 space-y-10"
        >
            {/* ---------- Header ---------- */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Banners</h1>
                    <p className="text-gray-500">
                        Upload or delete banners for each app section.
                    </p>
                </div>

                {/* Add new section button */}
                {creatingSection ? (
                    <div className="flex gap-2">
                        <Input
                            placeholder="New section name"
                            value={newSectionName}
                            onChange={(e) => setNewSectionName(e.target.value)}
                            className="w-48"
                        />
                        <Button onClick={handleAddSection}>Add</Button>
                        <Button
                            variant="outline"
                            onClick={() => setCreatingSection(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={() => setCreatingSection(true)}
                        className="flex items-center gap-2"
                    >
                        <PlusCircle size={16} /> New Section
                    </Button>
                )}
            </div>

            <Separator />

            {/* ---------- Dynamic Sections ---------- */}
            {Object.keys(sections).length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    No sections found. Add a new section to start uploading banners.
                </div>
            )}

            {Object.entries(sections).map(([section, banners]) => (
                <motion.div
                    key={section}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold capitalize">
                            {section} Section
                        </h2>

                        {/* Upload image button */}
                        <Label
                            htmlFor={`${section}-upload`}
                            className={`flex items-center gap-2 text-blue-600 hover:underline cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""
                                }`}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" /> Upload Image
                                </>
                            )}
                        </Label>
                        <Input
                            id={`${section}-upload`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if ((banners as any[]).length >= 5) {
                                    toast.error("You can upload up to 5 banners per section.");
                                    return;
                                }
                                handleUpload(file, section);
                            }}
                        />
                    </div>

                    {/* Banner Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {(banners as any[]).map((img: any) => (
                                <motion.div
                                    key={img.image_id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="relative group rounded-lg overflow-hidden border"
                                >
                                    <Image
                                        src={img.image_url}
                                        alt="banner"
                                        width={400}
                                        height={200}
                                        className="object-cover h-40 w-full"
                                    />

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button
                                                className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                                                disabled={!!deletingId}
                                            >
                                                {deletingId === img.image_id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="flex items-center gap-2">
                                                    <AlertTriangle className="text-red-600" /> Confirm
                                                    Deletion
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete this banner? This
                                                    action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-red-600 hover:bg-red-700"
                                                    onClick={() => handleDelete(img.image_id)}
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {(banners as any[]).length === 0 && (
                            <p className="col-span-full text-sm text-gray-500 text-center py-8">
                                No banners uploaded yet.
                            </p>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
