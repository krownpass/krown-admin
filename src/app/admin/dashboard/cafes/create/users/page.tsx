"use client";

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";

import {
  CreateCafeUserInput,
  CreateCafeUserSchema,
} from "@/lib/validators/schema";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✅ Data type for café list
type CafeOption = { cafe_id: string; cafe_name: string };

export default function CreateCafeUserPage() {
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  // ✅ Fetch cafés (React Query)
  const { data: cafes = [], isLoading: cafesLoading } = useQuery<CafeOption[]>({
    queryKey: ["cafes-list"],
    queryFn: async () => {
      const res = await api.get("/admin/cafe_name/list");
      return res.data?.data || [];
    },
  });

  // ✅ React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    reset,
  } = useForm<CreateCafeUserInput>({
    resolver: zodResolver(CreateCafeUserSchema),
  });

  // ✅ Create user mutation
  const createUser = useMutation({
    mutationFn: async (data: CreateCafeUserInput) =>
      api.post("/admin/cafe/user/create", data),
    onSuccess: (res) => {
      toast.success("Café user created successfully", {
        description:
          res.data?.data?.user_name ||
          res.data?.message ||
          "User has been added",
      });
      queryClient.invalidateQueries({ queryKey: ["cafes-list"] });
      reset();
      setValue("cafe_id", undefined as unknown as string);
      setValue(
        "user_role",
        undefined as unknown as CreateCafeUserInput["user_role"]
      );
    },
    onError: (err: any) =>
      toast.error("Failed to create café user", {
        description: err?.response?.data?.message || err?.message || "Error",
      }),
  });

  const onSubmit = (data: CreateCafeUserInput) => {
    if (!data.cafe_id) {
      toast.error("Select a café to assign this user");
      return;
    }
    if (!data.user_role) {
      toast.error("Select a role for this user");
      return;
    }
    createUser.mutate(data);
  };

  // ✅ UI
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <h1 className="text-4xl font-bebas text-neutral-800 mb-8">
        Create Café User
      </h1>

      <div className="flex justify-center">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-4"
        >
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="user_name">Name</Label>
            <Input id="user_name" {...register("user_name")} />
            {errors.user_name && (
              <p className="text-red-600 text-sm">{errors.user_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="user_email">Email</Label>
            <Input id="user_email" {...register("user_email")} />
            {errors.user_email && (
              <p className="text-red-600 text-sm">{errors.user_email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="user_mobile_no">Phone</Label>
            <Input id="user_mobile_no" {...register("user_mobile_no")} />
            {errors.user_mobile_no && (
              <p className="text-red-600 text-sm">
                {errors.user_mobile_no.message}
              </p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="login_user_name">Username</Label>
            <Input id="login_user_name" {...register("login_user_name")} />
            {errors.login_user_name && (
              <p className="text-red-600 text-sm">
                {errors.login_user_name.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2 md:col-span-2">
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
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password_hash && (
              <p className="text-red-600 text-sm">
                {errors.password_hash.message}
              </p>
            )}
          </div>

          {/* Café dropdown */}
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="cafe_id">Assign to Café</Label>
            <Select
              disabled={cafesLoading}
              value={getValues("cafe_id") || undefined}
              onValueChange={(v) =>
                setValue("cafe_id", v, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={cafesLoading ? "Loading..." : "Select Café"}
                />
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
            {errors.cafe_id && (
              <p className="text-red-600 text-sm">{errors.cafe_id.message}</p>
            )}
          </div>

          {/* Role dropdown */}
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="user_role">Role</Label>
            <Select
              value={getValues("user_role") || undefined}
              onValueChange={(v) =>
                setValue("user_role", v as CreateCafeUserInput["user_role"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cafe_admin">Café Admin</SelectItem>
                <SelectItem value="cafe_staff">Café Staff</SelectItem>
              </SelectContent>
            </Select>
            {errors.user_role && (
              <p className="text-red-600 text-sm">{errors.user_role.message}</p>
            )}
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-center pt-6">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                disabled={createUser.isPending}
                className="px-10 py-2 text-base font-semibold tracking-wide"
              >
                {createUser.isPending ? "Creating..." : "Create User"}
              </Button>
            </motion.div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
