"use client";

import { useEffect, useRef, useState } from "react";
import { FiEye, FiEyeOff, FiX } from "react-icons/fi";
import { createUserApi } from "@/lib/userApi";
import { Button } from "@/components/Button";

const INITIAL_FORM = {
  full_name: "",
  email: "",
  password: "",
  phone_number: "",
  role: "student",
};

const CREATABLE_ROLES = [
  { value: "student", label: "Student" },
  { value: "staff", label: "Staff" },
  { value: "instructor", label: "Instructor" },
];

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-[#163300] focus:ring-2 focus:ring-[#9FE870]/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300";

function validateForm(form) {
  const errors = {};
  const fullName = form.full_name.trim();
  const email = form.email.trim();
  const phone = form.phone_number.trim();
  const password = form.password;

  if (!fullName) {
    errors.full_name = "Full name is required.";
  } else if (fullName.length < 2) {
    errors.full_name = "Full name must be at least 2 characters.";
  } else if (fullName.length > 255) {
    errors.full_name = "Full name cannot exceed 255 characters.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please provide a valid email address.";
  } else if (email.length > 255) {
    errors.email = "Email cannot exceed 255 characters.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  } else if (password.length > 128) {
    errors.password = "Password cannot exceed 128 characters.";
  } else if (!/[A-Z]/.test(password)) {
    errors.password = "Password must include at least one uppercase letter.";
  } else if (!/[a-z]/.test(password)) {
    errors.password = "Password must include at least one lowercase letter.";
  } else if (!/[0-9]/.test(password)) {
    errors.password = "Password must include at least one number.";
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    errors.password = "Password must include at least one special character.";
  }

  if (phone) {
    if (phone.length < 7) {
      errors.phone_number = "Phone number must be at least 7 characters.";
    } else if (phone.length > 30) {
      errors.phone_number = "Phone number cannot exceed 30 characters.";
    }
  }

  if (!["student", "staff", "instructor"].includes(form.role)) {
    errors.role = "Please select a valid initial role.";
  }

  return errors;
}

export function CreateUserDrawer({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const resetState = () => {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setApiError("");
    setShowPassword(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetState();
    onClose?.();
  };

  const updateField = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (apiError) setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setApiError("");
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedPhone = form.phone_number.trim();
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(trimmedPhone ? { phone_number: trimmedPhone } : {}),
      };

      const res = await createUserApi(payload);
      resetState();
      onClose?.();
      onCreated?.(res?.data?.user || null);
    } catch (err) {
      if (Array.isArray(err?.errors) && err.errors.length > 0) {
        const mapped = {};
        for (const item of err.errors) {
          if (item.field && !mapped[item.field]) {
            mapped[item.field] = item.message;
          }
        }
        setFieldErrors(mapped);
      }
      setApiError(
        err.status === 0
          ? "Unable to reach the server. Please check your connection and try again."
          : err.message || "Failed to create user."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end overscroll-none bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="create-user-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Add User
            </h2>
            <p className="text-xs text-zinc-500">
              Create a new Student, Staff, or Instructor account.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close drawer"
            className="cursor-pointer rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50 dark:hover:bg-zinc-800"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="create-user-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-6"
        >
          {apiError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
            >
              {apiError}
            </div>
          )}

          <div>
            <label htmlFor="create-user-name" className={LABEL_CLASS}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="create-user-name"
              type="text"
              value={form.full_name}
              onChange={updateField("full_name")}
              placeholder="e.g. Jane Doe"
              className={INPUT_CLASS}
            />
            {fieldErrors.full_name && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.full_name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="create-user-email" className={LABEL_CLASS}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="create-user-email"
              type="email"
              value={form.email}
              onChange={updateField("email")}
              placeholder="jane@example.com"
              className={INPUT_CLASS}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="create-user-password" className={LABEL_CLASS}>
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="create-user-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={updateField("password")}
                placeholder="Enter a strong password"
                className={`${INPUT_CLASS} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? (
                  <FiEyeOff className="h-4 w-4" />
                ) : (
                  <FiEye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              8–128 characters with uppercase, lowercase, number, and special
              character.
            </p>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="create-user-phone" className={LABEL_CLASS}>
              Phone Number
            </label>
            <input
              id="create-user-phone"
              type="tel"
              value={form.phone_number}
              onChange={updateField("phone_number")}
              placeholder="Optional (7–30 characters)"
              className={INPUT_CLASS}
            />
            {fieldErrors.phone_number && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.phone_number}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="create-user-role" className={LABEL_CLASS}>
              Initial Role <span className="text-red-500">*</span>
            </label>
            <select
              id="create-user-role"
              value={form.role}
              onChange={updateField("role")}
              className={INPUT_CLASS}
            >
              {CREATABLE_ROLES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors.role && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.role}</p>
            )}
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
            form="create-user-form"
            disabled={isSubmitting}
            className="px-6 py-2.5"
          >
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </div>
      </div>
    </div>
  );
}
