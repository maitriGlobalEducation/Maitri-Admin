"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

export type StatusType = "published" | "draft";

interface StatusSwitchProps {
  status: StatusType;
  onChange: (status: StatusType) => void | Promise<void>;
  disabled?: boolean;
  size?: "sm" | "md";
}

export default function StatusSwitch({
  status,
  onChange,
  disabled = false,
  size = "md",
}: StatusSwitchProps) {
  const [loading, setLoading] = useState(false);

  const isPublished = status === "published";

  const handleToggle = async () => {
    if (loading || disabled) return;

    const newStatus: StatusType = isPublished ? "draft" : "published";

    setLoading(true);

    try {
      await onChange(newStatus);
    } finally {
      setLoading(false);
    }
  };

  const sizes = {
    sm: {
      wrapper: "h-6 w-11",
      circle: "size-4",
      translate: "translate-x-5",
      icon: "size-3",
    },
    md: {
      wrapper: "h-7 w-12",
      circle: "size-5",
      translate: "translate-x-5",
      icon: "size-3.5",
    },
  };

  const currentSize = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPublished}
      aria-label={`Change status to ${isPublished ? "draft" : "published"}`}
      disabled={disabled || loading}
      onClick={handleToggle}
      className={`
        relative inline-flex ${currentSize.wrapper}
        cursor-pointer
        shrink-0 items-center rounded-full
        transition-colors duration-300
        focus-visible:outline-none focus-visible:ring-4
        focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-60
        ${
          isPublished
            ? "bg-emerald-500 focus-visible:ring-emerald-200"
            : "bg-amber-400 focus-visible:ring-amber-200"
        }
      `}
    >
      <span
        className={`
          absolute left-1 flex ${currentSize.circle}
          items-center justify-center rounded-full
          bg-white shadow-sm
          transition-transform duration-300 ease-in-out
          ${isPublished ? currentSize.translate : "translate-x-0"}
        `}
      >
        {loading && (
          <LoaderCircle
            className={`${currentSize.icon} animate-spin text-zinc-500`}
          />
        )}
      </span>
    </button>
  );
}
