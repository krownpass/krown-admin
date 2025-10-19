"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";
import { CreateCafeUserInput, CreateCafeUserSchema } from "@/lib/validators/schema";


export default function CreateCafeUserPage() {
  const [cafes, setCafes] = useState<{ cafe_id: string; cafe_name: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<CreateCafeUserInput>({
    resolver: zodResolver(CreateCafeUserSchema),
  });

  // Fetch list of cafés for dropdown
  useEffect(() => {
    const fetchCafes = async () => {
      try {
        const res = await api.get("/admin/cafe_name/list");
        setCafes(res.data.data || []);
      } catch (err) {
        toast.error("Failed to fetch cafés");
      }
    };
    fetchCafes();
  }, []);

  const onSubmit = async (data: CreateCafeUserInput) => {
    try {
      const res = await api.post("/admin/cafe/user/create", data);
toast.success("Café user created successfully", {
  description: `${res.data.data?.user?.user_name || "User"} added`,
  className: "bg-green-50 border-green-500 text-green-900",
});
      reset();
    } catch (err: any) {
      toast.error(" Failed to create café user", {
        description: err.response?.data?.message || err.message,
        className: "bg-red-50 border-red-500 text-red-900",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <h1 className="text-4xl font-bebas text-neutral-800 m b-8">Create Café User</h1>

      <div className="flex justify-center">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-4"
        >
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="user_name">Name</Label>
            <Input id="user_name" {...register("user_name")} />
            {errors.user_name && <p className="text-red-600 text-sm">{errors.user_name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="user_email">Email</Label>
            <Input id="user_email" {...register("user_email")} />
            {errors.user_email && <p className="text-red-600 text-sm">{errors.user_email.message}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="user_mobile_no">Phone</Label>
            <Input id="user_mobile_no" {...register("user_mobile_no")} />
            {errors.user_mobile_no && <p className="text-red-600 text-sm">{errors.user_mobile_no.message}</p>}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="login_user_name">Username</Label>
            <Input id="login_user_name" {...register("login_user_name")} />
            {errors.login_user_name && <p className="text-red-600 text-sm">{errors.login_user_name.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2 md:col-span-2 relative">
            <Label htmlFor="password_hash">Password</Label>
            <div className="relative">
              <Input
                id="password_hash"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                {...register("password_hash")}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password_hash && <p className="text-red-600 text-sm">{errors.password_hash.message}</p>}
          </div>

          {/* Café dropdown */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cafe_id">Assign to Café</Label>
            <Select onValueChange={(v:any) => setValue("cafe_id", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Café" />
              </SelectTrigger>
              <SelectContent>
                {cafes.length > 0 ? (
                  cafes.map((cafe) => (
                    <SelectItem key={cafe.cafe_id} value={cafe.cafe_id}>
                      {cafe.cafe_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No cafés available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.cafe_id && <p className="text-red-600 text-sm">{errors.cafe_id.message}</p>}
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-center pt-6">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-2 text-base font-semibold tracking-wide"
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </motion.div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
