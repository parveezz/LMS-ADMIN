export const COURSE_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all_levels", label: "All Levels" },
];

export const INPUT_CLASS =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-[#163300] focus:ring-2 focus:ring-[#9FE870]/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

export const LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300";

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateCourseForm(
  form,
  { requireSlug = false, requireFee = false } = {}
) {
  const errors = {};

  const courseCode = String(form.course_code ?? "").trim();
  const title = String(form.title ?? "").trim();
  const slug = String(form.slug ?? "").trim();
  const shortDescription = String(form.short_description ?? "").trim();
  const description = String(form.description ?? "").trim();
  const category = String(form.category ?? "").trim();
  const durationHours = String(form.duration_hours ?? "").trim();
  const fee = String(form.fee ?? "").trim();
  const thumbnailUrl = String(form.thumbnail_url ?? "").trim();

  if (!courseCode) {
    errors.course_code = "Course code is required.";
  } else if (courseCode.length < 2 || courseCode.length > 50) {
    errors.course_code = "Course code must be between 2 and 50 characters.";
  } else if (!/^[A-Za-z0-9_-]+$/.test(courseCode)) {
    errors.course_code =
      "Course code can only contain letters, numbers, underscores, and hyphens.";
  }

  if (!title) {
    errors.title = "Course title is required.";
  } else if (title.length < 3 || title.length > 255) {
    errors.title = "Course title must be between 3 and 255 characters.";
  }

  if (requireSlug && !slug) {
    errors.slug = "Slug is required.";
  } else if (slug) {
    if (slug.length < 2 || slug.length > 255) {
      errors.slug = "Slug must be between 2 and 255 characters.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.slug =
        "Slug must contain only lowercase letters, numbers, and single hyphens.";
    }
  }

  if (shortDescription.length > 500) {
    errors.short_description =
      "Short description cannot exceed 500 characters.";
  }

  if (description.length > 10000) {
    errors.description = "Description cannot exceed 10,000 characters.";
  }

  if (category.length > 100) {
    errors.category = "Category cannot exceed 100 characters.";
  }

  if (
    !["beginner", "intermediate", "advanced", "all_levels"].includes(
      form.level
    )
  ) {
    errors.level = "Please select a valid course level.";
  }

  if (durationHours) {
    if (!/^\d+$/.test(durationHours)) {
      errors.duration_hours =
        "Duration must be a whole number between 1 and 5000.";
    } else {
      const parsedDuration = Number(durationHours);
      if (parsedDuration < 1 || parsedDuration > 5000) {
        errors.duration_hours =
          "Duration must be an integer between 1 and 5000.";
      }
    }
  }

  if (requireFee && !fee) {
    errors.fee = "Fee is required (enter 0 for free).";
  } else if (fee) {
    if (!/^\d+(?:\.\d{1,2})?$/.test(fee)) {
      errors.fee =
        "Fee must be a non-negative number with at most 2 decimal places.";
    } else {
      const parsedFee = Number(fee);
      if (parsedFee < 0 || parsedFee > 99999999.99) {
        errors.fee = "Fee must be between 0 and 99,999,999.99.";
      }
    }
  }

  if (thumbnailUrl) {
    if (thumbnailUrl.length > 500) {
      errors.thumbnail_url = "Thumbnail URL cannot exceed 500 characters.";
    } else if (!isValidHttpUrl(thumbnailUrl)) {
      errors.thumbnail_url =
        "Thumbnail URL must be a valid HTTP or HTTPS URL.";
    }
  }

  return errors;
}

export function mapCourseApiErrors(err, fallbackMessage) {
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
      mapped.course_code = err.message;
    } else if (lowerMsg.includes("slug")) {
      mapped.slug = err.message;
    }
  }

  const message =
    err?.status === 0
      ? "Unable to reach the server. Please check your connection and try again."
      : err?.message || fallbackMessage;

  return { fieldErrors: mapped, message };
}
