"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { IoFilter } from "react-icons/io5";

export function FilterDisclosure({
  items = [],
  selectedId = "",
  onSelect,
  defaultLabel = "Filter",
  triggerIcon,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selectedItem = items.find((item) => item.id === selectedId);

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Closed trigger: pill button with icon and label text */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`Toggle ${defaultLabel} filter`}
        className="flex h-11 cursor-pointer items-center gap-2.5 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        {triggerIcon || <IoFilter className="h-4 w-4 shrink-0" />}

        <span>{selectedItem ? selectedItem.label : defaultLabel}</span>

        {selectedItem && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {selectedItem.icon}
          </span>
        )}
      </button>

      {/* Open dropdown card */}
      {isOpen && (
        <div className="absolute right-0 top-13 z-30 w-64 rounded-3xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-1">
            {items.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect?.(isSelected ? "" : item.id);
                    setIsOpen(false);
                  }}
                  className={[
                    "flex w-full cursor-pointer items-center justify-between rounded-2xl px-3.5 py-2.5 text-left transition",
                    isSelected
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-zinc-400">{item.icon}</span>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </span>

                  <span
                    className={[
                      "flex h-6 w-6 items-center justify-center rounded-full transition",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "border-2 border-zinc-300 dark:border-zinc-600",
                    ].join(" ")}
                  >
                    {isSelected && <FiCheck className="h-3.5 w-3.5" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
