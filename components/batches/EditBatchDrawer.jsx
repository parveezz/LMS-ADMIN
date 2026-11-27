"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { updateBatchApi } from "@/lib/batchApi";
import { Button } from "@/components/Button";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  mapBatchApiErrors,
  validateBatchForm,
} from "@/components/batches/batchFormUtils";

const EDITABLE_FIELDS = [
  "batch_code",
  "batch_name",
  "capacity",
  "start_date",
  "end_date",
  "schedule_summary",
  "description",
];

function buildInitialForm(batch) {
  return {
    batch_code: batch?.batch_code || "",
    batch_name: batch?.batch_name || "",
    capacity:
      batch?.capacity !== null && batch?.capacity !== undefined
        ? String(batch.capacity)
        : "",
    start_date: batch?.start_date || "",
    end_date: batch?.end_date || "",
    schedule_summary: batch?.schedule_summary || "",
    description: batch?.description || "",
  };
}

function normalizeBatchValues(form) {
  const capacityStr = String(form.capacity ?? "").trim();
  const endDateStr = String(form.end_date ?? "").trim();
  const scheduleSummary = String(form.schedule_summary ?? "").trim();
  const description = String(form.description ?? "").trim();

  return {
    batch_code: String(form.batch_code ?? "").trim().toUpperCase(),
    batch_name: String(form.batch_name ?? "").trim(),
    capacity: capacityStr ? Number(capacityStr) : null,
    start_date: String(form.start_date ?? "").trim(),
    end_date: endDateStr || null,
    schedule_summary: scheduleSummary || null,
    description: description || null,
  };
}

export function EditBatchDrawer({ isOpen, batch, onClose, onUpdated }) {
  const initialForm = useMemo(() => buildInitialForm(batch), [batch]);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onCloseRef = useRef(onClose);
  const isSubmittingRef = useRef(isSubmitting);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (e) => {
      if (e.key === "Escape" && !isSubmittingRef.current) {
        e.stopPropagation();
        onCloseRef.current?.();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!isOpen || !batch) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setFieldErrors({});
    setApiError("");
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
    const errors = validateBatchForm(form, { requireCourse: false });

    const capacityStr = String(form.capacity ?? "").trim();
    if (
      !errors.capacity &&
      capacityStr &&
      typeof batch.enrolled_count === "number" &&
      Number(capacityStr) < batch.enrolled_count
    ) {
      errors.capacity = `Capacity cannot be less than currently enrolled active count (${batch.enrolled_count}).`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const baseline = normalizeBatchValues(initialForm);
    const current = normalizeBatchValues(form);
    const diffPayload = {};

    for (const key of EDITABLE_FIELDS) {
      if (current[key] !== baseline[key]) {
        diffPayload[key] = current[key];
      }
    }

    if (Object.keys(diffPayload).length === 0) {
      setApiError("No changes detected. Modify at least one field to save.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateBatchApi(batch.id, diffPayload);
      onClose?.();
      onUpdated?.(res?.data?.batch || null);
    } catch (err) {
      const { fieldErrors: mapped, message } = mapBatchApiErrors(
        err,
        "Failed to update batch."
      );
      if (Object.keys(mapped).length > 0) {
        setFieldErrors(mapped);
      }
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const courseLabel =
    batch.course_code && batch.course_title
      ? `${batch.course_code} — ${batch.course_title}`
      : batch.course_title || batch.course_code || "—";

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end overscroll-none bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-batch-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="edit-batch-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Edit Batch
            </h2>
            <p className="text-xs text-zinc-500">
              Update batch details for {batch.batch_code}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close edit drawer"
            className="cursor-pointer rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50 dark:hover:bg-zinc-800"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="edit-batch-form"
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

          <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Course (Read-Only)
            </span>
            <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {courseLabel}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-batch-code" className={LABEL_CLASS}>
                Batch Code <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-batch-code"
                type="text"
                disabled={isSubmitting}
                value={form.batch_code}
                onChange={updateField("batch_code")}
                placeholder="e.g. BATCH-2026-A"
                className={`${INPUT_CLASS} uppercase`}
              />
              {fieldErrors.batch_code && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.batch_code}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-batch-capacity" className={LABEL_CLASS}>
                Capacity{" "}
                <span className="font-normal text-zinc-400">
                  (Blank = Unlimited)
                </span>
              </label>
              <input
                id="edit-batch-capacity"
                type="number"
                min="1"
                max="10000"
                step="1"
                disabled={isSubmitting}
                value={form.capacity}
                onChange={updateField("capacity")}
                placeholder="Unlimited"
                className={INPUT_CLASS}
              />
              {fieldErrors.capacity && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.capacity}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="edit-batch-name" className={LABEL_CLASS}>
              Batch Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-batch-name"
              type="text"
              disabled={isSubmitting}
              value={form.batch_name}
              onChange={updateField("batch_name")}
              placeholder="e.g. Web Development Morning Cohort"
              className={INPUT_CLASS}
            />
            {fieldErrors.batch_name && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.batch_name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-batch-start-date" className={LABEL_CLASS}>
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-batch-start-date"
                type="date"
                disabled={isSubmitting}
                value={form.start_date}
                onChange={updateField("start_date")}
                className={INPUT_CLASS}
              />
              {fieldErrors.start_date && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.start_date}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-batch-end-date" className={LABEL_CLASS}>
                End Date{" "}
                <span className="font-normal text-zinc-400">(Optional)</span>
              </label>
              <input
                id="edit-batch-end-date"
                type="date"
                min={form.start_date || undefined}
                disabled={isSubmitting}
                value={form.end_date}
                onChange={updateField("end_date")}
                className={INPUT_CLASS}
              />
              {fieldErrors.end_date && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.end_date}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="edit-batch-schedule" className={LABEL_CLASS}>
              Schedule Summary{" "}
              <span className="font-normal text-zinc-400">(Optional)</span>
            </label>
            <input
              id="edit-batch-schedule"
              type="text"
              disabled={isSubmitting}
              value={form.schedule_summary}
              onChange={updateField("schedule_summary")}
              placeholder="e.g. Mon, Wed, Fri • 09:00 AM – 11:00 AM"
              className={INPUT_CLASS}
            />
            {fieldErrors.schedule_summary && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.schedule_summary}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="edit-batch-description" className={LABEL_CLASS}>
              Description{" "}
              <span className="font-normal text-zinc-400">(Optional)</span>
            </label>
            <textarea
              id="edit-batch-description"
              rows={4}
              disabled={isSubmitting}
              value={form.description}
              onChange={updateField("description")}
              placeholder="Cohort notes, room details, or expectations..."
              className={INPUT_CLASS}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.description}
              </p>
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
            form="edit-batch-form"
            disabled={isSubmitting}
            className="px-6 py-2.5"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
