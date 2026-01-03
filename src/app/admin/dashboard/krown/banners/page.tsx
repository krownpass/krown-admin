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

type Banner = {
    image_id: number;
    image_url: string;
    path: string;
    section: string;
    admin_id: string;
    created_at: string;
    updated_at: string;
};
export default function BannersPage() {
    const { admin, loading } = useAdmin();
    const queryClient = useQueryClient();

    const [creatingSection, setCreatingSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchBanners = async () => {
        const { data } = await api.get("/admin/banner/all");
        return data.data || {};
    };

    const { data: bannersBySection, isLoading } = useQuery<
        Record<string, Banner[]>
    >({
        queryKey: ["banners"],
        queryFn: fetchBanners,
    });

    // UPLOAD
    const handleUpload = async (file: File, section: string) => {
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("section", section);
        formData.append("file_name", file.name);
        formData.append("bucket", "krown-admin");
        formData.append("admin_id", admin?.admin_id || "");

        try {
            await api.post("/admin/banner/upload", formData);
            toast.success("Banner uploaded successfully!");
            queryClient.invalidateQueries({ queryKey: ["banners"] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    // DELETE
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

    // REPLACE BANNER
    const handleReplace = async (file: File, img: any) => {
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("image_id", img.image_id);
        formData.append("bucket", "krown-admin");
        formData.append("admin_id", admin?.admin_id || "");

        try {
            await api.post("/admin/banner/replace", formData);
            toast.success("Banner replaced successfully!");
            queryClient.invalidateQueries({ queryKey: ["banners"] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Replace failed");
        } finally {
            setUploading(false);
        }
    };

    // NEW SECTION
    const handleAddSection = () => {
        const section = newSectionName.trim().toLowerCase();
        if (!section) return toast.error("Enter section name");

        if (bannersBySection && bannersBySection[section]) {
            return toast.error("Section already exists");
        }

        queryClient.setQueryData(["banners"], (prev: any) => ({
            ...prev,
            [section]: [],
        }));

        toast.success(`Section "${section}" created`);
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
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Manage Banners</h1>
                    <p className="text-gray-500">Upload, delete or replace banners.</p>
                </div>

                {creatingSection ? (
                    <div className="flex gap-2">
                        <Input
                            placeholder="New section name"
                            value={newSectionName}
                            onChange={(e) => setNewSectionName(e.target.value)}
                            className="w-48"
                        />
                        <Button onClick={handleAddSection}>Add</Button>
                        <Button variant="outline" onClick={() => setCreatingSection(false)}>
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <Button onClick={() => setCreatingSection(true)}>
                        <PlusCircle size={16} /> New Section
                    </Button>
                )}
            </div>

            <Separator />

            {/* SECTIONS */}
            {Object.entries(sections).map(([section, banners]) => (
                <motion.div key={section} className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold capitalize">{section}</h2>

                        <Label
                            htmlFor={`${section}-upload`}
                            className={`flex items-center gap-2 text-blue-600 cursor-pointer`}
                        >
                            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                            Upload Image
                        </Label>

                        <Input
                            id={`${section}-upload`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                handleUpload(file, section);
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {banners.map((img: any) => (
                            <motion.div
                                key={img.image_id}
                                className="relative group border rounded-lg overflow-hidden"
                            >
                                <Image
                                    src={img.image_url}
                                    alt="banner"
                                    width={400}
                                    height={200}
                                    className="object-cover h-40 w-full"
                                />

                                {/* DELETE BUTTON */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Banner?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure? This action cannot be undone.
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

                                {/* REPLACE BUTTON */}
                                <Label
                                    htmlFor={`replace-${img.image_id}`}
                                    className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg hover:bg-black/80 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                >
                                    Replace
                                </Label>

                                <Input
                                    id={`replace-${img.image_id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        handleReplace(file, img);
                                    }}
                                />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
