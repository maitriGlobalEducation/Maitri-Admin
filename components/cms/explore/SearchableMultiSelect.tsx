"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface SelectOption {
  _id: string;
  name: string;
  slug?: string;
  [key: string]: unknown;
}

type ScholarshipRecord = {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
};

type Props = {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  required?: boolean;
};

export default function SearchableMultiSelect({
  label,
  placeholder = "Search...",
  options,
  value,
  onChange,
  multiple = true,
  required,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOptions = useMemo(
    () => options.filter((option) => value.includes(option._id)),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return options;

    return options.filter((option) =>
      option.name.toLowerCase().includes(query),
    );
  }, [options, search]);

  function closeDropdown() {
    setOpen(false);
    setSearch("");
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeDropdown();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  function handleOptionClick(id: string) {
    if (multiple) {
      onChange(
        value.includes(id)
          ? value.filter((item) => item !== id)
          : [...value, id],
      );
      return;
    }

    onChange([id]);
    closeDropdown();
  }

  function clearSelection() {
    onChange([]);
  }

  const selectedLabel = selectedOptions.map((option) => option.name).join(", ");

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">
          {label}{" "}
          {required && <span className="text-red-500 italic">(required*)</span>}
        </label>

        {value.length > 0 && (
          <button
            type="button"
            onClick={clearSelection}
            className="cursor-pointer text-xs font-medium text-zinc-400 transition hover:text-amber-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Trigger */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => (open ? closeDropdown() : setOpen(true))}
        className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-3 text-left transition-all ${
          open
            ? "border-amber-500 ring-4 ring-amber-500/10"
            : "border-zinc-200 hover:border-zinc-400"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
              value.length
                ? "bg-zinc-900 text-amber-400"
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {multiple ? <Check size={15} /> : <Search size={15} />}
          </span>

          <span
            className={`truncate text-sm ${
              value.length ? "font-medium text-zinc-900" : "text-zinc-400"
            }`}
          >
            {multiple
              ? value.length
                ? `${value.length} selected`
                : `Select ${label.toLowerCase()}`
              : selectedLabel || `Select ${label.toLowerCase()}`}
          </span>
        </span>

        <ChevronDown
          size={17}
          className={`shrink-0 text-zinc-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Selected chips — only for multi-select */}
      {multiple && selectedOptions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option._id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-amber-300/60 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-zinc-800"
            >
              <span className="truncate">{option.name}</span>

              <button
                type="button"
                onClick={() =>
                  onChange(value.filter((item) => item !== option._id))
                }
                aria-label={`Remove ${option.name}`}
                className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition hover:bg-amber-200 hover:text-zinc-900"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-black/10">
          {/* Search */}
          <div className="border-b border-zinc-100 bg-zinc-50/80 p-3">
            <div className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 focus-within:border-amber-500 focus-within:ring-3 focus-within:ring-amber-500/10">
              <Search size={16} className="shrink-0 text-zinc-400" />

              <input
                ref={searchRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={placeholder}
                className="h-10 w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="cursor-pointer text-zinc-400 hover:text-zinc-800"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wide text-zinc-400">
                {filteredOptions.length}{" "}
                {filteredOptions.length === 1 ? "OPTION" : "OPTIONS"}
              </span>

              {multiple && (
                <span className="text-[11px] font-semibold text-amber-700">
                  {value.length} selected
                </span>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto p-1.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const selected = value.includes(option._id);

                return (
                  <button
                    key={option._id}
                    type="button"
                    onClick={() => handleOptionClick(option._id)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      selected
                        ? "bg-amber-50 text-zinc-900"
                        : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <span
                      className={`min-w-0 truncate text-sm ${
                        selected ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {option.name}
                    </span>

                    {/* Indicator only for multi-select */}
                    {multiple ? (
                      <span
                        className={`flex size-4.5 shrink-0 items-center justify-center rounded border transition ${
                          selected
                            ? "border-zinc-900 bg-zinc-900 text-amber-400"
                            : "border-zinc-300 bg-white"
                        }`}
                      >
                        {selected && <Check size={12} strokeWidth={3} />}
                      </span>
                    ) : (
                      selected && (
                        <Check
                          size={16}
                          className="shrink-0 text-amber-600"
                          strokeWidth={2.5}
                        />
                      )
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <Search size={18} className="mx-auto mb-2 text-zinc-400" />
                <p className="text-sm font-medium text-zinc-700">
                  No results found
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Try searching with a different name.
                </p>
              </div>
            )}
          </div>

          {/* Footer only for multi-select */}
          {multiple && (
            <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-3.5 py-2.5">
              <button
                type="button"
                onClick={clearSelection}
                disabled={value.length === 0}
                className="cursor-pointer text-xs font-medium text-zinc-500 transition hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear selection
              </button>

              <button
                type="button"
                onClick={closeDropdown}
                className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
