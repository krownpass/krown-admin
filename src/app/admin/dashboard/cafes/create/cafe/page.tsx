"use client";

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import api from "@/lib/api";
import { CreateCafeInput, CreateCafeSchema } from "@/lib/validators/schema";

export default function CreateCafePage() {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(CreateCafeSchema),
        defaultValues: {
            cafe_name: "",
            cafe_location: "",
            cafe_description: "",
            cafe_mobile_no: "",
            cafe_upi_id: "",
            latitude: 0,
            longitude: 0,
            opening_time: "",
            closing_time: "",
        },
    });

    const createCafe = useMutation({
        mutationFn: async (data: CreateCafeInput) => {
            const res = await api.post("/admin/cafe/create", {
                ...data,
                ratings: 0,
            });
            return res.data;
        },
        onSuccess: (res) => {
            toast.success("Café created successfully!", {
                description: `${res.data.cafe_name} has been added.`,
            });
            reset();
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || "Failed to create café"
            );
        },
    });

    const onSubmit = (data: z.infer<typeof CreateCafeSchema>) => {

        return (
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full"
            >
                <h1 className="text-4xl font-bebas mb-8">
                    Create Cafés
                </h1>

                <div className="flex justify-center">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl"
                    >
                        {/* Name */}
                        <div className="space-y-2">
                            <Label>Café Name</Label>
                            <Input {...register("cafe_name")} />
                            {errors.cafe_name && (
                                <p className="text-red-600 text-sm">
                                    {errors.cafe_name.message}
                                </p>
                            )}
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <Label>Café Location</Label>
                            <Input {...register("cafe_location")} />
                            {errors.cafe_location && (
                                <p className="text-red-600 text-sm">
                                    {errors.cafe_location.message}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2 md:col-span-2">
                            <Label>Description</Label>
                            <Textarea {...register("cafe_description")} />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input {...register("cafe_mobile_no")} />
                            {errors.cafe_mobile_no && (
                                <p className="text-red-600 text-sm">
                                    {errors.cafe_mobile_no.message}
                                </p>
                            )}
                        </div>

                        {/* UPI */}
                        <div className="space-y-2">
                            <Label>UPI ID</Label>
                            <Input {...register("cafe_upi_id")} />
                            {errors.cafe_upi_id && (
                                <p className="text-red-600 text-sm">
                                    {errors.cafe_upi_id.message}
                                </p>
                            )}
                        </div>

                        {/* Opening */}
                        <div className="space-y-2">
                            <Label>Opening Time</Label>
                            <Input type="time" {...register("opening_time")} />
                        </div>

                        {/* Closing */}
                        <div className="space-y-2">
                            <Label>Closing Time</Label>
                            <Input type="time" {...register("closing_time")} />
                        </div>

                        {/* Latitude */}
                        <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input
                                type="number"
                                step="any"
                                {...register("latitude", { valueAsNumber: true })}
                            />
                            {errors.latitude && (
                                <p className="text-red-600 text-sm">
                                    {errors.latitude.message}
                                </p>
                            )}
                        </div>

                        {/* Longitude */}
                        <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input
                                type="number"
                                step="any"
                                {...register("longitude", { valueAsNumber: true })}
                            />
                            {errors.longitude && (
                                <p className="text-red-600 text-sm">
                                    {errors.longitude.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="md:col-span-2 flex justify-center pt-6">
                            <Button
                                type="submit"
                                disabled={createCafe.isPending}
                            >
                                {createCafe.isPending
                                    ? "Creating..."
                                    : "Create Café"}
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>
        );
    }
}
