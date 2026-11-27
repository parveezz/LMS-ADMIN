"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/Baseurl";
import { FloatingInput } from "@/components/FloatingInput";
import { OtpInput } from "@/components/OtpInput";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("otp"); // "otp" | "reset"
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Invalid or expired OTP.");
        return;
      }

      setResetToken(data?.data?.reset_token || "");
      setStep("reset");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reset_token: resetToken,
          new_password: newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Unable to reset password.");
        return;
      }

      router.push("/login");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-[28px] font-bold tracking-tight text-zinc-900">
          {step === "otp" ? "Verify OTP" : "Set New Password"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {step === "otp"
            ? initialEmail
              ? `We sent a 6-digit verification code to ${initialEmail}`
              : "Enter your email and the 6-digit verification code"
            : "Create a strong new password for your account"}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          {!initialEmail && (
            <FloatingInput
              id="email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}

          <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} />

          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="w-full cursor-pointer rounded-full bg-[#9FE870] py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8ee05a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      )}

      {step === "reset" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="relative">
            <FloatingInput
              id="new-password"
              name="new_password"
              type={showPassword ? "text" : "password"}
              label="New password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full cursor-pointer rounded-full bg-[#9FE870] py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8ee05a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      <div className="mt-6 flex items-center justify-center gap-4 text-xs font-semibold text-zinc-700">
        <Link href="/forgot-password" className="hover:text-zinc-900 hover:underline">
          Resend OTP
        </Link>
        <span aria-hidden="true" className="text-zinc-300">
          •
        </span>
        <Link href="/login" className="hover:text-zinc-900 hover:underline">
          Back to Sign In
        </Link>
      </div>
    </>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-zinc-500">Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
