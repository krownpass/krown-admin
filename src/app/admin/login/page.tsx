"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IMAGES } from "../../../../public/assets";
import { toast } from "sonner";
import api from "@/lib/api";
import { InputOTP, InputOTPSlot } from "@/components/ui/input-otp";
import { setToken } from "@/lib/auth";

type Step = "phone" | "otp" | "recovery";

export default function LoginPage() {
    const router = useRouter();

    const [step, setStep] = React.useState<Step>("phone");
    const [phone, setPhone] = React.useState("");
    const [otp, setOtp] = React.useState("");
    const [recoveryPass, setRecoveryPass] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const formatPhone = (p: string) =>
        p.trim().startsWith("+") ? p.trim() : `+91${p.trim()}`;

    //  Send OTP
    const handleSendOtp = async () => {
        const p = phone.trim();
        if (!p) {
            toast.error("Please enter a valid phone number.");
            return;
        }
        try {
            setLoading(true);
            await api.post(
                "/admin/send-otp",
                { phone: formatPhone(p) },
                { withCredentials: true }
            );
            toast.success("OTP sent successfully!");
            setStep("otp");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    //  Verify OTP Login
    const handleVerifyOtp = async () => {
        if (!otp) {
            toast.error("Please enter the OTP.");
            return;
        }
        try {
            setLoading(true);
            const res = await api.post(
                "/admin/verify-otp",
                { phone: formatPhone(phone), code: otp },
                { withCredentials: true }
            );

            if (res.data?.token) setToken(res.data.token);
            // Show recovery only for 1st-time login
            if (res.data?.recovery_pass) {
                toast.success(`Recovery Pass: ${res.data.recovery_pass}`);
            } else {
                toast.success("Login successful!");
            }

            router.push("/admin/dashboard");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Invalid OTP. Try again.");
        } finally {
            setLoading(false);
        }
    };

    // Recovery Login
    const handleRecoveryLogin = async () => {
        if (!recoveryPass) {
            toast.error("Please enter recovery pass.");
            return;
        }
        try {
            setLoading(true);
            const res = await api.post(
                "/admin/recovery-login",
                { phone: formatPhone(phone), recovery_pass: recoveryPass },
                { withCredentials: true }
            );

            if (res.data?.token) setToken(res.data.token);
            toast.success("Recovery login successful!");
            router.push("/admin/dashboard");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Recovery failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
            <Image src={IMAGES.krown} width={100} height={100} alt="krown" />

            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-xl">
                        {step === "phone" && "Enter Phone Number"}
                        {step === "otp" && "Enter OTP"}
                        {step === "recovery" && "Recovery Login"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Step: phone */}
                    {step === "phone" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    placeholder="+91XXXXXXXXXX"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" disabled={loading} onClick={handleSendOtp}>
                                {loading ? "Sending…" : "Send OTP"}
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => setStep("recovery")}
                            >
                                Can’t receive OTP? Use Recovery
                            </Button>
                        </>
                    )}
                    {step === "otp" && (
                        <>
                            <Label>OTP</Label>
                            <InputOTP
                                maxLength={7}
                                value={otp}
                                onChange={(value) => setOtp(value)}
                                className="flex justify-center gap-2"
                            >
                                {Array.from({ length: 7 }).map((_, index) => (
                                    <InputOTPSlot
                                        key={index}
                                        index={index}
                                        className="w-12 h-12 text-xl"
                                    />
                                ))}
                            </InputOTP>

                            <Button className="w-full" disabled={loading} onClick={handleVerifyOtp}>
                                {loading ? "Verifying…" : "Verify & Login"}
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    className="w-full cursor-pointer"
                                    disabled={loading}
                                    onClick={handleSendOtp}
                                >
                                    Resend OTP
                                </Button>
                            </div>
                        </>
                    )}


                    {/* Step: recovery */}
                    {step === "recovery" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="recovery-phone">Phone</Label>
                                <Input
                                    id="recovery-phone"
                                    placeholder="+91XXXXXXXXXX"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="recovery-pass">Recovery Pass</Label>
                                <Input
                                    id="recovery-pass"
                                    placeholder="Enter your recovery pass"
                                    value={recoveryPass}
                                    onChange={(e) => setRecoveryPass(e.target.value.trim())}
                                />
                            </div>
                            <Button className="w-full" disabled={loading} onClick={handleRecoveryLogin}>
                                {loading ? "Signing in…" : "Login via Recovery"}
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => setStep("phone")}>
                                ← Back
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
