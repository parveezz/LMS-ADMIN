import { STATUS_BADGE_STYLES } from "./enrollmentConstants";

export function StatusBadge({ status }) {
  const normalized = (status || "pending").toLowerCase();
  const style =
    STATUS_BADGE_STYLES[normalized] ||
    "bg-zinc-100 text-zinc-700 border-zinc-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {normalized}
    </span>
  );
}
