"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { updateCourseApi } from "@/lib/courseApi";
import { Button } from "@/components/Button";
import {
  COURSE_LEVEL_OPTIONS,
  INPUT_CLASS,
  LABEL_CLASS,
  mapCourseApiErrors,
  validateCourseForm,
} from "@/components/courses/courseFormUtils";

function buildInitialForm(course) {
  return {
    course_code: course?.course_code || "",
    title: course?.title || "",
    slug: course?.slug || "",
    short_description: course?.short_description || "",
    description: course?.description || "",
    category: course?.category || "",
    level: course?.level || "beginner",
    duration_hours:
      course?.duration_hours !== null && course?.duration_hours !== undefined
        ? String(course.duration_hours)
        : "",
    fee:
      course?.fee !== null && course?.fee !== undefined
        ? String(course.fee)
        : "0",
    thumbnail_url: course?.thumbnail_url || "",
  };
}

function normalizeCourseValues(form) {
  const durationStr = String(form.duration_hours ?? "").trim();
  const feeStr = String(form.fee ?? "").trim();

  return {
    course_code: String(form.course_code ?? "").trim().toUpperCase(),
    title: String(form.title ?? "").trim(),
    slug: String(form.slug ?? "").trim(),
    short_description: String(form.short_description ?? "").trim() || null,
    description: String(form.description ?? "").trim() || null,
    category: String(form.category ?? "").trim() || null,
    level: form.level,
    duration_hours: durationStr ? Number(durationStr) : null,
    fee: feeStr ? Number(feeStr) : 0,
    thumbnail_url: String(form.thumbnail_url ?? "").trim() || null,
  };
}

export function EditCourseDrawer({ isOpen, course, onClose, onUpdated }) {
  const initialForm = useMemo(() => buildInitialForm(course), [course]);
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

  if (!isOpen || !course) return null;

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
    const errors = validateCourseForm(form, {
      requireSlug: Boolean(course?.slug),
      requireFee: true,
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const baseline = normalizeCourseValues(initialForm);
    const current = normalizeCourseValues(form);
    const diffPayload = {};

    for (const key of Object.keys(current)) {
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
      const res = await updateCourseApi(course.id, diffPayload);
      onClose?.();
      onUpdated?.(res?.data?.course || null);
    } catch (err) {
      const { fieldErrors: mapped, message } = mapCourseApiErrors(
        err,
        "Failed to update course."
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
      className="fixed inset-0 z-[60] flex justify-end overscroll-none bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-course-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="edit-course-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Edit Course
            </h2>
            <p className="text-xs text-zinc-500">
              Update course metadata and details for {course.course_code}.
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
          id="edit-course-form"
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
              <label htmlFor="edit-course-code" className={LABEL_CLASS}>
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-course-code"
                type="text"
                value={form.course_code}
                onChange={updateField("course_code")}
                placeholder="e.g. CS101"
                className={`${INPUT_CLASS} uppercase`}
              />
              {fieldErrors.course_code && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.course_code}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-course-level" className={LABEL_CLASS}>
                Course Level
              </label>
              <select
                id="edit-course-level"
                value={form.level}
                onChange={updateField("level")}
                className={INPUT_CLASS}
              >
                {COURSE_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldErrors.level && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.level}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="edit-course-title-input" className={LABEL_CLASS}>
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-course-title-input"
              type="text"
              value={form.title}
              onChange={updateField("title")}
              placeholder="e.g. Introduction to Web Development"
              className={INPUT_CLASS}
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-course-slug" className={LABEL_CLASS}>
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-course-slug"
                type="text"
                value={form.slug}
                onChange={updateField("slug")}
                placeholder="e.g. intro-web-dev"
                className={INPUT_CLASS}
              />
              {fieldErrors.slug && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.slug}</p>
              )}
            </div>

            <div>
              <label htmlFor="edit-course-category" className={LABEL_CLASS}>
                Category{" "}
                <span className="font-normal text-zinc-400">(Optional)</span>
              </label>
              <input
                id="edit-course-category"
                type="text"
                value={form.category}
                onChange={updateField("category")}
                placeholder="e.g. Computer Science"
                className={INPUT_CLASS}
              />
              {fieldErrors.category && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.category}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-course-duration" className={LABEL_CLASS}>
                Duration (Hours){" "}
                <span className="font-normal text-zinc-400">(Optional)</span>
              </label>
              <input
                id="edit-course-duration"
                type="number"
                min="1"
                max="5000"
                step="1"
                value={form.duration_hours}
                onChange={updateField("duration_hours")}
                placeholder="e.g. 40"
                className={INPUT_CLASS}
              />
              {fieldErrors.duration_hours && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.duration_hours}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-course-fee" className={LABEL_CLASS}>
                Fee <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-course-fee"
                type="number"
                min="0"
                max="99999999.99"
                step="0.01"
                value={form.fee}
                onChange={updateField("fee")}
                placeholder="0"
                className={INPUT_CLASS}
              />
              {fieldErrors.fee && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.fee}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="edit-course-thumbnail" className={LABEL_CLASS}>
              Thumbnail URL{" "}
              <span className="font-normal text-zinc-400">(Optional)</span>
            </label>
            <input
              id="edit-course-thumbnail"
              type="url"
              value={form.thumbnail_url}
              onChange={updateField("thumbnail_url")}
              placeholder="https://example.com/thumbnail.jpg"
              className={INPUT_CLASS}
            />
            {fieldErrors.thumbnail_url && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.thumbnail_url}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-course-short-description"
              className={LABEL_CLASS}
            >
              Short Description{" "}
              <span className="font-normal text-zinc-400">(Optional)</span>
            </label>
            <textarea
              id="edit-course-short-description"
              rows={2}
              value={form.short_description}
              onChange={updateField("short_description")}
              placeholder="Brief summary of the course (max 500 characters)..."
              className={INPUT_CLASS}
            />
            {fieldErrors.short_description && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.short_description}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="edit-course-description" className={LABEL_CLASS}>
              Full Description{" "}
              <span className="font-normal text-zinc-400">(Optional)</span>
            </label>
            <textarea
              id="edit-course-description"
              rows={4}
              value={form.description}
              onChange={updateField("description")}
              placeholder="Detailed course overview, syllabus, and outcomes..."
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
            form="edit-course-form"
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
