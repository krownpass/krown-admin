"use client";

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/api";

// Frontend version of your backend schema
const CreateCafeSchema = z.object({
  cafe_name: z.string().min(3, "Café name is required"),
  cafe_location: z.string().min(5, "Location must be descriptive"),
  cafe_description: z.string().optional(),
  cafe_mobile_no: z
    .string()
    .regex(/^\+?\d{10,15}$/, "Invalid phone number format"),
  cafe_upi_id: z.string().min(5, "Valid UPI ID required"),
  opening_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format (HH:MM)"),
  closing_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format (HH:MM)"),
});

type CreateCafeInput = z.infer<typeof CreateCafeSchema>;

export default function CreateCafePage() {
  // Setup form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateCafeInput>({
    resolver: zodResolver(CreateCafeSchema),
    defaultValues: {
      cafe_name: "",
      cafe_location: "",
      cafe_description: "",
      cafe_mobile_no: "",
      cafe_upi_id: "",
      opening_time: "",
      closing_time: "",
    },
  });

  //  Submit handler
  const onSubmit = async (data: CreateCafeInput) => {
    try {
      const res = await api.post("/admin/cafe/create", {
        ...data,
        cafe_latitude: 0,
        cafe_longitude: 0,
        ratings: 0,
      });
      toast.success(" Café created successfully!", {
        description: `${res.data.data.cafe_name} has been added.`,
        className: "bg-green-50 border-green-500 text-green-900",
      });
      reset();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Failed to create café";
      toast.error("Failed to create café", {
        description: msg,
        className: "bg-red-50 border-red-500 text-red-900",
      });
    }
  };

  // UI
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <h1 className="text-4xl font-bebas text-neutral-800 dark:text-neutral-100 mb-8">
        Create Cafés
      </h1>

      <div className="flex justify-center">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4 md:px-8"
        >
          {/* Café Name */}
          <div className="space-y-2">
            <Label htmlFor="cafe_name">Café Name</Label>
            <Input
              id="cafe_name"
              placeholder="Krown Coffee Lounge"
              {...register("cafe_name")}
            />
            {errors.cafe_name && (
              <p className="text-red-600 text-sm">{errors.cafe_name.message}</p>
            )}
          </div>

          {/* Café Location */}
          <div className="space-y-2">
            <Label htmlFor="cafe_location">Café Location</Label>
            <Input
              id="cafe_location"
              placeholder="Jubilee Hills, Hyderabad"
              {...register("cafe_location")}
            />
            {errors.cafe_location && (
              <p className="text-red-600 text-sm">
                {errors.cafe_location.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cafe_description">Description</Label>
            <Textarea
              id="cafe_description"
              placeholder="Describe the ambiance, style, or offerings..."
              className="min-h-[100px]"
              {...register("cafe_description")}
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="cafe_mobile_no">Phone Number</Label>
            <Input
              id="cafe_mobile_no"
              placeholder="+91 9876543210"
              {...register("cafe_mobile_no")}
            />
            {errors.cafe_mobile_no && (
              <p className="text-red-600 text-sm">
                {errors.cafe_mobile_no.message}
              </p>
            )}
          </div>

          {/* UPI ID */}
          <div className="space-y-2">
            <Label htmlFor="cafe_upi_id">UPI ID</Label>
            <Input
              id="cafe_upi_id"
              placeholder="krowncafe@upi"
              {...register("cafe_upi_id")}
            />
            {errors.cafe_upi_id && (
              <p className="text-red-600 text-sm">{errors.cafe_upi_id.message}</p>
            )}
          </div>

          {/* Opening Time */}
          <div className="space-y-2">
            <Label htmlFor="opening_time">Opening Time</Label>
            <Input id="opening_time" type="time" {...register("opening_time")} />
            {errors.opening_time && (
              <p className="text-red-600 text-sm">
                {errors.opening_time.message}
              </p>
            )}
          </div>

          {/* Closing Time */}
          <div className="space-y-2">
            <Label htmlFor="closing_time">Closing Time</Label>
            <Input id="closing_time" type="time" {...register("closing_time")} />
            {errors.closing_time && (
              <p className="text-red-600 text-sm">
                {errors.closing_time.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-center pt-6">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-2 text-base font-semibold tracking-wide"
              >
                {isSubmitting ? "Creating..." : "Create Café"}
              </Button>
            </motion.div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
