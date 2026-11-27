"use client";

import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { createCourseApi } from "@/lib/courseApi";
import { Button } from "@/components/Button";
import {
  COURSE_LEVEL_OPTIONS,
  INPUT_CLASS,
  LABEL_CLASS,
  mapCourseApiErrors,
  validateCourseForm,
} from "@/components/courses/courseFormUtils";

const INITIAL_FORM = {
  course_code: "",
  title: "",
  slug: "",
  short_description: "",
  description: "",
  category: "",
  level: "beginner",
  duration_hours: "",
  fee: "0",
  thumbnail_url: "",
};

export function CreateCourseDrawer({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
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
    const errors = validateCourseForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const courseCode = form.course_code.trim().toUpperCase();
      const title = form.title.trim();
      const slug = form.slug.trim();
      const shortDescription = form.short_description.trim();
      const description = form.description.trim();
      const category = form.category.trim();
      const durationStr = String(form.duration_hours ?? "").trim();
      const feeStr = String(form.fee ?? "").trim();
      const thumbnailUrl = form.thumbnail_url.trim();

      const payload = {
        course_code: courseCode,
        title,
        level: form.level,
        fee: feeStr ? Number(feeStr) : 0,
        short_description: shortDescription || null,
        description: description || null,
        category: category || null,
        duration_hours: durationStr ? Number(durationStr) : null,
        thumbnail_url: thumbnailUrl || null,
        ...(slug ? { slug } : {}),
      };

      const res = await createCourseApi(payload);
      resetState();
      onClose?.();
      onCreated?.(res?.data?.course || null);
    } catch (err) {
      const { fieldErrors: mapped, message } = mapCourseApiErrors(
        err,
        "Failed to create course."
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
      aria-labelledby="create-course-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="create-course-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Create Course
            </h2>
            <p className="text-xs text-zinc-500">
              Add a new course in draft status.
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
          id="create-course-form"
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
              <label htmlFor="create-course-code" className={LABEL_CLASS}>
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                id="create-course-code"
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
              <label htmlFor="create-course-level" className={LABEL_CLASS}>
                Course Level
              </label>
              <select
                id="create-course-level"
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
            <label htmlFor="create-course-title-input" className={LABEL_CLASS}>
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              id="create-course-title-input"
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
              <label htmlFor="create-course-slug" className={LABEL_CLASS}>
                Slug <span className="font-normal text-zinc-400">(Optional)</span>
              </label>
              <input
                id="create-course-slug"
                type="text"
                value={form.slug}
                onChange={updateField("slug")}
                placeholder="Auto-generated if omitted"
                className={INPUT_CLASS}
              />
              {fieldErrors.slug && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.slug}</p>
              )}
            </div>

            <div>
              <label htmlFor="create-course-category" className={LABEL_CLASS}>
                Category{" "}
                <span className="font-normal text-zinc-400">(Optional)</span>
              </label>
              <input
                id="create-course-category"
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
              <label htmlFor="create-course-duration" className={LABEL_CLASS}>
                Duration (Hours){" "}
                <span className="font-normal text-zinc-400">(Optional)</span>
              </label>
              <input
                id="create-course-duration"
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
              <label htmlFor="create-course-fee" className={LABEL_CLASS}>
                Fee{" "}
                <span className="font-normal text-zinc-400">(Optional)</span>
              </label>
              <input
                id="create-course-fee"
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
            <label htmlFor="create-course-thumbnail" className={LABEL_CLASS}>
              Thumbnail URL{" "}
              <span className="font-normal text-zinc-400">(Optional)</span>
            </label>
            <input
              id="create-course-thumbnail"
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
              htmlFor="create-course-short-description"
              className={LABEL_CLASS}
            >
              Short Description{" "}
              <span className="font-normal text-zinc-400">(Optional)</span>
            </label>
            <textarea
              id="create-course-short-description"
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
            <label htmlFor="create-course-description" className={LABEL_CLASS}>
              Full Description{" "}
              <span className="font-normal text-zinc-400">(Optional)</span>
            </label>
            <textarea
              id="create-course-description"
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
            form="create-course-form"
            disabled={isSubmitting}
            className="px-6 py-2.5"
          >
            {isSubmitting ? "Creating..." : "Create Course"}
          </Button>
        </div>
      </div>
    </div>
  );
}
