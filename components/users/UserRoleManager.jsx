"use client";

import { useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiShield, FiTrash2 } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import {
  assignUserRoleApi,
  getUserRolesApi,
  removeUserRoleApi,
  replaceUserRolesApi,
} from "@/lib/userApi";
import { Button } from "@/components/Button";

const ALL_ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin", privileged: true },
  { value: "admin", label: "Admin", privileged: true },
  { value: "staff", label: "Staff", privileged: false },
  { value: "instructor", label: "Instructor", privileged: false },
  { value: "student", label: "Student", privileged: false },
];

const ROLE_LABELS = Object.fromEntries(
  ALL_ROLE_OPTIONS.map((r) => [r.value, r.label])
);

const PRIVILEGED_ROLES = new Set(["admin", "super_admin"]);

export function UserRoleManager({ userId, initialRoles = [], onRolesUpdated }) {
  const { user: actor, hasPermission } = useAuth();
  const isSelf = actor?.id === userId;
  const canManagePrivileged = hasPermission(PERMISSIONS.ROLES_MANAGE);

  const [roles, setRoles] = useState(initialRoles);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Assign role state
  const [assignRole, setAssignRole] = useState("");
  const [assignReason, setAssignReason] = useState("");

  // Remove role confirmation state
  const [confirmRemoveRole, setConfirmRemoveRole] = useState("");
  const [removeReason, setRemoveReason] = useState("");

  // Replace roles state
  const [replaceSelection, setReplaceSelection] = useState(initialRoles);
  const [replaceReason, setReplaceReason] = useState("");
  const [confirmReplace, setConfirmReplace] = useState(false);

  const loadRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const res = await getUserRolesApi(userId);
      const nextRoles = Array.isArray(res?.data?.roles) ? res.data.roles : [];
      setRoles(nextRoles);
      setReplaceSelection(nextRoles);
    } catch (err) {
      setError(err.message || "Failed to load user roles.");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    let active = true;
    getUserRolesApi(userId)
      .then((res) => {
        if (active && Array.isArray(res?.data?.roles)) {
          setRoles(res.data.roles);
          setReplaceSelection(res.data.roles);
        }
      })
      .catch(() => {
        // Initial roles already seeded from user details
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const assignableRoles = ALL_ROLE_OPTIONS.filter(
    (opt) =>
      !roles.includes(opt.value) && (!opt.privileged || canManagePrivileged)
  );

  const effectiveAssignRole = assignableRoles.some(
    (r) => r.value === assignRole
  )
    ? assignRole
    : assignableRoles[0]?.value || "";

  const targetHasPrivileged = roles.some((r) => PRIVILEGED_ROLES.has(r));
  const canReplaceTargetRoles =
    !isSelf && (!targetHasPrivileged || canManagePrivileged);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!effectiveAssignRole || isMutating || isSelf) return;

    setError("");
    setSuccess("");
    setIsMutating(true);
    try {
      const trimmedReason = assignReason.trim();
      await assignUserRoleApi(userId, {
        role: effectiveAssignRole,
        ...(trimmedReason ? { reason: trimmedReason } : {}),
      });
      setAssignReason("");
      setSuccess(
        `Assigned "${ROLE_LABELS[effectiveAssignRole] || effectiveAssignRole}" role.`
      );
      await loadRoles();
      onRolesUpdated?.();
    } catch (err) {
      setError(err.message || "Failed to assign role.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemove = async () => {
    if (!confirmRemoveRole || isMutating || isSelf) return;

    setError("");
    setSuccess("");
    setIsMutating(true);
    try {
      const trimmedReason = removeReason.trim();
      await removeUserRoleApi(
        userId,
        confirmRemoveRole,
        trimmedReason ? { reason: trimmedReason } : undefined
      );
      setSuccess(
        `Removed "${ROLE_LABELS[confirmRemoveRole] || confirmRemoveRole}" role.`
      );
      setConfirmRemoveRole("");
      setRemoveReason("");
      await loadRoles();
      onRolesUpdated?.();
    } catch (err) {
      setError(err.message || "Failed to remove role.");
    } finally {
      setIsMutating(false);
    }
  };

  const toggleReplaceRole = (roleValue) => {
    setReplaceSelection((prev) =>
      prev.includes(roleValue)
        ? prev.filter((r) => r !== roleValue)
        : [...prev, roleValue]
    );
    setConfirmReplace(false);
  };

  const handleReplace = async () => {
    if (replaceSelection.length === 0 || isMutating || !canReplaceTargetRoles) {
      return;
    }

    setError("");
    setSuccess("");
    setIsMutating(true);
    try {
      const trimmedReason = replaceReason.trim();
      await replaceUserRolesApi(userId, {
        roles: replaceSelection,
        ...(trimmedReason ? { reason: trimmedReason } : {}),
      });
      setReplaceReason("");
      setConfirmReplace(false);
      setSuccess("User roles replaced successfully.");
      await loadRoles();
      onRolesUpdated?.();
    } catch (err) {
      setError(err.message || "Failed to replace user roles.");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-5">
      {isSelf && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>You cannot modify your own roles.</span>
        </div>
      )}

      {!isSelf && !canManagePrivileged && (
        <div className="flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <FiShield className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Managing privileged roles (Admin / Super Admin) requires the{" "}
            <code>roles.manage</code> permission.
          </span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <FiCheckCircle className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Current Roles */}
      <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Current Roles
          </h3>
          {isLoadingRoles && (
            <span className="text-xs text-zinc-400">Refreshing...</span>
          )}
        </div>

        {roles.length === 0 ? (
          <p className="text-xs text-zinc-500">No roles assigned.</p>
        ) : (
          <div className="space-y-2">
            {roles.map((roleName) => {
              const isPrivileged = PRIVILEGED_ROLES.has(roleName);
              const isLastRole = roles.length <= 1;
              const disableRemove =
                isSelf ||
                isMutating ||
                isLastRole ||
                (isPrivileged && !canManagePrivileged);

              return (
                <div
                  key={roleName}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/60"
                >
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {ROLE_LABELS[roleName] || roleName}
                  </span>
                  <button
                    type="button"
                    disabled={disableRemove}
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setConfirmRemoveRole(roleName);
                    }}
                    title={
                      isLastRole
                        ? "Cannot remove the last remaining role. Use Replace Roles instead."
                        : isPrivileged && !canManagePrivileged
                          ? "Requires roles.manage permission"
                          : `Remove ${ROLE_LABELS[roleName] || roleName}`
                    }
                    className="inline-flex cursor-pointer items-center gap-1 rounded-sm border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-red-950/40"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirm Remove Box */}
        {confirmRemoveRole && (
          <div className="mt-3 space-y-3 rounded-lg border border-red-200 bg-red-50/70 p-3.5 dark:border-red-900/50 dark:bg-red-950/20">
            <p className="text-xs font-semibold text-red-800 dark:text-red-300">
              Confirm removing{" "}
              <strong>
                {ROLE_LABELS[confirmRemoveRole] || confirmRemoveRole}
              </strong>
              ?
            </p>
            <input
              type="text"
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              maxLength={1000}
              placeholder="Reason (optional)"
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isMutating}
                onClick={() => {
                  setConfirmRemoveRole("");
                  setRemoveReason("");
                }}
                className="cursor-pointer rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={handleRemove}
                className="cursor-pointer rounded-sm bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isMutating ? "Removing..." : "Confirm Remove"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Role */}
      <form
        onSubmit={handleAssign}
        className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Assign Role
        </h3>
        {assignableRoles.length === 0 ? (
          <p className="text-xs text-zinc-500">
            No additional assignable roles available.
          </p>
        ) : (
          <>
            <select
              value={effectiveAssignRole}
              disabled={isSelf || isMutating}
              onChange={(e) => setAssignRole(e.target.value)}
              aria-label="Select role to assign"
              className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary disabled:opacity-60"
            >
              {assignableRoles.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={assignReason}
              disabled={isSelf || isMutating}
              onChange={(e) => setAssignReason(e.target.value)}
              maxLength={1000}
              placeholder="Reason (optional)"
              className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:border-primary disabled:opacity-60"
            />
            <Button
              type="submit"
              fullWidth
              disabled={isSelf || isMutating || !effectiveAssignRole}
              className="py-2.5"
            >
              {isMutating ? "Assigning..." : "Assign Role"}
            </Button>
          </>
        )}
      </form>

      {/* Replace Roles */}
      <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Replace Roles
          </h3>
          <p className="text-xs text-zinc-500">
            Use Replace Roles to switch a user&apos;s sole role to another role.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ALL_ROLE_OPTIONS.map((opt) => {
            const checked = replaceSelection.includes(opt.value);
            const disabled =
              !canReplaceTargetRoles ||
              isMutating ||
              (opt.privileged && !canManagePrivileged);

            return (
              <label
                key={opt.value}
                className={[
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition",
                  disabled
                    ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                    : "cursor-pointer border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleReplaceRole(opt.value)}
                  className="h-3.5 w-3.5 accent-primary-active"
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>

        <input
          type="text"
          value={replaceReason}
          disabled={!canReplaceTargetRoles || isMutating}
          onChange={(e) => setReplaceReason(e.target.value)}
          maxLength={1000}
          placeholder="Reason for role replacement (optional)"
          className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-subtle outline-none focus:border-primary disabled:opacity-60"
        />

        {!confirmReplace ? (
          <Button
            type="button"
            fullWidth
            disabled={
              !canReplaceTargetRoles ||
              isMutating ||
              replaceSelection.length === 0
            }
            onClick={() => {
              setError("");
              setSuccess("");
              setConfirmReplace(true);
            }}
            className="py-2.5"
          >
            Replace Roles
          </Button>
        ) : (
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-900">
              Replace all roles with:{" "}
              {replaceSelection.map((r) => ROLE_LABELS[r] || r).join(", ")}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isMutating}
                onClick={() => setConfirmReplace(false)}
                className="cursor-pointer rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700"
              >
                Cancel
              </button>
              <Button
                type="button"
                disabled={isMutating}
                onClick={handleReplace}
                className="px-4 py-1.5 text-xs"
              >
                {isMutating ? "Updating..." : "Confirm Replace"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
