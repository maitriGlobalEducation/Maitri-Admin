import type { CRMRecord } from "@/components/crm/CRMRecordsTable";

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value instanceof Date) {
    return value.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.map(formatValue).join(", ");
    }

    return JSON.stringify(value);
  }

  return String(value);
}

export function formatDate(value: unknown): string {
  if (!value) return "Unknown date";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatFields(
  fields: Record<string, unknown> | null | undefined,
) {
  if (!fields) return [];

  return Object.entries(fields).map(([key, value]) => ({
    label: key
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^./, (character) => character.toUpperCase()),
    value: formatValue(value),
  }));
}

export function toCRMRecord(
  id: string,
  title: string,
  subtitle: string,
  date: unknown,
  values: CRMRecord["values"],
): CRMRecord {
  return {
    id,
    title,
    subtitle,
    date: formatDate(date),
    values,
  };
}
