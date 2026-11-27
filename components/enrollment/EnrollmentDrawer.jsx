"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import {
  getEnrollmentBatchHistoryApi,
  getEnrollmentByIdApi,
  updateEnrollmentApi,
  updateEnrollmentBatchApi,
  updateEnrollmentStatusApi,
  updateRegistrationStatusApi,
} from "@/lib/enrollmentApi";
import { Button } from "@/components/Button";
import { FloatingInput } from "@/components/FloatingInput";
import { ENROLLMENT_STATUSES } from "./enrollmentConstants";
import { StatusBadge } from "./StatusBadge";

export function EnrollmentDrawer({ enrollmentId, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState("details"); // "details" | "actions" | "history"
  const [enrollment, setEnrollment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit details state
  const [editForm, setEditForm] = useState({
    student_id: "",
    assigned_staff_id: "",
    total_fee: "",
    notes: "",
  });

  // Actions state
  const [regStatus, setRegStatus] = useState("registered");
  const [enrollStatus, setEnrollStatus] = useState("pending");
  const [dropReason, setDropReason] = useState("");
  const [batchId, setBatchId] = useState("");
  const [batchReason, setBatchReason] = useState("");

  // Batch history state
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const applyEnrollment = useCallback((item) => {
    setEnrollment(item);
    setEditForm({
      student_id: item?.student_id || "",
      assigned_staff_id: item?.assigned_staff_id || "",
      total_fee:
        item?.total_fee !== null && item?.total_fee !== undefined
          ? String(item.total_fee)
          : "",
      notes: item?.notes || "",
    });
    setRegStatus(
      item?.registration_status === "cancelled" ? "cancelled" : "registered"
    );
    setEnrollStatus(item?.enrollment_status || "pending");
    setBatchId(item?.batch_id || "");
  }, []);

  const loadEnrollment = useCallback(async () => {
    if (!enrollmentId) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await getEnrollmentByIdApi(enrollmentId);
      applyEnrollment(res?.data);
    } catch (err) {
      setError(err.message || "Failed to load enrollment details.");
    } finally {
      setIsLoading(false);
    }
  }, [enrollmentId, applyEnrollment]);

  const loadHistory = useCallback(
    async (page = 1) => {
      if (!enrollmentId) return;
      setIsLoadingHistory(true);
      try {
        const res = await getEnrollmentBatchHistoryApi(enrollmentId, {
          page,
          limit: 10,
        });
        setHistory(Array.isArray(res?.data) ? res.data : []);
        setHistoryPagination(
          res?.pagination || { page, totalPages: 1, total: 0 }
        );
      } catch (err) {
        setError(err.message || "Failed to load batch history.");
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [enrollmentId]
  );

  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    let active = true;
    getEnrollmentByIdApi(enrollmentId)
      .then((res) => {
        if (active) {
          applyEnrollment(res?.data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load enrollment details.");
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
  }, [enrollmentId, applyEnrollment]);

  if (!enrollmentId) return null;

  const runAction = async (fn, successMsg) => {
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      await fn();
      setSuccess(successMsg);
      await loadEnrollment();
      onUpdated?.();
    } catch (err) {
      setError(err.message || "Operation failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDetails = (e) => {
    e.preventDefault();
    runAction(
      () =>
        updateEnrollmentApi(enrollmentId, {
          ...(editForm.student_id.trim()
            ? { student_id: editForm.student_id.trim() }
            : {}),
          ...(editForm.assigned_staff_id.trim()
            ? { assigned_staff_id: editForm.assigned_staff_id.trim() }
            : {}),
          ...(editForm.total_fee !== ""
            ? { total_fee: Number(editForm.total_fee) }
            : {}),
          notes: editForm.notes,
        }),
      "Enrollment details updated."
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end overscroll-none bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="flex h-full w-full max-w-xl flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {enrollment?.enrollment_number || "Enrollment Details"}
            </h2>
            <p className="text-xs text-zinc-500">ID: {enrollmentId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="cursor-pointer rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 px-6 text-xs font-semibold dark:border-zinc-800">
          {[
            { id: "details", label: "Details & Edit" },
            { id: "actions", label: "Status & Batch" },
            { id: "history", label: "Batch History" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setActiveTab(tab.id);
                if (tab.id === "history") {
                  loadHistory(historyPage);
                }
              }}
              className={`cursor-pointer border-b-2 px-4 py-3 transition ${activeTab === tab.id
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
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
              {success}
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-zinc-500">Loading details...</p>
          ) : (
            <>
              {enrollment && (
                <div className="mb-6 flex flex-wrap gap-2">
                  <StatusBadge status={enrollment.registration_status} />
                  <StatusBadge status={enrollment.payment_status} />
                  <StatusBadge status={enrollment.enrollment_status} />
                </div>
              )}

              {activeTab === "details" && (
                <form
                  id="edit-enrollment-form"
                  onSubmit={handleSaveDetails}
                  className="space-y-4"
                >
                  <FloatingInput
                    label="Student ID (UUID)"
                    value={editForm.student_id}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, student_id: e.target.value }))
                    }
                  />
                  <FloatingInput
                    label="Assigned Staff ID (UUID)"
                    value={editForm.assigned_staff_id}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        assigned_staff_id: e.target.value,
                      }))
                    }
                  />
                  <FloatingInput
                    label="Total Fee"
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.total_fee}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, total_fee: e.target.value }))
                    }
                  />
                  <div>
                    <textarea
                      rows={3}
                      value={editForm.notes}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, notes: e.target.value }))
                      }
                      placeholder="Notes..."
                      className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9FE870]/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                </form>
              )}

              {activeTab === "actions" && (
                <div className="space-y-6">
                  {/* Registration Status */}
                  <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Registration Status
                    </h3>
                    <div className="flex gap-3">
                      <select
                        value={regStatus}
                        onChange={(e) => setRegStatus(e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                      >
                        <option value="registered">registered</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      <Button
                        type="button"
                        fullWidth
                        disabled={isSaving}
                        onClick={() =>
                          runAction(
                            () =>
                              updateRegistrationStatusApi(enrollmentId, {
                                registration_status: regStatus,
                              }),
                            "Registration status updated."
                          )
                        }
                        className="w-auto px-5"
                      >
                        Update
                      </Button>
                    </div>
                  </div>

                  {/* Lifecycle Status */}
                  <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Enrollment Lifecycle Status
                    </h3>
                    <select
                      value={enrollStatus}
                      onChange={(e) => setEnrollStatus(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                    >
                      {ENROLLMENT_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <FloatingInput
                      label="Drop / Change Reason (optional)"
                      value={dropReason}
                      onChange={(e) => setDropReason(e.target.value)}
                    />
                    <Button
                      type="button"
                      fullWidth
                      disabled={isSaving}
                      onClick={() =>
                        runAction(
                          () =>
                            updateEnrollmentStatusApi(enrollmentId, {
                              enrollment_status: enrollStatus,
                              drop_reason: dropReason.trim() || undefined,
                            }),
                          "Enrollment status updated."
                        )
                      }
                    >
                      Update Lifecycle Status
                    </Button>
                  </div>

                  {/* Batch Assignment */}
                  <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Assign / Transfer / Unassign Batch
                    </h3>
                    <FloatingInput
                      label="Batch ID (UUID, leave empty to unassign)"
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                    />
                    <FloatingInput
                      label="Reason (optional)"
                      value={batchReason}
                      onChange={(e) => setBatchReason(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        fullWidth
                        disabled={isSaving}
                        onClick={() =>
                          runAction(
                            () =>
                              updateEnrollmentBatchApi(enrollmentId, {
                                batch_id: batchId.trim() || null,
                                reason: batchReason.trim() || undefined,
                              }),
                            batchId.trim()
                              ? "Batch updated."
                              : "Batch unassigned."
                          )
                        }
                      >
                        {batchId.trim() ? "Assign / Transfer Batch" : "Unassign Batch"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-4">
                  {isLoadingHistory ? (
                    <p className="text-sm text-zinc-500">
                      Loading batch history...
                    </p>
                  ) : history.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      No batch history recorded yet.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {history.map((entry, idx) => (
                        <li
                          key={entry.id || idx}
                          className="rounded-lg border border-zinc-200 p-3 text-xs dark:border-zinc-800"
                        >
                          <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100">
                            <span>{entry.action || "Batch Change"}</span>
                            <span className="font-normal text-zinc-500">
                              {entry.created_at
                                ? new Date(entry.created_at).toLocaleString()
                                : ""}
                            </span>
                          </div>
                          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                            Batch: {entry.batch_id || "Unassigned"}
                          </p>
                          {entry.reason && (
                            <p className="mt-1 text-zinc-500">
                              Reason: {entry.reason}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {historyPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 text-xs text-zinc-500">
                      <button
                        type="button"
                        disabled={historyPage <= 1 || isLoadingHistory}
                        onClick={() => {
                          const next = historyPage - 1;
                          setHistoryPage(next);
                          loadHistory(next);
                        }}
                        className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-1 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span>
                        Page {historyPagination.page} of{" "}
                        {historyPagination.totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={
                          historyPage >= historyPagination.totalPages ||
                          isLoadingHistory
                        }
                        onClick={() => {
                          const next = historyPage + 1;
                          setHistoryPage(next);
                          loadHistory(next);
                        }}
                        className="cursor-pointer rounded-sm border border-zinc-200 px-3 py-1 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Fixed Bottom Footer for Details & Edit */}
        {activeTab === "details" && !isLoading && (
          <div className="border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Button
              type="submit"
              form="edit-enrollment-form"
              fullWidth
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
