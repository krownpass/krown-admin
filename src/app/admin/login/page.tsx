"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

import api from "@/lib/api";
import { setToken } from "@/lib/auth";
import { IMAGES } from "../../../../public/assets";

// SHADCN OTP
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

export default function AdminAuthPage() {
    const router = useRouter();

    const [step, setStep] = useState<"phone" | "otp" | "recovery">("phone");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    const [form, setForm] = useState({
        phone: "",
        otp: "",
        session_id: "",
        recovery_pass: "",
    });

    // ---------------------
    // SEND OTP
    // ---------------------
    const handleSendOtp = async (e?: any) => {
        if (e) e.preventDefault();

        if (form.phone.trim().length < 10)
            return toast.error("Enter a valid phone number");

        setLoading(true);

        try {
            const res = await api.post("/admin/send-otp", {
                phone: form.phone,
            });

            const sessionId = res.data?.data?.sessionId;
            if (!sessionId) return toast.error("Failed to send OTP");

            setForm((f) => ({ ...f, session_id: sessionId }));
            setStep("otp");

            toast.success("OTP sent successfully!");
        } catch (err: any) {
            toast.error("OTP sending failed", {
                description: err.response?.data?.message || "Try again",
            });
        } finally {
            setLoading(false);
        }
    };

    // ---------------------
    // VERIFY OTP
    // ---------------------
    const handleVerifyOtp = async (e: any) => {
        e.preventDefault();

        if (form.otp.length !== 6)
            return toast.error("Please enter 6-digit OTP");

        setLoading(true);

        try {
            const res = await api.post("/admin/verify-otp", {
                phone: form.phone,
                code: form.otp,
                session_id: form.session_id,
            });

            const token = res.data?.data?.token;
            if (!token) return toast.error("OTP verification failed");

            setToken(token);
            toast.success("Login successful!");
            router.push("/admin/dashboard");
        } catch (err: any) {
            toast.error("Invalid OTP", {
                description: err.response?.data?.message || "Try again",
            });
        } finally {
            setLoading(false);
        }
    };

    // ---------------------
    // RESEND OTP
    // ---------------------
    const handleResendOtp = async () => {
        if (resendLoading) return;

        setResendLoading(true);

        try {
            const res = await api.post("/admin/send-otp", {
                phone: form.phone,
            });

            const sessionId = res.data?.data?.sessionId;
            if (!sessionId) return toast.error("Failed to resend OTP");

            setForm((f) => ({ ...f, session_id: sessionId }));

            toast.success("OTP resent!");
        } catch (err: any) {
            toast.error("Resend failed", {
                description: err.response?.data?.message || "Try again",
            });
        } finally {
            setResendLoading(false);
        }
    };

    // ---------------------
    // RECOVERY LOGIN
    // ---------------------
    const handleRecoveryLogin = async (e: any) => {
        e.preventDefault();

        if (!form.recovery_pass.trim())
            return toast.error("Enter recovery password");

        setLoading(true);

        try {
            const res = await api.post("/admin/recovery-login", {
                phone: form.phone,
                recovery_pass: form.recovery_pass,
            });

            const token = res.data?.data?.token;
            if (!token) return toast.error("Recovery login failed");

            setToken(token);
            toast.success("Login successful!");
            router.push("/admin/dashboard");
        } catch (err: any) {
            toast.error("Invalid recovery password", {
                description: err.response?.data?.message || "Try again",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
            <Image src={IMAGES.krown} width={100} height={100} alt="krown" />

            <Card className="w-full max-w-sm mt-4">
                <CardHeader>
                    <CardTitle className="text-xl text-center">
                        {step === "phone" && "Admin Login"}
                        {step === "otp" && "Enter OTP"}
                        {step === "recovery" && "Recovery Login"}
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <AnimatePresence mode="wait">
                        {/* ---------------- PHONE STEP ---------------- */}
                        {step === "phone" && (
                            <motion.form
                                key="phone-step"
                                onSubmit={handleSendOtp}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        value={form.phone}
                                        maxLength={10}
                                        onChange={(e) =>
                                            setForm({ ...form, phone: e.target.value })
                                        }
                                        placeholder="Enter admin phone"
                                    />
                                </div>

                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? "Sending..." : "Send OTP"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => setStep("recovery")}
                                >
                                    Can't receive OTP? Use Recovery
                                </Button>
                            </motion.form>
                        )}

                        {/* ---------------- OTP STEP ---------------- */}
                        {step === "otp" && (
                            <motion.form
                                key="otp-step"
                                onSubmit={handleVerifyOtp}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2 text-center">
                                    <Label className="text-lg">Enter OTP</Label>

                                    <InputOTP
                                        maxLength={6}
                                        value={form.otp}
                                        onChange={(value) =>
                                            setForm((f) => ({ ...f, otp: value }))
                                        }
                                        className="flex justify-center"
                                    >
                                        <InputOTPGroup className="gap-2">
                                            <InputOTPSlot index={0} className="w-10 h-12 text-xl" />
                                            <InputOTPSlot index={1} className="w-10 h-12 text-xl" />
                                            <InputOTPSlot index={2} className="w-10 h-12 text-xl" />
                                            <InputOTPSlot index={3} className="w-10 h-12 text-xl" />
                                            <InputOTPSlot index={4} className="w-10 h-12 text-xl" />
                                            <InputOTPSlot index={5} className="w-10 h-12 text-xl" />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>

                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? "Verifying..." : "Verify OTP"}
                                </Button>

                                <div className="flex justify-between items-center">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={resendLoading}
                                        onClick={handleResendOtp}
                                    >
                                        {resendLoading ? "Resending..." : "Resend OTP"}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setStep("phone")}
                                    >
                                        Change Number
                                    </Button>
                                </div>
                            </motion.form>
                        )}

                        {/* ---------------- RECOVERY STEP ---------------- */}
                        {step === "recovery" && (
                            <motion.form
                                key="recovery-step"
                                onSubmit={handleRecoveryLogin}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        value={form.phone}
                                        maxLength={10}
                                        onChange={(e) =>
                                            setForm({ ...form, phone: e.target.value })
                                        }
                                        placeholder="Enter phone"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Recovery Password</Label>
                                    <Input
                                        type="password"
                                        value={form.recovery_pass}
                                        onChange={(e) =>
                                            setForm({ ...form, recovery_pass: e.target.value })
                                        }
                                        placeholder="Enter recovery password"
                                    />
                                </div>

                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? "Logging in..." : "Login via Recovery"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => setStep("phone")}
                                >
                                    ← Back
                                </Button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
}
