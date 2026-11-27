"use client";

import { useId, useState } from "react";

export function FloatingInput({
  label,
  id,
  className = "",
  value,
  defaultValue,
  onFocus,
  onBlur,
  onChange,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [focused, setFocused] = useState(false);
  const [uncontrolledHasValue, setUncontrolledHasValue] = useState(
    Boolean(defaultValue)
  );

  const isControlled = value !== undefined;
  const hasValue = isControlled
    ? String(value).length > 0
    : uncontrolledHasValue;
  const isFloating = focused || hasValue;

  return (
    <div className="relative">
      <input
        id={inputId}
        value={value}
        defaultValue={defaultValue}
        placeholder=" "
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          if (!isControlled) {
            setUncontrolledHasValue(e.target.value !== "");
          }
          onBlur?.(e);
        }}
        onChange={(e) => {
          if (!isControlled) {
            setUncontrolledHasValue(e.target.value !== "");
          }
          onChange?.(e);
        }}
        className={[
          "peer w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-colors",
          "focus:border-[#163300] focus:ring-2 focus:ring-[#9FE870]/40",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      <label
        htmlFor={inputId}
        className={[
          "pointer-events-none absolute left-4 transition-all duration-200",
          isFloating
            ? "-top-2.5 left-3 bg-white px-1 text-xs"
            : "top-3 text-sm text-zinc-400",
          focused ? "text-[#163300] font-medium" : isFloating ? "text-zinc-600" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label}
      </label>
    </div>
  );
}
