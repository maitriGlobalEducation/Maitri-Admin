"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  number: string;
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  isDirty?: boolean;
}

export default function HomepageSectionCard({
  number,
  title,
  description,
  defaultOpen = false,
  children,
  isDirty = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section
      className={`overflow-hidden rounded-xl border shadow-sm transition-all duration-200 ${
        isDirty ? "border-amber-400 bg-amber-50/50" : "border-zinc-200 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition hover:bg-zinc-50"
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
            isDirty ? "bg-amber-500 text-white" : "bg-zinc-900 text-white"
          }`}
        >
          {number}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 font-semibold text-zinc-900">
            {title}

            {isDirty && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Unsaved changes
              </span>
            )}
          </span>

          <span className="mt-1 block text-sm text-zinc-500">
            {description}
          </span>
        </span>

        {isOpen ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-zinc-500" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-zinc-500" />
        )}
      </button>

      {isOpen && (
        <div
          className={`border-t p-4 sm:p-6 ${
            isDirty
              ? "border-amber-200 bg-amber-50/30"
              : "border-zinc-200 bg-zinc-50/50"
          }`}
        >
          {children}
        </div>
      )}
    </section>
  );
}
