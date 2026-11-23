"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  number: string;
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isDirty?: boolean;
}

export default function HomepageSectionCard({
  number,
  title,
  description,
  isOpen,
  onToggle,
  children,
  isDirty = false,
}: Props) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
        isDirty
          ? "border-[#D3B77F] bg-[#FBF8F0] shadow-sm shadow-[#D3B77F]/10"
          : "border-[#E9E5DC] bg-white shadow-sm shadow-[#172C3D]/3 hover:border-[#DCD3C2]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`flex w-full cursor-pointer items-center gap-4 px-5 py-5 text-left transition-colors ${
          isOpen ? "bg-[#F7F5EF]" : "hover:bg-[#FBFAF7]"
        }`}
      >
        {/* Section Number */}
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
            isDirty
              ? "bg-[#B99A5D] text-white"
              : isOpen
                ? "bg-[#172C3D] text-[#D3B77F]"
                : "bg-[#F0EBDD] text-[#9B7D43]"
          }`}
        >
          {number}
        </span>

        {/* Section Details */}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#172C3D] sm:text-[15px]">
            {title}

            {isDirty && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D3A9] bg-[#F7EED9] px-2.5 py-1 text-[10px] font-semibold text-[#92723B]">
                <span className="size-1.5 rounded-full bg-[#B99A5D]" />
                Unsaved changes
              </span>
            )}
          </span>

          <span className="mt-1 block text-xs leading-5 text-[#85847D] sm:text-sm">
            {description}
          </span>
        </span>

        {/* Toggle Icon */}
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isOpen
              ? "bg-[#172C3D] text-[#D3B77F]"
              : "bg-[#F5F3EE] text-[#8C897F]"
          }`}
        >
          {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </span>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div
          className={`border-t p-5 sm:p-6 ${
            isDirty
              ? "border-[#E9DDBF] bg-[#FBF8F0]/70"
              : "border-[#E9E5DC] bg-[#FBFAF7]/70"
          }`}
        >
          {children}
        </div>
      )}
    </section>
  );
}
