export const REGISTRATION_STATUSES = ["pending", "registered", "cancelled"];

export const PAYMENT_STATUSES = [
  "unpaid",
  "partial",
  "paid",
  "overdue",
  "refunded",
];

export const ENROLLMENT_STATUSES = [
  "pending",
  "confirmed",
  "deferred",
  "dropped",
  "withdrawn",
  "completed",
];

export const STATUS_BADGE_STYLES = {
  // Neutral / Pending
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  deferred: "bg-zinc-100 text-zinc-700 border-zinc-200",
  unpaid: "bg-zinc-100 text-zinc-700 border-zinc-200",

  // Positive
  registered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-[#9FE870]/30 text-[#163300] border-[#9FE870]",

  // Negative / Warning
  cancelled: "bg-red-50 text-red-700 border-red-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  dropped: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-orange-50 text-orange-700 border-orange-200",
  refunded: "bg-sky-50 text-sky-700 border-sky-200",
};
