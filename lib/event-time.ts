import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export const EVENT_TIMEZONES = [
  // Europe
  { value: "Europe/Rome", label: "Italy — Rome" },
  { value: "Europe/London", label: "United Kingdom — London" },
  { value: "Europe/Dublin", label: "Ireland — Dublin" },
  { value: "Europe/Paris", label: "France — Paris" },
  { value: "Europe/Berlin", label: "Germany — Berlin" },
  { value: "Europe/Madrid", label: "Spain — Madrid" },
  { value: "Europe/Lisbon", label: "Portugal — Lisbon" },
  { value: "Europe/Amsterdam", label: "Netherlands — Amsterdam" },
  { value: "Europe/Brussels", label: "Belgium — Brussels" },
  { value: "Europe/Zurich", label: "Switzerland — Zurich" },
  { value: "Europe/Vienna", label: "Austria — Vienna" },
  { value: "Europe/Warsaw", label: "Poland — Warsaw" },
  { value: "Europe/Stockholm", label: "Sweden — Stockholm" },
  { value: "Europe/Oslo", label: "Norway — Oslo" },
  { value: "Europe/Copenhagen", label: "Denmark — Copenhagen" },
  { value: "Europe/Helsinki", label: "Finland — Helsinki" },
  { value: "Europe/Athens", label: "Greece — Athens" },
  { value: "Europe/Istanbul", label: "Turkey — Istanbul" },
  { value: "Europe/Kyiv", label: "Ukraine — Kyiv" },
  { value: "Europe/Moscow", label: "Russia — Moscow" },

  // South Asia
  { value: "Asia/Kolkata", label: "India — Kolkata / New Delhi / Mumbai" },
  { value: "Asia/Karachi", label: "Pakistan — Karachi" },
  { value: "Asia/Dhaka", label: "Bangladesh — Dhaka" },
  { value: "Asia/Kathmandu", label: "Nepal — Kathmandu" },
  { value: "Asia/Colombo", label: "Sri Lanka — Colombo" },

  // Middle East
  { value: "Asia/Dubai", label: "United Arab Emirates — Dubai" },
  { value: "Asia/Riyadh", label: "Saudi Arabia — Riyadh" },
  { value: "Asia/Qatar", label: "Qatar — Doha" },
  { value: "Asia/Muscat", label: "Oman — Muscat" },
  { value: "Asia/Jerusalem", label: "Israel — Jerusalem" },
  { value: "Asia/Amman", label: "Jordan — Amman" },
  { value: "Asia/Tehran", label: "Iran — Tehran" },

  // East and Southeast Asia
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia — Kuala Lumpur" },
  { value: "Asia/Bangkok", label: "Thailand — Bangkok" },
  { value: "Asia/Jakarta", label: "Indonesia — Jakarta" },
  { value: "Asia/Manila", label: "Philippines — Manila" },
  { value: "Asia/Ho_Chi_Minh", label: "Vietnam — Ho Chi Minh City" },
  { value: "Asia/Shanghai", label: "China — Shanghai / Beijing" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Taipei", label: "Taiwan — Taipei" },
  { value: "Asia/Tokyo", label: "Japan — Tokyo" },
  { value: "Asia/Seoul", label: "South Korea — Seoul" },

  // Australia and Pacific
  { value: "Australia/Sydney", label: "Australia — Sydney / Canberra" },
  { value: "Australia/Melbourne", label: "Australia — Melbourne" },
  { value: "Australia/Brisbane", label: "Australia — Brisbane" },
  { value: "Australia/Perth", label: "Australia — Perth" },
  { value: "Australia/Adelaide", label: "Australia — Adelaide" },
  { value: "Australia/Darwin", label: "Australia — Darwin" },
  { value: "Pacific/Auckland", label: "New Zealand — Auckland" },
  { value: "Pacific/Fiji", label: "Fiji" },
  { value: "Pacific/Honolulu", label: "Hawaii — Honolulu" },

  // North America — United States
  { value: "America/New_York", label: "US — Eastern (New York)" },
  { value: "America/Chicago", label: "US — Central (Chicago)" },
  { value: "America/Denver", label: "US — Mountain (Denver)" },
  { value: "America/Phoenix", label: "US — Arizona (Phoenix)" },
  { value: "America/Los_Angeles", label: "US — Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "US — Alaska (Anchorage)" },

  // North America — Canada
  { value: "America/Toronto", label: "Canada — Eastern (Toronto)" },
  { value: "America/Winnipeg", label: "Canada — Central (Winnipeg)" },
  { value: "America/Edmonton", label: "Canada — Mountain (Edmonton)" },
  { value: "America/Vancouver", label: "Canada — Pacific (Vancouver)" },
  { value: "America/Halifax", label: "Canada — Atlantic (Halifax)" },
  { value: "America/St_Johns", label: "Canada — Newfoundland (St. John's)" },

  // Central America and Caribbean
  { value: "America/Mexico_City", label: "Mexico — Mexico City" },
  { value: "America/Cancun", label: "Mexico — Cancún" },
  { value: "America/Costa_Rica", label: "Costa Rica" },
  { value: "America/Panama", label: "Panama" },
  { value: "America/Jamaica", label: "Jamaica" },
  { value: "America/Puerto_Rico", label: "Puerto Rico" },

  // South America
  { value: "America/Sao_Paulo", label: "Brazil — São Paulo" },
  { value: "America/Manaus", label: "Brazil — Manaus" },
  {
    value: "America/Argentina/Buenos_Aires",
    label: "Argentina — Buenos Aires",
  },
  { value: "America/Santiago", label: "Chile — Santiago" },
  { value: "America/Bogota", label: "Colombia — Bogotá" },
  { value: "America/Lima", label: "Peru — Lima" },
  { value: "America/Caracas", label: "Venezuela — Caracas" },

  // Africa
  { value: "Africa/Cairo", label: "Egypt — Cairo" },
  { value: "Africa/Johannesburg", label: "South Africa — Johannesburg" },
  { value: "Africa/Lagos", label: "Nigeria — Lagos" },
  { value: "Africa/Nairobi", label: "Kenya — Nairobi" },
  { value: "Africa/Casablanca", label: "Morocco — Casablanca" },
  { value: "Africa/Accra", label: "Ghana — Accra" },
  { value: "Africa/Addis_Ababa", label: "Ethiopia — Addis Ababa" },

  // Universal
  { value: "UTC", label: "UTC — Coordinated Universal Time" },
] as const;

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts a local event date and time in its chosen timezone
 * into a UTC Date suitable for MongoDB.
 *
 * date: "2026-11-20"
 * time: "19:00"
 * timezone: "Europe/Rome"
 */
export function getEventInstant(
  date: string,
  time: string,
  timezone: string,
): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid event date.");
  }

  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error("Invalid event time.");
  }

  if (!isValidTimezone(timezone)) {
    throw new Error("Please select a valid event timezone.");
  }

  const instant = fromZonedTime(`${date}T${time}:00`, timezone);

  if (Number.isNaN(instant.getTime())) {
    throw new Error("Could not resolve the event date and time.");
  }

  return instant;
}

/**
 * Formats a stored instant in a specified timezone.
 */
export function formatEventTime(
  instant: Date | string,
  timezone: string,
): string {
  return formatInTimeZone(instant, timezone, "d MMM yyyy, h:mm a zzz");
}
