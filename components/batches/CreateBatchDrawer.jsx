"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiRefreshCw, FiX } from "react-icons/fi";
import { createBatchApi } from "@/lib/batchApi";
import { Button } from "@/components/Button";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  mapBatchApiErrors,
  validateBatchForm,
} from "@/components/batches/batchFormUtils";

const INITIAL_FORM = {
  batch_code: "",
  batch_name: "",
  course_id: "",
  capacity: "",
  start_date: "",
  end_date: "",
  schedule_summary: "",
  description: "",
};

export function CreateBatchDrawer({
  isOpen,
  onClose,
  onCreated,
  courses = [],
  isLoadingCourses = false,
  coursesError = "",
  hasMoreCourses = false,
  onLoadMoreCourses,
  onRetryCourses,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onCloseRef = useRef(onClose);
  const isSubmittingRef = useRef(isSubmitting);

  const selectableCourses = useMemo(
    () =>
      courses.filter(
        (course) => (course.status || "").toLowerCase() !== "archived"
      ),
    [courses]
  );

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    if (!isOpen) return undefined;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape" && !isSubmittingRef.current) {
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
    const errors = validateBatchForm(form, { requireCourse: true });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const capacityStr = String(form.capacity ?? "").trim();
      const endDateStr = String(form.end_date ?? "").trim();
      const scheduleSummary = String(form.schedule_summary ?? "").trim();
      const description = String(form.description ?? "").trim();

      const payload = {
        batch_code: form.batch_code.trim().toUpperCase(),
        batch_name: form.batch_name.trim(),
        course_id: form.course_id.trim(),
        start_date: form.start_date.trim(),
        end_date: endDateStr || null,
        capacity: capacityStr ? Number(capacityStr) : null,
        schedule_summary: scheduleSummary || null,
        description: description || null,
      };

      const res = await createBatchApi(payload);
      resetState();
      onClose?.();
      onCreated?.(res?.data?.batch || null);
    } catch (err) {
      const { fieldErrors: mapped, message } = mapBatchApiErrors(
        err,
        "Failed to create batch."
      );
      if (Object.keys(mapped).length > 0) {
        setFieldErrors(mapped);
      }
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end overscroll-none bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-batch-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="create-batch-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Create Batch
            </h2>
            <p className="text-xs text-zinc-500">
              Add a new course batch in draft status.
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
          id="create-batch-form"
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="create-batch-code" className={LABEL_CLASS}>
                Batch Code <span className="text-red-500">*</span>
              </label>
              <input
                id="create-batch-code"
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
              <label htmlFor="create-batch-capacity" className={LABEL_CLASS}>
                Capacity{" "}
                <span className="font-normal text-zinc-400">
                  (Optional — blank = Unlimited)
                </span>
              </label>
              <input
                id="create-batch-capacity"
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
            <label htmlFor="create-batch-name" className={LABEL_CLASS}>
              Batch Name <span className="text-red-500">*</span>
            </label>
            <input
              id="create-batch-name"
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

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="create-batch-course"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Course <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {coursesError && (
                  <button
                    type="button"
                    onClick={onRetryCourses}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                  >
                    <FiRefreshCw className="h-3 w-3" />
                    <span>Retry courses</span>
                  </button>
                )}
                {hasMoreCourses && !coursesError && (
                  <button
                    type="button"
                    disabled={isLoadingCourses}
                    onClick={onLoadMoreCourses}
                    className="cursor-pointer text-xs font-medium text-brand-accent hover:underline disabled:opacity-50"
                  >
                    {isLoadingCourses ? "Loading..." : "Load more courses"}
                  </button>
                )}
              </div>
            </div>
            <select
              id="create-batch-course"
              disabled={
                isSubmitting || (isLoadingCourses && selectableCourses.length === 0)
              }
              value={form.course_id}
              onChange={updateField("course_id")}
              className={INPUT_CLASS}
            >
              <option value="">
                {isLoadingCourses && selectableCourses.length === 0
                  ? "Loading courses..."
                  : "Select a course..."}
              </option>
              {selectableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_code
                    ? `${course.course_code} — ${course.title}`
                    : course.title}
                </option>
              ))}
            </select>
            {coursesError && (
              <p className="mt-1 text-xs text-red-600">{coursesError}</p>
            )}
            {fieldErrors.course_id && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.course_id}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="create-batch-start-date" className={LABEL_CLASS}>
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="create-batch-start-date"
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
              <label htmlFor="create-batch-end-date" className={LABEL_CLASS}>
                End Date{" "}
                <span className="font-normal text-zinc-400">(Optional)</span>
              </label>
              <input
                id="create-batch-end-date"
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
            <label htmlFor="create-batch-schedule" className={LABEL_CLASS}>
              Schedule Summary{" "}
              <span className="font-normal text-zinc-400">(Optional)</span>
            </label>
            <input
              id="create-batch-schedule"
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
            <label htmlFor="create-batch-description" className={LABEL_CLASS}>
              Description{" "}
              <span className="font-normal text-zinc-400">(Optional)</span>
            </label>
            <textarea
              id="create-batch-description"
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
            form="create-batch-form"
            disabled={isSubmitting}
            className="px-6 py-2.5"
          >
            {isSubmitting ? "Creating..." : "Create Batch"}
          </Button>
        </div>
      </div>
    </div>
  );
}
