"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowRight, FiSearch } from "react-icons/fi";

export function CommandSearch({
  value = "",
  onChange,
  items = [],
  placeholder = "Search enrollment number or notes...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filteredItems = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.section && item.section.toLowerCase().includes(q))
    );
  }, [items, value]);

  const groupedSections = useMemo(() => {
    const map = new Map();
    filteredItems.forEach((item) => {
      const section = item.section || "Suggestions";
      if (!map.has(section)) map.set(section, []);
      map.get(section).push(item);
    });
    return Array.from(map.entries());
  }, [filteredItems]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen || filteredItems.length === 0) {
      if (e.key === "ArrowDown") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + filteredItems.length) % filteredItems.length
      );
    } else if (e.key === "Enter" && filteredItems[activeIndex]) {
      e.preventDefault();
      filteredItems[activeIndex].action?.();
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  let runningIndex = -1;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <FiSearch className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-400" />

        <input
          ref={inputRef}
          type="search"
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange?.(e.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border-default bg-surface py-2 pl-10 pr-16 text-sm text-text-primary placeholder:text-text-subtle shadow-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
        />

        <kbd className="pointer-events-none absolute right-2.5 hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-500 sm:inline-block dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          ⌘ K
        </kbd>
      </div>

      {isOpen && groupedSections.length > 0 && (
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {groupedSections.map(([section, sectionItems]) => (
            <div key={section} className="mb-2 last:mb-0">
              <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {section}
              </div>
              <div className="space-y-0.5">
                {sectionItems.map((item) => {
                  runningIndex += 1;
                  const idx = runningIndex;
                  const isActive = idx === activeIndex;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => {
                        item.action?.();
                        setIsOpen(false);
                      }}
                      className={[
                        "flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition",
                        isActive
                          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                          : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-zinc-400">
                          {item.icon || <FiArrowRight className="h-3.5 w-3.5" />}
                        </span>
                        <span>{item.title}</span>
                      </span>

                      {item.shortcut && (
                        <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
