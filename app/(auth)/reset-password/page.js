"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { resetPasswordApi } from "@/lib/authApi";
import { Button } from "@/components/Button";
import { FloatingInput } from "@/components/FloatingInput";

function EyeIcon({ open }) {
  return open ? (
    <FiEyeOff className="h-4 w-4" />
  ) : (
    <FiEye className="h-4 w-4" />
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken) {
      setError("Reset token is missing. Please verify your OTP again.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await resetPasswordApi({
        reset_token: resetToken,
        new_password: newPassword,
      });
      router.push("/login");
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-[28px] font-bold tracking-tight text-zinc-900">
          Set New Password
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Create a strong new password for your account
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
            <EyeIcon open={showPassword} />
          </button>
        </div>

        <div className="relative">
          <FloatingInput
            id="confirm-password"
            name="confirm_password"
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600"
          >
            <EyeIcon open={showConfirmPassword} />
          </button>
        </div>

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Password"}
        </Button>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-sm text-zinc-500">Loading...</div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
