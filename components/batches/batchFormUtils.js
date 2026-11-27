export const INPUT_CLASS =
  "w-full rounded-lg border border-border-default bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-subtle outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60";

export const LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold text-text-secondary";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function validateBatchForm(form, { requireCourse = true } = {}) {
  const errors = {};

  const batchCode = String(form.batch_code ?? "").trim();
  const batchName = String(form.batch_name ?? "").trim();
  const courseId = String(form.course_id ?? "").trim();
  const startDate = String(form.start_date ?? "").trim();
  const endDate = String(form.end_date ?? "").trim();
  const capacityStr = String(form.capacity ?? "").trim();
  const scheduleSummary = String(form.schedule_summary ?? "").trim();
  const description = String(form.description ?? "").trim();

  if (!batchCode) {
    errors.batch_code = "Batch code is required.";
  } else if (batchCode.length < 2 || batchCode.length > 50) {
    errors.batch_code = "Batch code must be between 2 and 50 characters.";
  } else if (!/^[A-Za-z0-9_-]+$/.test(batchCode)) {
    errors.batch_code =
      "Batch code may only contain letters, numbers, hyphens, and underscores.";
  }

  if (!batchName) {
    errors.batch_name = "Batch name is required.";
  } else if (batchName.length < 3 || batchName.length > 255) {
    errors.batch_name = "Batch name must be between 3 and 255 characters.";
  }

  if (requireCourse) {
    if (!courseId) {
      errors.course_id = "Course is required.";
    } else if (!UUID_REGEX.test(courseId)) {
      errors.course_id = "Please select a valid course.";
    }
  }

  if (!startDate) {
    errors.start_date = "Start date is required.";
  } else if (!isValidCalendarDate(startDate)) {
    errors.start_date =
      "Start date must be a valid calendar date in YYYY-MM-DD format.";
  }

  if (endDate) {
    if (!isValidCalendarDate(endDate)) {
      errors.end_date =
        "End date must be a valid calendar date in YYYY-MM-DD format.";
    } else if (startDate && isValidCalendarDate(startDate) && endDate < startDate) {
      errors.end_date = "End date must be on or after the start date.";
    }
  }

  if (capacityStr) {
    if (!/^\d+$/.test(capacityStr)) {
      errors.capacity =
        "Capacity must be a whole number between 1 and 10000.";
    } else {
      const parsedCapacity = Number(capacityStr);
      if (parsedCapacity < 1 || parsedCapacity > 10000) {
        errors.capacity = "Capacity must be between 1 and 10000.";
      }
    }
  }

  if (scheduleSummary.length > 255) {
    errors.schedule_summary =
      "Schedule summary cannot exceed 255 characters.";
  }

  if (description.length > 5000) {
    errors.description = "Description cannot exceed 5000 characters.";
  }

  return errors;
}

export function mapBatchApiErrors(err, fallbackMessage) {
  const mapped = {};
  if (Array.isArray(err?.errors) && err.errors.length > 0) {
    for (const item of err.errors) {
      if (item.field && !mapped[item.field]) {
        mapped[item.field] = item.message;
      }
    }
  }

  if (err?.status === 409 && Object.keys(mapped).length === 0) {
    const lowerMsg = (err.message || "").toLowerCase();
    if (lowerMsg.includes("code")) {
      mapped.batch_code = err.message;
    } else if (lowerMsg.includes("course")) {
      mapped.course_id = err.message;
    }
  }

  const message =
    err?.status === 0
      ? "Unable to reach the server. Please check your connection and try again."
      : err?.message || fallbackMessage;

  return { fieldErrors: mapped, message };
}
