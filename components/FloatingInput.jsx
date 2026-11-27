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
          "peer w-full rounded-lg border border-border-default bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-colors",
          "focus:border-primary focus:ring-2 focus:ring-primary/40",
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
            ? "-top-2.5 left-3 bg-surface px-1 text-xs"
            : "top-3 text-sm text-text-subtle",
          focused ? "text-brand-accent font-medium" : isFloating ? "text-text-muted" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label}
      </label>
    </div>
  );
}
