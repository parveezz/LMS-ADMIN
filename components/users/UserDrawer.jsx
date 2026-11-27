"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/lib/permissions";
import {
  getUserByIdApi,
  updateUserApi,
  updateUserStatusApi,
} from "@/lib/userApi";
import { Button } from "@/components/Button";
import { UserRoleManager } from "./UserRoleManager";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
  instructor: "Instructor",
  student: "Student",
};

const STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  pending_verification: "Pending Verification",
};

const STATUS_STYLES = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-zinc-200 bg-zinc-100 text-zinc-600",
  suspended: "border-red-200 bg-red-50 text-red-700",
  pending_verification: "border-amber-200 bg-amber-50 text-amber-700",
};

const STATUS_DESCRIPTIONS = {
  active:
    "Account is active and can access the platform according to assigned permissions.",
  inactive: "Account is inactive.",
  suspended: "Account has been suspended.",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-[#163300] focus:ring-2 focus:ring-[#9FE870]/40 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300";

function formatDateTime(value, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
}

function validateProfile(form) {
  const errors = {};
  const fullName = form.full_name.trim();
  const email = form.email.trim();
  const phone = form.phone_number.trim();

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

  if (phone) {
    if (phone.length < 7) {
      errors.phone_number = "Phone number must be at least 7 characters.";
    } else if (phone.length > 30) {
      errors.phone_number = "Phone number cannot exceed 30 characters.";
    }
  }

  return errors;
}

export function UserDrawer({ userId, onClose, onUpdated }) {
  const { user: actor, hasRole } = useAuth();
  const isActorSuperAdmin = hasRole(ROLES.SUPER_ADMIN);
  const isSelf = actor?.id === userId;

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "edit" | "status" | "roles"
  const [targetUser, setTargetUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Edit profile state
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
  });
  const [profileErrors, setProfileErrors] = useState({});

  // Status state
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);

  const onCloseRef = useRef(onClose);
  const isMutatingRef = useRef(isMutating);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isMutatingRef.current = isMutating;
  }, [isMutating]);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape" && !isMutatingRef.current) {
        onCloseRef.current?.();
      }
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("overflow");
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const applyUser = useCallback((u) => {
    setTargetUser(u);
    setProfileForm({
      full_name: u?.full_name || "",
      email: u?.email || "",
      phone_number: u?.phone_number || "",
    });
    setSelectedStatus(
      ["active", "inactive", "suspended"].includes(u?.status)
        ? u.status
        : "active"
    );
  }, []);

  const loadUser = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const res = await getUserByIdApi(userId);
      applyUser(res?.data?.user || null);
    } catch (err) {
      setLoadError(
        err.status === 0
          ? "Unable to reach the server. Please check your connection."
          : err.message || "Failed to load user details."
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId, applyUser]);

  useEffect(() => {
    let active = true;
    getUserByIdApi(userId)
      .then((res) => {
        if (active) {
          applyUser(res?.data?.user || null);
        }
      })
      .catch((err) => {
        if (active) {
          setLoadError(
            err.status === 0
              ? "Unable to reach the server. Please check your connection."
              : err.message || "Failed to load user details."
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userId, applyUser]);

  if (!userId) return null;

  const targetRoles = Array.isArray(targetUser?.roles) ? targetUser.roles : [];
  const isTargetSuperAdmin = targetRoles.includes(ROLES.SUPER_ADMIN);
  const canModifyTargetAccount = !isTargetSuperAdmin || isActorSuperAdmin;

  const handleClose = () => {
    if (isMutating) return;
    onClose?.();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (isMutating || !canModifyTargetAccount) return;

    setActionError("");
    setActionSuccess("");
    const errors = validateProfile(profileForm);
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setIsMutating(true);
    try {
      const trimmedPhone = profileForm.phone_number.trim();
      const payload = {
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
        phone_number: trimmedPhone ? trimmedPhone : null,
      };

      const res = await updateUserApi(userId, payload);
      applyUser(res?.data?.user || targetUser);
      setActionSuccess("User profile updated successfully.");
      onUpdated?.();
    } catch (err) {
      if (Array.isArray(err?.errors) && err.errors.length > 0) {
        const mapped = {};
        for (const item of err.errors) {
          if (item.field && !mapped[item.field]) {
            mapped[item.field] = item.message;
          }
        }
        setProfileErrors(mapped);
      }
      setActionError(err.message || "Failed to update user profile.");
    } finally {
      setIsMutating(false);
    }
  };

  const isSameStatus = selectedStatus === targetUser?.status;
  const isSelfDeactivate = isSelf && selectedStatus !== "active";
  const canSubmitStatus =
    canModifyTargetAccount && !isSameStatus && !isSelfDeactivate;

  const handleUpdateStatus = async () => {
    if (isMutating || !canSubmitStatus) return;

    setActionError("");
    setActionSuccess("");
    setIsMutating(true);
    try {
      const res = await updateUserStatusApi(userId, { status: selectedStatus });
      applyUser(res?.data?.user || targetUser);
      setConfirmStatusOpen(false);
      setActionSuccess(`User status updated to "${selectedStatus}".`);
      onUpdated?.();
    } catch (err) {
      setConfirmStatusOpen(false);
      setActionError(err.message || "Failed to update user status.");
    } finally {
      setIsMutating(false);
    }
  };

  const currentStatusKey = (targetUser?.status || "inactive").toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end overscroll-none bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="flex h-full w-full max-w-xl flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="min-w-0 pr-3">
            <h2
              id="user-drawer-title"
              className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {targetUser?.full_name || "User Details"}
            </h2>
            <p className="truncate text-xs text-zinc-500">
              {targetUser?.email || `ID: ${userId}`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isMutating}
            aria-label="Close drawer"
            className="cursor-pointer rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50 dark:hover:bg-zinc-800"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-200 px-6 text-xs font-semibold dark:border-zinc-800">
          {[
            { id: "overview", label: "Overview" },
            { id: "edit", label: "Edit Profile" },
            { id: "status", label: "Status" },
            { id: "roles", label: "Roles" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActionError("");
                setActionSuccess("");
                setConfirmStatusOpen(false);
                setActiveTab(tab.id);
              }}
              className={`shrink-0 cursor-pointer border-b-2 px-4 py-3 transition ${
                activeTab === tab.id
                  ? "border-[#163300] text-[#163300] dark:border-[#9FE870] dark:text-[#9FE870]"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              Loading user details...
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/40 px-6 py-10 text-center"
            >
              <FiAlertTriangle className="mb-2 h-6 w-6 text-red-600" />
              <p className="text-sm font-medium text-red-700">{loadError}</p>
              <Button
                type="button"
                onClick={loadUser}
                className="mt-4 px-5 py-2"
              >
                <FiRefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </Button>
            </div>
          ) : (
            <>
              {actionError && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
                >
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
                  <FiCheckCircle className="h-4 w-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* OVERVIEW TAB */}
              {activeTab === "overview" && targetUser && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[currentStatusKey] ||
                        "border-zinc-200 bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {STATUS_LABELS[currentStatusKey] || currentStatusKey}
                    </span>
                    {targetRoles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        {ROLE_LABELS[role] || role}
                      </span>
                    ))}
                  </div>

                  <dl className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-800">
                    {[
                      ["User ID", targetUser.id],
                      ["Full Name", targetUser.full_name || "—"],
                      ["Email", targetUser.email || "—"],
                      ["Phone Number", targetUser.phone_number || "—"],
                      [
                        "Email Verification",
                        targetUser.email_verified_at
                          ? `Verified (${formatDateTime(targetUser.email_verified_at)})`
                          : "Not verified",
                      ],
                      [
                        "Last Login",
                        formatDateTime(targetUser.last_login_at, "Never"),
                      ],
                      ["Created At", formatDateTime(targetUser.created_at)],
                      ["Updated At", formatDateTime(targetUser.updated_at)],
                    ].map(([label, val]) => (
                      <div
                        key={label}
                        className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <dt className="text-xs font-semibold text-zinc-500">
                          {label}
                        </dt>
                        <dd className="break-all text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {val}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* EDIT PROFILE TAB */}
              {activeTab === "edit" && (
                <form
                  id="edit-user-form"
                  onSubmit={handleSaveProfile}
                  noValidate
                  className="space-y-4"
                >
                  {!canModifyTargetAccount && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Only a Super Admin can edit a Super Admin account.
                      </span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="edit-user-name" className={LABEL_CLASS}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-user-name"
                      type="text"
                      disabled={!canModifyTargetAccount || isMutating}
                      value={profileForm.full_name}
                      onChange={(e) => {
                        setProfileForm((p) => ({
                          ...p,
                          full_name: e.target.value,
                        }));
                        setProfileErrors((p) => ({ ...p, full_name: "" }));
                      }}
                      className={INPUT_CLASS}
                    />
                    {profileErrors.full_name && (
                      <p className="mt-1 text-xs text-red-600">
                        {profileErrors.full_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="edit-user-email" className={LABEL_CLASS}>
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-user-email"
                      type="email"
                      disabled={!canModifyTargetAccount || isMutating}
                      value={profileForm.email}
                      onChange={(e) => {
                        setProfileForm((p) => ({
                          ...p,
                          email: e.target.value,
                        }));
                        setProfileErrors((p) => ({ ...p, email: "" }));
                      }}
                      className={INPUT_CLASS}
                    />
                    {profileErrors.email && (
                      <p className="mt-1 text-xs text-red-600">
                        {profileErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="edit-user-phone" className={LABEL_CLASS}>
                      Phone Number
                    </label>
                    <input
                      id="edit-user-phone"
                      type="tel"
                      disabled={!canModifyTargetAccount || isMutating}
                      value={profileForm.phone_number}
                      onChange={(e) => {
                        setProfileForm((p) => ({
                          ...p,
                          phone_number: e.target.value,
                        }));
                        setProfileErrors((p) => ({ ...p, phone_number: "" }));
                      }}
                      placeholder="Optional (7–30 characters)"
                      className={INPUT_CLASS}
                    />
                    {profileErrors.phone_number && (
                      <p className="mt-1 text-xs text-red-600">
                        {profileErrors.phone_number}
                      </p>
                    )}
                  </div>
                </form>
              )}

              {/* STATUS TAB */}
              {activeTab === "status" && targetUser && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-500">
                      Current Status
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[currentStatusKey] ||
                        "border-zinc-200 bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {STATUS_LABELS[currentStatusKey] || currentStatusKey}
                    </span>
                  </div>

                  {!canModifyTargetAccount && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Only a Super Admin can change the status of a Super
                        Admin account.
                      </span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="target-status" className={LABEL_CLASS}>
                      New Status
                    </label>
                    <select
                      id="target-status"
                      disabled={!canModifyTargetAccount || isMutating}
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setConfirmStatusOpen(false);
                      }}
                      className={INPUT_CLASS}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <p className="mt-2 text-xs text-zinc-500">
                      {STATUS_DESCRIPTIONS[selectedStatus]}
                    </p>
                  </div>

                  {isSelfDeactivate && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        You cannot deactivate or suspend your own account.
                      </span>
                    </div>
                  )}

                  {!confirmStatusOpen ? (
                    <Button
                      type="button"
                      fullWidth
                      disabled={!canSubmitStatus || isMutating}
                      onClick={() => {
                        setActionError("");
                        setActionSuccess("");
                        setConfirmStatusOpen(true);
                      }}
                      className="py-2.5"
                    >
                      Update Status
                    </Button>
                  ) : (
                    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-semibold text-amber-900">
                        Are you sure you want to change status from{" "}
                        <strong>
                          {STATUS_LABELS[currentStatusKey] || currentStatusKey}
                        </strong>{" "}
                        to <strong>{STATUS_LABELS[selectedStatus]}</strong>?
                      </p>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => setConfirmStatusOpen(false)}
                          className="cursor-pointer rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700"
                        >
                          Cancel
                        </button>
                        <Button
                          type="button"
                          disabled={isMutating}
                          onClick={handleUpdateStatus}
                          className="px-4 py-1.5 text-xs"
                        >
                          {isMutating ? "Updating..." : "Confirm Change"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ROLES TAB */}
              {activeTab === "roles" && targetUser && (
                <UserRoleManager
                  userId={userId}
                  initialRoles={targetRoles}
                  onRolesUpdated={() => {
                    loadUser();
                    onUpdated?.();
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Fixed Bottom Footer for Edit Profile */}
        {activeTab === "edit" &&
          !isLoading &&
          !loadError &&
          canModifyTargetAccount && (
            <div className="border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
              <Button
                type="submit"
                form="edit-user-form"
                fullWidth
                disabled={isMutating}
              >
                {isMutating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
