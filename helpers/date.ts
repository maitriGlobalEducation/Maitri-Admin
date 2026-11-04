export function formatDate(date: string | Date): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatted = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(date));

  return `${formatted} (${timezone})`;
}

export function formatDateWithTimezone(date: string | Date) {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: userTimezone,
  }).format(new Date(date));

  return {
    formattedDate,
    timezone: userTimezone,
  };
}
