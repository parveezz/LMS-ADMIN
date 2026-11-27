"use client";

import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { createEnrollmentApi } from "@/lib/enrollmentApi";
import { Button } from "@/components/Button";

const INITIAL_FORM = {
  inquiry_id: "",
  course_id: "",
  student_id: "",
  batch_id: "",
  total_fee: "",
  assigned_staff_id: "",
  notes: "",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-[#163300] focus:ring-2 focus:ring-[#9FE870]/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300";

export function CreateEnrollmentModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
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

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        inquiry_id: form.inquiry_id.trim(),
        course_id: form.course_id.trim(),
        ...(form.student_id.trim()
          ? { student_id: form.student_id.trim() }
          : {}),
        ...(form.batch_id.trim() ? { batch_id: form.batch_id.trim() } : {}),
        ...(form.total_fee !== ""
          ? { total_fee: Number(form.total_fee) }
          : {}),
        ...(form.assigned_staff_id.trim()
          ? { assigned_staff_id: form.assigned_staff_id.trim() }
          : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      };

      await createEnrollmentApi(payload);
      setForm(INITIAL_FORM);
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create enrollment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end overscroll-none bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-enrollment-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2
              id="create-enrollment-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Create Enrollment
            </h2>
            <p className="text-xs text-zinc-500">
              Create a new student enrollment record.
            </p>
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col justify-between overflow-y-auto overscroll-contain p-6"
        >
          <div className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="create-inquiry-id" className={LABEL_CLASS}>
                Inquiry ID (UUID) <span className="text-red-500">*</span>
              </label>
              <input
                id="create-inquiry-id"
                type="text"
                required
                value={form.inquiry_id}
                onChange={updateField("inquiry_id")}
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="create-course-id" className={LABEL_CLASS}>
                Course ID (UUID) <span className="text-red-500">*</span>
              </label>
              <input
                id="create-course-id"
                type="text"
                required
                value={form.course_id}
                onChange={updateField("course_id")}
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440001"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="create-student-id" className={LABEL_CLASS}>
                Student ID (UUID)
              </label>
              <input
                id="create-student-id"
                type="text"
                value={form.student_id}
                onChange={updateField("student_id")}
                placeholder="Optional student UUID"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="create-batch-id" className={LABEL_CLASS}>
                Batch ID (UUID)
              </label>
              <input
                id="create-batch-id"
                type="text"
                value={form.batch_id}
                onChange={updateField("batch_id")}
                placeholder="Optional batch UUID"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="create-total-fee" className={LABEL_CLASS}>
                Total Fee
              </label>
              <input
                id="create-total-fee"
                type="number"
                min="0"
                step="any"
                value={form.total_fee}
                onChange={updateField("total_fee")}
                placeholder="0.00"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="create-staff-id" className={LABEL_CLASS}>
                Assigned Staff ID (UUID)
              </label>
              <input
                id="create-staff-id"
                type="text"
                value={form.assigned_staff_id}
                onChange={updateField("assigned_staff_id")}
                placeholder="Optional staff UUID"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="create-notes" className={LABEL_CLASS}>
                Notes
              </label>
              <textarea
                id="create-notes"
                rows={3}
                value={form.notes}
                onChange={updateField("notes")}
                placeholder="Additional enrollment notes..."
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-sm border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <Button type="submit" disabled={isSubmitting} className="px-6">
              {isSubmitting ? "Creating..." : "Create Enrollment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
