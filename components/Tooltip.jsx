"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const TooltipContext = createContext(null);

const SIDE_POSITION_CLASSES = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

const ARROW_POSITION_CLASSES = {
  top: "top-full left-1/2 -mt-1 -translate-x-1/2",
  bottom: "bottom-full left-1/2 -mb-1 -translate-x-1/2",
  left: "left-full top-1/2 -ml-1 -translate-y-1/2",
  right: "right-full top-1/2 -mr-1 -translate-y-1/2",
};

export function Tooltip({
  children,
  side = "top",
  disabled = false,
  delayDuration = 120,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const tooltipId = useId();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const show = () => {
    if (disabled) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, delayDuration);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpen(false);
  };

  return (
    <TooltipContext.Provider
      value={{
        open: disabled ? false : open,
        show,
        hide,
        side,
        disabled,
        tooltipId,
      }}
    >
      <span className={["relative inline-flex", className].filter(Boolean).join(" ")}>
        {children}
      </span>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({ children, asChild = false, className = "" }) {
  const ctx = useContext(TooltipContext);

  const triggerProps = {
    onMouseEnter: (e) => {
      if (isValidElement(children) && typeof children.props?.onMouseEnter === "function") {
        children.props.onMouseEnter(e);
      }
      ctx?.show();
    },
    onMouseLeave: (e) => {
      if (isValidElement(children) && typeof children.props?.onMouseLeave === "function") {
        children.props.onMouseLeave(e);
      }
      ctx?.hide();
    },
    onFocus: (e) => {
      if (isValidElement(children) && typeof children.props?.onFocus === "function") {
        children.props.onFocus(e);
      }
      ctx?.show();
    },
    onBlur: (e) => {
      if (isValidElement(children) && typeof children.props?.onBlur === "function") {
        children.props.onBlur(e);
      }
      ctx?.hide();
    },
    "aria-describedby": ctx?.open ? ctx.tooltipId : undefined,
  };

  if (asChild && isValidElement(children)) {
    return cloneElement(children, triggerProps);
  }

  return (
    <span className={className} {...triggerProps}>
      {children}
    </span>
  );
}

export function TooltipContent({ children, side: sideOverride, className = "" }) {
  const ctx = useContext(TooltipContext);
  if (!ctx || !ctx.open || ctx.disabled) {
    return null;
  }

  const side = sideOverride || ctx.side || "top";
  const positionClass = SIDE_POSITION_CLASSES[side] || SIDE_POSITION_CLASSES.top;
  const arrowClass = ARROW_POSITION_CLASSES[side] || ARROW_POSITION_CLASSES.top;

  return (
    <div
      id={ctx.tooltipId}
      role="tooltip"
      className={[
        "pointer-events-none absolute z-50 w-max max-w-xs rounded-md px-2.5 py-1.5 text-xs font-medium shadow-md",
        "bg-neutral-200 text-neutral-950 dark:bg-neutral-50 dark:text-neutral-950",
        "[&_svg]:bg-neutral-200 [&_svg]:fill-neutral-200 dark:[&_svg]:bg-neutral-50 dark:[&_svg]:fill-neutral-50",
        positionClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 8 8"
        className={["pointer-events-none absolute h-2 w-2 rotate-45", arrowClass].join(" ")}
      >
        <rect width="8" height="8" />
      </svg>
    </div>
  );
}
