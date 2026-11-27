"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff, FiX } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { changePasswordApi } from "@/lib/authApi";
import { Button } from "@/components/Button";

const INPUT_CLASS =
  "w-full rounded-lg border border-border-default bg-surface px-3.5 py-2.5 pr-11 text-sm text-text-primary placeholder:text-text-subtle outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40";

const LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300";

function validateNewPassword(currentPassword, newPassword, confirmPassword) {
  if (!currentPassword || !newPassword || !confirmPassword) {
    return "All password fields are required.";
  }
  if (newPassword.length < 8) {
    return "New password must be at least 8 characters long.";
  }
  if (newPassword.length > 128) {
    return "New password cannot exceed 128 characters.";
  }
  if (!/[A-Z]/.test(newPassword)) {
    return "New password must include at least one uppercase letter.";
  }
  if (!/[a-z]/.test(newPassword)) {
    return "New password must include at least one lowercase letter.";
  }
  if (!/[0-9]/.test(newPassword)) {
    return "New password must include at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(newPassword)) {
    return "New password must include at least one special character.";
  }
  if (newPassword === currentPassword) {
    return "New password must be different from your current password.";
  }
  if (newPassword !== confirmPassword) {
    return "Confirm password does not match the new password.";
  }
  return "";
}

export function ChangePasswordDrawer({ isOpen, onClose }) {
  const router = useRouter();
  const { setUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onCloseRef.current?.();
      }
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("overflow");
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateNewPassword(
      currentPassword,
      newPassword,
      confirmPassword
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePasswordApi({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccess(
        res?.message || "Password changed successfully. Please log in again."
      );
      resetForm();
      onClose?.();
      // Backend already invalidates token_version and clears cookie; clear client state directly
      setUser(null);
      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end overscroll-none bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="change-password-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Change Password
            </h2>
            <p className="text-xs text-zinc-500">
              You will be signed out after updating your password.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close drawer"
            className="cursor-pointer rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="change-password-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-6"
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="current-password" className={LABEL_CLASS}>
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                aria-label={
                  showCurrent ? "Hide current password" : "Show current password"
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600"
              >
                {showCurrent ? (
                  <FiEyeOff className="h-4 w-4" />
                ) : (
                  <FiEye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="new-password" className={LABEL_CLASS}>
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                aria-label={showNew ? "Hide new password" : "Show new password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600"
              >
                {showNew ? (
                  <FiEyeOff className="h-4 w-4" />
                ) : (
                  <FiEye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-500">
              8–128 characters with uppercase, lowercase, number, and special
              character.
            </p>
          </div>

          <div>
            <label htmlFor="confirm-new-password" className={LABEL_CLASS}>
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm-new-password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={
                  showConfirm
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600"
              >
                {showConfirm ? (
                  <FiEyeOff className="h-4 w-4" />
                ) : (
                  <FiEye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="cursor-pointer rounded-sm border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <Button
            type="submit"
            form="change-password-form"
            disabled={isSubmitting}
            className="px-5 py-2.5"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
}
