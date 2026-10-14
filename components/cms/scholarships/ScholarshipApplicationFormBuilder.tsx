"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type {
  ScholarshipFieldType,
  ScholarshipFormField,
} from "@/types/scholarship";

interface ScholarshipApplicationFormBuilderProps {
  fields: ScholarshipFormField[];
  onChange: (fields: ScholarshipFormField[]) => void;
}

const fieldTypeLabels: Record<ScholarshipFieldType, string> = {
  text: "Text",
  email: "Email",
  phone: "Phone",
  select: "Select",
  date: "Date",
  checkbox: "Checkbox",
};

const defaultFields: ScholarshipFormField[] = [
  {
    key: "firstName",
    label: "First Name",
    type: "text",
    required: true,
  },
  {
    key: "lastName",
    label: "Last Name",
    type: "text",
    required: true,
  },
  {
    key: "phone",
    label: "Phone",
    type: "phone",
    required: true,
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    required: true,
  },
  {
    key: "country",
    label: "Country",
    type: "select",
    required: true,
    options: [],
  },
];

export default function ScholarshipApplicationFormBuilder({
  fields,
  onChange,
}: ScholarshipApplicationFormBuilderProps) {
  // Track expanded fields by their stable keys.
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // Drafts allow labels and options to be typed without interruption.
  const [labelDrafts, setLabelDrafts] = useState<Record<string, string>>({});
  const [optionDrafts, setOptionDrafts] = useState<Record<string, string>>({});

  // Initialize the five default fields and expand them together.
  useEffect(() => {
    // Empty form: automatically create all five default fields.
    if (fields.length === 0) {
      onChange(
        defaultFields.map((field) => ({
          ...field,
          options: field.options ? [...field.options] : undefined,
        })),
      );

      setExpandedKeys(defaultFields.map((field) => field.key));
      return;
    }

    // Existing fields: expand them all.
    setExpandedKeys((previous) => {
      const allKeys = fields.map((field) => field.key);

      return Array.from(new Set([...previous, ...allKeys]));
    });
  }, [fields, onChange]);

  const addField = () => {
    const key = `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const newField: ScholarshipFormField = {
      key,
      label: "New Field",
      type: "text",
      required: false,
    };

    onChange([...fields, newField]);

    // Automatically open the newly added field.
    setExpandedKeys((previous) => [...previous, key]);
  };

  const updateField = (key: string, updates: Partial<ScholarshipFormField>) => {
    const nextFields = fields.map((field) => {
      if (field.key !== key) return field;

      const updatedField = { ...field, ...updates };

      // Country never supports custom options.
      if (updatedField.key === "country") {
        delete updatedField.options;
      } else if (updates.type && updates.type !== "select") {
        // Remove options when switching away from Select.
        delete updatedField.options;
      }

      // Do not automatically enable custom options when selecting Select.
      return updatedField;
    });

    onChange(nextFields);
  };

  const removeField = (key: string) => {
    onChange(fields.filter((field) => field.key !== key));

    setExpandedKeys((previous) =>
      previous.filter((expandedKey) => expandedKey !== key),
    );

    setLabelDrafts((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });

    setOptionDrafts((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const nextFields = [...fields];

    [nextFields[index], nextFields[targetIndex]] = [
      nextFields[targetIndex],
      nextFields[index],
    ];

    onChange(nextFields);
  };

  const commitLabel = (key: string, currentLabel: string) => {
    const label = labelDrafts[key];

    if (label !== undefined && label !== currentLabel) {
      updateField(key, { label });
    }

    setLabelDrafts((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const commitOptions = (key: string, currentOptions: string[] | undefined) => {
    const draft = optionDrafts[key];

    if (draft !== undefined) {
      const options = draft
        .split("\n")
        .map((option) => option.trim())
        .filter(Boolean);

      if (JSON.stringify(options) !== JSON.stringify(currentOptions ?? [])) {
        updateField(key, { options });
      }
    }

    setOptionDrafts((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => {
        const fieldKey = field.key;
        const isExpanded = expandedKeys.includes(fieldKey);

        const displayedLabel = labelDrafts[fieldKey] ?? field.label;

        const displayedOptions =
          optionDrafts[fieldKey] ?? (field.options ?? []).join("\n");

        return (
          <div
            key={fieldKey}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
          >
            {/* Field header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setExpandedKeys((previous) =>
                    previous.includes(fieldKey)
                      ? previous.filter((key) => key !== fieldKey)
                      : [...previous, fieldKey],
                  );
                }}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-800">
                    {displayedLabel || "Untitled field"}
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-400">
                    {fieldTypeLabels[field.type]}
                    {field.required ? " · Required" : " · Optional"}
                    {field.type === "select"
                      ? ` · ${(field.options ?? []).length} options`
                      : ""}
                  </p>
                </div>

                {isExpanded ? (
                  <ChevronUp
                    size={18}
                    className="ml-auto shrink-0 text-zinc-400"
                  />
                ) : (
                  <ChevronDown
                    size={18}
                    className="ml-auto shrink-0 text-zinc-400"
                  />
                )}
              </button>

              {/* Reorder and delete */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveField(index, "up")}
                  disabled={index === 0}
                  className="cursor-pointer rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Move up"
                  aria-label="Move field up"
                >
                  <ChevronUp size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => moveField(index, "down")}
                  disabled={index === fields.length - 1}
                  className="cursor-pointer rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Move down"
                  aria-label="Move field down"
                >
                  <ChevronDown size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => removeField(fieldKey)}
                  className="cursor-pointer rounded-md p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Remove field"
                  aria-label="Remove field"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Expanded settings: visible automatically for defaults */}
            {isExpanded && (
              <div className="space-y-4 border-t border-zinc-100 bg-zinc-50/50 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Editable label */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                      Field Label
                    </label>

                    <input
                      type="text"
                      value={displayedLabel}
                      onChange={(event) => {
                        setLabelDrafts((previous) => ({
                          ...previous,
                          [fieldKey]: event.target.value,
                        }));
                      }}
                      onBlur={() => commitLabel(fieldKey, field.label)}
                      placeholder="Enter field label"
                      className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400"
                    />
                  </div>

                  {/* Editable field type */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                      Field Type
                    </label>

                    <select
                      value={field.type}
                      onChange={(event) => {
                        updateField(fieldKey, {
                          type: event.target.value as ScholarshipFieldType,
                        });
                      }}
                      className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400"
                    >
                      {Object.entries(fieldTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Editable dropdown options */}
                {field.type === "select" && field.key !== "country" && (
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700">
                      <input
                        type="checkbox"
                        checked={field.options !== undefined}
                        onChange={(event) => {
                          if (event.target.checked) {
                            updateField(fieldKey, { options: [] });
                          } else {
                            updateField(fieldKey, { options: undefined });
                          }

                          setOptionDrafts((previous) => {
                            const next = { ...previous };
                            delete next[fieldKey];
                            return next;
                          });
                        }}
                        className="size-4 cursor-pointer rounded border-zinc-300"
                      />
                      Add custom options
                    </label>

                    {field.options !== undefined && (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                          Select Options
                        </label>

                        <textarea
                          value={displayedOptions}
                          onChange={(event) => {
                            setOptionDrafts((previous) => ({
                              ...previous,
                              [fieldKey]: event.target.value,
                            }));
                          }}
                          onBlur={() => commitOptions(fieldKey, field.options)}
                          rows={4}
                          placeholder={"Option 1\nOption 2\nOption 3"}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                        />

                        <p className="mt-1.5 text-xs text-zinc-400">
                          Enter one option per line.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Required toggle */}
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) => {
                      updateField(fieldKey, {
                        required: event.target.checked,
                      });
                    }}
                    className="size-4 cursor-pointer rounded border-zinc-300"
                  />
                  Required field
                </label>
              </div>
            )}
          </div>
        );
      })}

      {/* Add more fields below the existing fields */}
      <button
        type="button"
        onClick={addField}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 text-sm font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-800"
      >
        <Plus size={17} />
        Add Application Field
      </button>
    </div>
  );
}
