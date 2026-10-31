"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export type SelectOption = {
  _id: string;
  name: string;
};

type Props = {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
};

export default function SearchableMultiSelect({
  label,
  placeholder = "Search...",
  options,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
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
      if (event.key === "Escape") {
        closeDropdown();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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

  function toggleOption(id: string) {
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id],
    );
  }

  function removeOption(id: string) {
    onChange(value.filter((item) => item !== id));
  }

  function clearSelection() {
    onChange([]);
  }

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Label */}
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-800">{label}</label>

        {value.length > 0 && (
          <button
            type="button"
            onClick={clearSelection}
            className="cursor-pointer text-xs font-medium text-zinc-400 transition hover:text-red-500"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          if (open) {
            closeDropdown();
          } else {
            setOpen(true);
          }
        }}
        aria-expanded={open}
        className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-3 text-left transition-all ${
          open
            ? "border-orange-400 ring-4 ring-orange-500/10"
            : "border-zinc-200 hover:border-zinc-300"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
              value.length
                ? "bg-orange-50 text-orange-600"
                : "bg-zinc-100 text-zinc-400"
            }`}
          >
            <Check size={15} />
          </span>

          <span
            className={`truncate text-sm ${
              value.length ? "font-medium text-zinc-800" : "text-zinc-400"
            }`}
          >
            {value.length
              ? `${value.length} ${value.length === 1 ? "item" : "items"} selected`
              : `Select ${label.toLowerCase()}`}
          </span>
        </div>

        <ChevronDown
          size={17}
          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Selected chips */}
      {selectedOptions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option._id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-orange-100 bg-orange-50/70 py-1.5 pl-2.5 pr-1.5 text-xs font-medium text-orange-800"
            >
              <span className="truncate">{option.name}</span>

              <button
                type="button"
                onClick={() => removeOption(option._id)}
                aria-label={`Remove ${option.name}`}
                className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-orange-500 transition hover:bg-orange-100 hover:text-orange-800"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search */}
          <div className="border-b border-zinc-100 p-3">
            <div className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 transition focus-within:border-orange-300 focus-within:bg-white focus-within:ring-3 focus-within:ring-orange-500/10">
              <Search size={16} className="shrink-0 text-zinc-400" />

              <input
                ref={searchRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={placeholder}
                className="h-10 w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="cursor-pointer text-zinc-400 transition hover:text-zinc-700"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between px-0.5">
              <span className="text-[11px] font-medium text-zinc-400">
                {filteredOptions.length}{" "}
                {filteredOptions.length === 1 ? "OPTION" : "OPTIONS"}
              </span>

              <span className="text-[11px] font-medium text-orange-600">
                {value.length} selected
              </span>
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
                    onClick={() => toggleOption(option._id)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      selected ? "bg-orange-50/80" : "hover:bg-zinc-50"
                    }`}
                  >
                    <span
                      className={`min-w-0 truncate text-sm ${
                        selected
                          ? "font-medium text-orange-800"
                          : "text-zinc-700"
                      }`}
                    >
                      {option.name}
                    </span>

                    <span
                      className={`flex size-4.5 shrink-0 items-center justify-center rounded-md border transition ${
                        selected
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-zinc-300 bg-white"
                      }`}
                    >
                      {selected && <Check size={12} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-9 text-center">
                <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                  <Search size={17} />
                </div>

                <p className="text-sm font-medium text-zinc-700">
                  No results found
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  Try searching with a different name.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/70 px-3.5 py-2.5">
            <button
              type="button"
              onClick={clearSelection}
              disabled={value.length === 0}
              className="cursor-pointer text-xs font-medium text-zinc-500 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
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
        </div>
      )}
    </div>
  );
}
