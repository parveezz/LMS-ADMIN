"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyOtpApi } from "@/lib/authApi";
import { Button } from "@/components/Button";
import { OtpInput } from "@/components/OtpInput";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is missing. Please restart from Forgot Password.");
      return;
    }
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const data = await verifyOtpApi({ email, otp });
      const token = data?.data?.reset_token || "";
      router.push(`/reset-password?token=${encodeURIComponent(token)}`);
    } catch (err) {
      setError(err.message || "Invalid or expired OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-[28px] font-bold tracking-tight text-zinc-900">
          Verify OTP
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {email
            ? `We sent a 6-digit verification code to ${email}`
            : "Enter the 6-digit verification code sent to your email"}
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

      <form onSubmit={handleVerifyOtp} className="space-y-6">
        <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} />

        <Button
          type="submit"
          fullWidth
          disabled={isSubmitting || otp.length !== 6}
        >
          {isSubmitting ? "Verifying..." : "Verify OTP"}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-4 text-xs font-semibold text-zinc-700">
        <Link
          href="/forgot-password"
          className="hover:text-zinc-900 hover:underline"
        >
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
    <Suspense
      fallback={
        <div className="text-center text-sm text-zinc-500">Loading...</div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
