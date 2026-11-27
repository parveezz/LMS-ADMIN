"use client";

import { useId, useRef } from "react";

export function OtpInput({
  value = "",
  onChange,
  length = 6,
  label = "Enter 6 digit OTP",
  disabled = false,
}) {
  const id = useId();
  const inputRefs = useRef([]);
  const digits = Array.from({ length }, (_, idx) => value[idx] || "");

  const updateDigit = (index, char) => {
    const nextDigits = [...digits];
    nextDigits[index] = char;
    onChange?.(nextDigits.join(""));
  };

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      updateDigit(index, "");
      return;
    }

    if (raw.length > 1) {
      const pasted = raw.slice(0, length - index).split("");
      const nextDigits = [...digits];
      pasted.forEach((d, offset) => {
        nextDigits[index + offset] = d;
      });
      onChange?.(nextDigits.join(""));
      const nextFocus = Math.min(index + pasted.length, length - 1);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    updateDigit(index, raw);
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index, e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length - index);
    if (!pasted) return;

    const nextDigits = [...digits];
    pasted.split("").forEach((d, offset) => {
      nextDigits[index + offset] = d;
    });
    onChange?.(nextDigits.join(""));
    const nextFocus = Math.min(index + pasted.length, length - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  const renderSlot = (index) => (
    <input
      key={index}
      id={index === 0 ? id : undefined}
      ref={(el) => {
        inputRefs.current[index] = el;
      }}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={1}
      disabled={disabled}
      value={digits[index]}
      onChange={(e) => handleChange(index, e)}
      onKeyDown={(e) => handleKeyDown(index, e)}
      onPaste={(e) => handlePaste(index, e)}
      aria-label={`OTP digit ${index + 1}`}
      className="h-9 w-9 rounded-lg border border-zinc-200/90 bg-zinc-100/80 text-center text-sm font-medium text-zinc-900 shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,1),inset_0px_-1px_0px_0px_rgba(0,0,0,0.05),0px_2px_4px_0px_rgba(0,0,0,0.05)] outline-none transition-all focus:border-[#163300] focus:bg-white focus:ring-2 focus:ring-[#9FE870]/50 disabled:opacity-50"
    />
  );

  return (
    <div className="mx-auto w-fit space-y-2">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-zinc-900">
          {label}
        </label>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">{[0, 1, 2].map(renderSlot)}</div>
        <span aria-hidden="true" className="text-lg text-zinc-500">
          —
        </span>
        <div className="flex gap-1.5">{[3, 4, 5].map(renderSlot)}</div>
      </div>
    </div>
  );
}
