"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Search,
  X,
} from "lucide-react";

interface TimezoneOption {
  value: string;
  label: string;
}

interface TimezoneSelectProps {
  label?: string;
  value: string;
  options: readonly TimezoneOption[];
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
}

const REGION_ORDER = [
  "Europe",
  "Asia",
  "North America",
  "South America",
  "Africa",
  "Oceania",
  "Other",
] as const;

type Region = (typeof REGION_ORDER)[number];

const SOUTH_AMERICAN_TIMEZONES = new Set([
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Argentina/Buenos_Aires",
  "America/Santiago",
  "America/Bogota",
  "America/Lima",
  "America/Caracas",
]);

const REGION_ICONS: Record<Region, string> = {
  Europe: "🌍",
  Asia: "🌏",
  "North America": "🌎",
  "South America": "🌎",
  Africa: "🌍",
  Oceania: "🌏",
  Other: "🌐",
};

function getRegion(timezone: TimezoneOption): Region {
  const { value } = timezone;

  if (value === "UTC") return "Other";
  if (value.startsWith("Europe/")) return "Europe";
  if (value.startsWith("Asia/")) return "Asia";
  if (value.startsWith("Africa/")) return "Africa";
  if (value.startsWith("Australia/") || value.startsWith("Pacific/")) {
    return "Oceania";
  }

  if (SOUTH_AMERICAN_TIMEZONES.has(value)) {
    return "South America";
  }

  if (value.startsWith("America/")) {
    return "North America";
  }

  return "Other";
}

export default function TimezoneSelect({
  label = "Timezone",
  value,
  options,
  onChange,
  required = false,
  placeholder = "Select timezone",
  disabled = false,
  name,
}: TimezoneSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedRegions, setExpandedRegions] = useState<Region[]>([]);

  const selectedOption = options.find((option) => option.value === value);

  const groupedOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = options.filter((option) => {
      if (!query) return true;

      return `${option.label} ${option.value}`.toLowerCase().includes(query);
    });

    const groups = new Map<Region, TimezoneOption[]>();

    for (const region of REGION_ORDER) {
      groups.set(region, []);
    }

    for (const option of filtered) {
      groups.get(getRegion(option))?.push(option);
    }

    return REGION_ORDER.map((region) => ({
      region,
      options: groups.get(region) ?? [],
    })).filter((group) => group.options.length > 0);
  }, [options, search]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus();
    }
  }, [isOpen]);

  const toggleRegion = (region: Region) => {
    setExpandedRegions((current) =>
      current.includes(region)
        ? current.filter((item) => item !== region)
        : [...current, region],
    );
  };

  const handleSelect = (option: TimezoneOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={rootRef} className="relative w-full">
      {label && (
        <label
          className="mb-1.5 block text-sm font-medium text-zinc-700"
          htmlFor={name}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <button
        id={name}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 text-left text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 ${
          isOpen ? "border-zinc-400" : "border-zinc-200"
        } disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60`}
      >
        <span
          className={`min-w-0 truncate ${
            selectedOption ? "text-zinc-800" : "text-zinc-400"
          }`}
        >
          {selectedOption?.label ?? placeholder}
        </span>

        <ChevronDown
          size={17}
          className={`shrink-0 text-zinc-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {required && (
        <input
          type="text"
          tabIndex={-1}
          required
          value={value}
          onChange={() => {}}
          className="pointer-events-none absolute h-px w-px opacity-0"
          aria-hidden="true"
          name={name ? `${name}-validation` : undefined}
        />
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
          <div className="border-b border-zinc-100 p-3">
            <div className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 focus-within:border-zinc-400 focus-within:bg-white">
              <Search size={16} className="shrink-0 text-zinc-400" />

              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setExpandedRegions([]);
                }}
                placeholder="Search city, country or timezone..."
                className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="cursor-pointer text-zinc-400 hover:text-zinc-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <p className="mt-2 text-xs text-zinc-400">
              {groupedOptions.reduce(
                (total, group) => total + group.options.length,
                0,
              )}{" "}
              timezones available
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {groupedOptions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Clock3 className="mx-auto mb-2 h-5 w-5 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-700">
                  No timezones found
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Try searching for another city or country.
                </p>
              </div>
            ) : (
              groupedOptions.map(({ region, options: regionOptions }) => {
                const expanded =
                  Boolean(search.trim()) || expandedRegions.includes(region);

                return (
                  <div key={region} className="mb-1 last:mb-0">
                    <button
                      type="button"
                      onClick={() => toggleRegion(region)}
                      aria-expanded={expanded}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left transition hover:bg-zinc-50"
                    >
                      <span className="text-base">{REGION_ICONS[region]}</span>

                      <span className="flex-1 text-sm font-semibold text-zinc-800">
                        {region}
                      </span>

                      <span className="mr-1 text-xs text-zinc-400">
                        {regionOptions.length}
                      </span>

                      {expanded ? (
                        <ChevronDown size={15} className="text-zinc-400" />
                      ) : (
                        <ChevronRight size={15} className="text-zinc-400" />
                      )}
                    </button>

                    {expanded && (
                      <div className="ml-3 border-l border-zinc-200 pl-2">
                        {regionOptions.map((option) => {
                          const selected = option.value === value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => handleSelect(option)}
                              className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                                selected
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-zinc-700 hover:bg-zinc-50"
                              }`}
                            >
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                  selected
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-zinc-300"
                                }`}
                              >
                                {selected && <Check size={11} />}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">
                                  {option.label}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-zinc-400">
                                  {option.value}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-2.5">
            <p className="text-xs text-zinc-500">
              Timezone rules account for applicable daylight-saving changes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
