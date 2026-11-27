export function Button({
  children,
  className = "",
  type = "button",
  fullWidth = false,
  ...props
}) {
  const hasWidthClass = /\bw-/.test(className);
  const widthClass = hasWidthClass ? "" : fullWidth ? "w-full" : "w-fit";

  return (
    <button
      type={type}
      className={[
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm bg-[#9FE870] px-4 py-3 text-sm font-semibold text-[#163300] transition-all hover:bg-[#8ee05a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        widthClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
