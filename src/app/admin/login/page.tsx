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
import { getToken, setToken } from "@/lib/auth";
import { getZodError, RecoverySchema, SendOtpSchema, VerifyOtpSchema } from "@/lib/validators/adminAuthSchema";


type Step = "phone" | "otp" | "recovery";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = React.useState<Step>("phone");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [recoveryPass, setRecoveryPass] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Send OTP
  const handleSendOtp = async () => {
    try {
      const parsed = SendOtpSchema.parse({ phone });
      setLoading(true);

      await api.post(
        "/admin/send-otp",
        { phone: parsed.phone },
        { withCredentials: true }
      );

      toast.success("OTP sent successfully");
      setStep("otp");
    } catch (err) {
      toast.error(getZodError(err));
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP Login
  const handleVerifyOtp = async () => {
    try {
      const parsed = VerifyOtpSchema.parse({ phone, code: otp });
      setLoading(true);

      const res = await api.post(
        "/admin/verify-otp",
        { phone: parsed.phone, code: parsed.code },
        { withCredentials: true }
      );

      const token = res.data?.data?.token;

      if (token) {
        setToken(token);
        toast.success("Login successful");
        router.push("/admin/dashboard");
      } else {
        toast.error("No token received");
      }
    } catch (err) {
      toast.error(getZodError(err));
    } finally {
      setLoading(false);
    }
  };

  // Recovery Login
  const handleRecoveryLogin = async () => {
    try {
      const parsed = RecoverySchema.parse({
        phone,
        recovery_pass: recoveryPass,
      });
      setLoading(true);

      const res = await api.post(
        "/admin/recovery-login",
        { phone: parsed.phone, recovery_pass: parsed.recovery_pass },
        { withCredentials: true }
      );

      const token = res.data?.data?.token;

      if (token) {
        setToken(token);
        toast.success("Recovery login successful");
        router.push("/admin/dashboard");
      } else {
        toast.error("No token received");
      }
    } catch (err) {
      toast.error(getZodError(err));
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
                Can't receive OTP? Use Recovery
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
                  <InputOTPSlot key={index} index={index} className="w-12 h-12 text-xl" />
                ))}
              </InputOTP>

              <Button className="w-full" disabled={loading} onClick={handleVerifyOtp}>
                {loading ? "Verifying…" : "Verify & Login"}
              </Button>

              <Button
                variant="secondary"
                className="w-full"
                disabled={loading}
                onClick={handleSendOtp}
              >
                Resend OTP
              </Button>
            </>
          )}

          {step === "recovery" && (
            <>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+91XXXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Recovery Pass</Label>
                <Input
                  placeholder="Enter your recovery pass"
                  value={recoveryPass}
                  onChange={(e) => setRecoveryPass(e.target.value)}
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
    </div>
  );
}
