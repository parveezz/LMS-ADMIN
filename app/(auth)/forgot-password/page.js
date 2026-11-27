"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/Baseurl";
import { FloatingInput } from "@/components/FloatingInput";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Unable to send recovery code.");
        return;
      }

      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
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
          Forgot Password
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Enter your email to receive a 6-digit verification code
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

      <form onSubmit={handleSendOtp} className="space-y-4">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full cursor-pointer rounded-full bg-[#9FE870] py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8ee05a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending Code..." : "Send OTP"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:underline"
        >
          Back to Sign In
        </Link>
      </div>
    </>
  );
}
