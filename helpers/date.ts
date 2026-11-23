export const formatDateTime = (value: string, timezone: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  const formatted = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);

  return `${formatted} (${timezone})`;
};

export function getDashboardDateRanges() {
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  // Monday is the first day of the week.
  const daysFromMonday = (now.getDay() + 6) % 7;

  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysFromMonday,
  );

  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    todayStart: startOfToday.toISOString(),
    tomorrowStart: startOfTomorrow.toISOString(),
    weekStart: startOfWeek.toISOString(),
    now: now.toISOString(),
  };
}
