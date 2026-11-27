"use client";

import { FiLock } from "react-icons/fi";

export function AccessRestricted({
  title = "Access Restricted",
  message = "You do not have permission to view this section.",
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        <FiLock className="h-5 w-5" />
      </div>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        {message}
      </p>
    </div>
  );
}
