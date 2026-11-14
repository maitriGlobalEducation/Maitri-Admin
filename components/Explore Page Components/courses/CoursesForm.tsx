"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import SearchableMultiSelect, {
  SelectOption,
} from "@/components/cms/explore/SearchableMultiSelect";
import BlogEditor from "@/components/cms/blogs/BlogEditor";
import {
  CourseCampusOfferingInput,
  ExploreCourseInput,
} from "@/types/explore-course";

// Types

export type CourseDurationUnit = "days" | "weeks" | "months" | "years";

export type CourseLanguage = string;
export type CourseIntake = string;
export type ExploreCourseStatus = "draft" | "published";

export interface CourseDuration {
  value: number;
  unit: CourseDurationUnit;
}

export interface CampusOffering {
  campus: string;
  language: CourseLanguage;
  intakes: CourseIntake[];
}

export interface CourseFormValues {
  name: string;
  slug: string;
  courseCategory: string;
  institute: string;
  area: string;
  scholarships: string[];
  fees: string;
  duration: CourseDuration;
  durationFeatures: string;
  campusOfferings: CampusOffering[];
  description: Record<string, unknown>;
  status: ExploreCourseStatus;
}

export interface CourseFormProps {
  form: CourseFormValues;
  setForm: React.Dispatch<React.SetStateAction<ExploreCourseInput>>;

  editingId?: string | null;
  saving?: boolean;

  feeCurrency: string;
  setFeeCurrency: (currency: string) => void;

  categories: SelectOption[];
  institutes: SelectOption[];
  areas: SelectOption[];
  scholarships: SelectOption[];
  campuses: SelectOption[];
  intakeOptions: SelectOption[];

  courseLanguages: CourseLanguage[];

  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onCancelEdit?: () => void;

  onInstituteChange: (institute: string) => void;
}

// ---------- Constants ----------

const CURRENCIES = [
  { value: "USD", label: "USD $" },
  { value: "INR", label: "INR ₹" },
  { value: "EUR", label: "EUR €" },
  { value: "GBP", label: "GBP £" },
  { value: "CAD", label: "CAD $" },
  { value: "AUD", label: "AUD $" },
];

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700";

// ---------- Helpers ----------

const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const emptyOffering: CourseCampusOfferingInput = {
  campus: "",
  intakes: [],
  language: "English",
};

// ---------- Component ----------

export default function CourseForm({
  form,
  setForm,
  editingId,
  saving = false,
  feeCurrency,
  setFeeCurrency,
  categories,
  institutes,
  areas,
  scholarships,
  campuses,
  intakeOptions,
  courseLanguages,
  onSubmit,
  onReset,
  onCancelEdit,
  onInstituteChange,
}: CourseFormProps) {
  const [manualSlug, setManualSlug] = useState(false);

  const updateField = <K extends keyof CourseFormValues>(
    field: K,
    value: CourseFormValues[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateOffering = (
    index: number,
    field: keyof CampusOffering,
    value: string | string[],
  ) => {
    setForm((previous) => ({
      ...previous,
      campusOfferings: previous.campusOfferings.map((offering, i) =>
        i === index ? { ...offering, [field]: value } : offering,
      ),
    }));
  };

  function addOffering() {
    setForm((previous) => ({
      ...previous,
      campusOfferings: [...previous.campusOfferings, { ...emptyOffering }],
    }));
  }

  const removeOffering = (index: number) => {
    setForm((previous) => ({
      ...previous,
      campusOfferings: previous.campusOfferings.filter((_, i) => i !== index),
    }));
  };

  const handleReset = () => {
    setManualSlug(false);
    onReset();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-7 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7"
    >
      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">
          {editingId ? "Edit course" : "Add a course"}
        </h2>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setManualSlug(false);
              onCancelEdit?.();
            }}
            className="cursor-pointer text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Cancel editing
          </button>
        )}
      </div>

      {/* Basic Information */}

      <section className="space-y-4">
        <h3 className="border-b border-zinc-100 pb-2 font-medium text-zinc-800">
          Basic information
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Course Name */}

          <div>
            <label className={labelClass}>
              Course name{" "}
              <span className="text-red-500 italic">(required*)</span>
            </label>

            <input
              required
              className={inputClass}
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;

                setForm((previous) => ({
                  ...previous,
                  name,
                  ...(!manualSlug ? { slug: makeSlug(name) } : {}),
                }));
              }}
              placeholder="Fashion Design"
            />
          </div>

          {/* URL Slug */}

          <div>
            <label className={labelClass}>URL slug</label>

            <input
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className={inputClass}
              value={form.slug}
              onChange={(event) => {
                setManualSlug(true);
                updateField("slug", makeSlug(event.target.value));
              }}
              placeholder="fashion-design"
            />
          </div>

          {/* Course Category */}

          <SearchableMultiSelect
            label="Course category"
            options={categories}
            value={form.courseCategory ? [form.courseCategory] : []}
            onChange={(value: string[]) =>
              updateField("courseCategory", value[0] ?? "")
            }
            placeholder="Search course categories..."
            multiple={false}
            required
          />

          {/* Institute */}

          <SearchableMultiSelect
            label="Institute"
            options={institutes}
            value={form.institute ? [form.institute] : []}
            onChange={(value: string[]) => onInstituteChange(value[0] ?? "")}
            placeholder="Search institutes..."
            multiple={false}
            required
          />

          {/* Area */}

          <SearchableMultiSelect
            label="Area"
            options={areas}
            value={form.area ? [form.area] : []}
            onChange={(value: string[]) => updateField("area", value[0] ?? "")}
            placeholder="Search all areas..."
            multiple={false}
            required
          />

          {/* Scholarships */}

          <SearchableMultiSelect
            label="Scholarships"
            options={scholarships}
            value={form.scholarships}
            onChange={(value: string[]) => updateField("scholarships", value)}
            placeholder="Search scholarships..."
          />
        </div>
      </section>

      {/* Course Fees */}

      <div>
        <label className={labelClass}>
          Course fees <span className="text-red-500 italic">(required*)</span>
        </label>

        <div className="flex h-12 w-full items-center overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10">
          <div className="relative flex h-full shrink-0 items-center bg-zinc-50">
            <select
              value={feeCurrency}
              onChange={(event) => setFeeCurrency(event.target.value)}
              className="h-full cursor-pointer appearance-none bg-transparent py-2 pl-3 pr-7 text-sm font-medium text-zinc-700 outline-none"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>

            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2 text-zinc-400"
            />
          </div>

          <div className="h-6 w-px shrink-0 bg-zinc-200" />

          <input
            type="text"
            inputMode="numeric"
            required
            pattern="[0-9]+"
            className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            value={form.fees}
            onChange={(event) => {
              const value = event.target.value;

              if (/^\d*$/.test(value)) {
                updateField("fees", value);
              }
            }}
            placeholder="Enter course fees"
          />
        </div>
      </div>

      {/* Course Duration */}

      <section className="space-y-4">
        <h3 className="border-b border-zinc-100 pb-2 font-medium text-zinc-800">
          Course duration
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              Duration <span className="text-red-500 italic">(required*)</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                required
                pattern="[0-9]+"
                className={inputClass}
                value={form.duration.value}
                onChange={(event) => {
                  const value = event.target.value;

                  if (/^\d*$/.test(value)) {
                    updateField("duration", {
                      ...form.duration,
                      value: value === "" ? 0 : Number(value),
                    });
                  }
                }}
              />

              <select
                className={`${inputClass} max-w-40`}
                value={form.duration.unit}
                onChange={(event) =>
                  updateField("duration", {
                    ...form.duration,
                    unit: event.target.value as CourseDurationUnit,
                  })
                }
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Duration features</label>

            <input
              className={inputClass}
              value={form.durationFeatures}
              onChange={(event) =>
                updateField("durationFeatures", event.target.value)
              }
              placeholder="e.g. 3 years full-time"
            />
          </div>
        </div>
      </section>

      {/* Campus Offerings */}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-2">
          <h3 className="font-medium text-zinc-800">Campus offerings</h3>

          <button
            type="button"
            onClick={addOffering}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
          >
            <Plus className="size-4" />
            Add campus
          </button>
        </div>

        <div className="space-y-4">
          {form.campusOfferings.map((offering, index) => (
            <div
              key={index}
              className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-800">
                  Campus offering {index + 1}
                </p>

                <button
                  type="button"
                  onClick={() => removeOffering(index)}
                  className="cursor-pointer rounded-md p-1.5 text-red-500 hover:bg-red-50"
                  aria-label={`Remove campus offering ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SearchableMultiSelect
                  label="Campus"
                  options={campuses}
                  value={offering.campus ? [offering.campus] : []}
                  onChange={(value: string[]) =>
                    updateOffering(index, "campus", value[0] ?? "")
                  }
                  placeholder="Search all campuses..."
                  multiple={false}
                />

                <div>
                  <label className={labelClass}>Language *</label>

                  <select
                    required
                    className={inputClass}
                    value={offering.language}
                    onChange={(event) =>
                      updateOffering(index, "language", event.target.value)
                    }
                  >
                    {courseLanguages.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <SearchableMultiSelect
                label="Intake months *"
                options={intakeOptions}
                value={offering.intakes}
                onChange={(value: string[]) =>
                  updateOffering(index, "intakes", value)
                }
                placeholder="Search and select intake months..."
              />
            </div>
          ))}
        </div>
      </section>

      {/* Course Description */}

      <section className="space-y-4">
        <h3 className="border-b border-zinc-100 pb-2 font-medium text-zinc-800">
          Course description{" "}
          <span className="text-red-500 italic">(required*)</span>
        </h3>

        <BlogEditor
          content={form.description}
          onChange={(content: Record<string, unknown>) =>
            updateField("description", content)
          }
        />
      </section>

      {/* Status */}

      <section className="grid gap-4 border-t border-zinc-100 pt-5 md:grid-cols-2">
        <div>
          <label className={labelClass}>Status</label>

          <select
            className={inputClass}
            value={form.status}
            onChange={(event) =>
              updateField("status", event.target.value as ExploreCourseStatus)
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </section>

      {/* Actions */}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : editingId ? "Update course" : "Create course"}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="cursor-pointer rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-50"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
