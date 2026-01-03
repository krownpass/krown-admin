"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit, ImagePlus } from "lucide-react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function StoriesPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addMediaDialogOpen, setAddMediaDialogOpen] = useState(false);
  const [changeCoverOpen, setChangeCoverOpen] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const { register, handleSubmit, reset } = useForm();

  /* ---------------- LOAD STORIES ---------------- */
  const loadStories = async () => {
    try {
      const res = await api.get("/krown-stories");
      setStories(res.data.data);
    } catch {
      toast.error("Failed to load stories");
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  /* ---------------- CONFIRM HELPER ---------------- */
  const openConfirm = (action: () => void) => {
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  /* ---------------- CREATE STORY ---------------- */
  const onCreateStory = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("cover_img", data.cover_img[0]);
      for (const f of data.media) formData.append("media", f);

      await api.post("/krown-stories", formData);
      toast.success("Story created");

      reset();
      setOpenCreateDialog(false);
      loadStories();
    } catch {
      toast.error("Failed to create story");
    }
  };

  /* ---------------- EDIT STORY ---------------- */
  const openEditDialog = (story: any) => {
    setSelectedStoryId(story.story_id);
    reset({ title: story.title, description: story.description });
    setEditDialogOpen(true);
  };

  const onEditStory = async (data: any) => {
    try {
      await api.put(`/krown-stories/${selectedStoryId}`, data);
      toast.success("Story updated");
      setEditDialogOpen(false);
      loadStories();
    } catch {
      toast.error("Failed to update story");
    }
  };

  /* ---------------- DELETE STORY ---------------- */
  const deleteStory = async (id: string) => {
    try {
      await api.delete(`/krown-stories/${id}`);
      toast.success("Story deleted");
      loadStories();
    } catch {
      toast.error("Failed to delete story");
    }
  };

  /* ---------------- MEDIA ---------------- */
  const openAddMediaDialog = (id: string) => {
    setSelectedStoryId(id);
    reset();
    setAddMediaDialogOpen(true);
  };

  const onAddMedia = async (data: any) => {
    try {
      const fd = new FormData();
      for (const f of data.media) fd.append("media", f);

      await api.post(`/krown-stories/${selectedStoryId}/media`, fd);
      toast.success("Media added");
      setAddMediaDialogOpen(false);
      loadStories();
    } catch {
      toast.error("Failed to add media");
    }
  };

  const deleteMedia = async (mediaId: string) => {
    try {
      await api.delete(`/krown-stories/media/${mediaId}`);
      toast.success("Media deleted");
      loadStories();
    } catch {
      toast.error("Failed to delete media");
    }
  };

  /* ---------------- COVER IMAGE ---------------- */
  const openChangeCover = (id: string) => {
    setSelectedStoryId(id);
    reset();
    setChangeCoverOpen(true);
  };

  const onChangeCover = async (data: any) => {
    try {
      const fd = new FormData();
      fd.append("cover_img", data.cover_img[0]);

      await api.put(`/krown-stories/${selectedStoryId}/cover`, fd);
      toast.success("Cover updated");
      setChangeCoverOpen(false);
      loadStories();
    } catch {
      toast.error("Failed to update cover");
    }
  };

  const deleteCover = async () => {
    try {
      await api.delete(`/krown-stories/${selectedStoryId}/cover`);
      toast.success("Cover removed");
      loadStories();
    } catch {
      toast.error("Failed to remove cover");
    }
  };

  /* ====================================================== */

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-4xl font-bold">Krown Stories</h1>
        <Button onClick={() => setOpenCreateDialog(true)}>
          <Plus size={18} /> Add Story
        </Button>
      </div>

      {/* STORIES */}
      <div className="grid md:grid-cols-3 gap-6">
        {stories.map((story) => (
          <motion.div
            key={story.story_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-xl shadow"
          >
            {/* COVER */}
            <div className="relative">
              {story.cover_img ? (
                <>
                  <img
                    src={story.cover_img}
                    className="h-48 w-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() =>
                      openConfirm(() => {
                        setSelectedStoryId(story.story_id);
                        deleteCover();
                      })
                    }
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow"
                  >
                    <Trash2 size={14} className="text-red-600" />
                  </button>
                  <Button
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => openChangeCover(story.story_id)}
                  >
                    Change
                  </Button>
                </>
              ) : (
                <button
                  onClick={() => openChangeCover(story.story_id)}
                  className="h-48 w-full flex items-center justify-center border rounded-lg"
                >
                  <ImagePlus size={40} className="text-gray-400" />
                </button>
              )}
            </div>

            <h3 className="text-xl font-bold mt-3">{story.title}</h3>
            <p className="text-gray-600 text-sm">{story.description}</p>

            {/* MEDIA */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {story.media.map((m: any) => (
                <div key={m.media_id} className="relative group">
                  {m.type === "image" ? (
                    <img src={m.uri} className="h-20 w-full object-cover" />
                  ) : (
                    <video src={m.uri} className="h-20 w-full object-cover" />
                  )}
                  <button
                    onClick={() => openConfirm(() => deleteMedia(m.media_id))}
                    className="absolute top-1 right-1 bg-white p-1 rounded-full hidden group-hover:block"
                  >
                    <Trash2 size={12} className="text-red-600" />
                  </button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => openAddMediaDialog(story.story_id)}
            >
              <Plus size={14} /> Add Media
            </Button>

            <div className="flex justify-between mt-4">
              <Button
                variant="destructive"
                onClick={() => openConfirm(() => deleteStory(story.story_id))}
              >
                <Trash2 size={16} /> Delete
              </Button>

              <Button variant="secondary" onClick={() => openEditDialog(story)}>
                <Edit size={16} /> Edit
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ===================== DIALOGS ===================== */}

      {/* CREATE */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <form onSubmit={handleSubmit(onCreateStory)} className="space-y-4">
            <Input {...register("title")} placeholder="Title" required />
            <Textarea {...register("description")} placeholder="Description" />
            <Input type="file" {...register("cover_img")} required />
            <Input type="file" multiple {...register("media")} required />
            <Button type="submit" className="w-full">
              Create Story
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit(onEditStory)} className="space-y-4">
            <Input {...register("title")} required />
            <Textarea {...register("description")} required />
            <Button type="submit" className="w-full">
              Update
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD MEDIA */}
      <Dialog open={addMediaDialogOpen} onOpenChange={setAddMediaDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit(onAddMedia)} className="space-y-4">
            <Input type="file" multiple {...register("media")} required />
            <Button type="submit" className="w-full">
              Upload Media
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* CHANGE / ADD COVER */}
      <Dialog open={changeCoverOpen} onOpenChange={setChangeCoverOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit(onChangeCover)} className="space-y-4">
            <Input type="file" {...register("cover_img")} required />
            <Button type="submit" className="w-full">
              Save Cover
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <h3 className="text-xl font-bold">Confirm Delete</h3>
          <p className="text-gray-600 mt-2">This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                confirmAction();
                setConfirmOpen(false);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
