export function formatDate(date: string | Date): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatted = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(date));

  return `${formatted} (${timezone})`;
}

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
