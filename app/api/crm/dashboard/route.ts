import { NextRequest, NextResponse } from "next/server";
import ContactSubmission from "@/models/ContactSubmission";
import EventRegistration from "@/models/EventRegistration";
import ScholarshipApplication from "@/models/ScholarshipApplication";
import { connectDB } from "@/lib/mongodb";

type DateRanges = {
  todayStart: Date;
  tomorrowStart: Date;
  weekStart: Date;
  now: Date;
};

type LeadType = "contact" | "event" | "scholarship";

type RecentLead = {
  _id: string;
  name: string;
  email: string;
  type: LeadType;
  title: string;
  createdAt: Date;
};

// Finds a value in dynamic form fields using possible field names.
function getFieldValue(
  fields: Record<string, unknown> = {},
  possibleNames: string[],
): string {
  const normalizedFields = Object.entries(fields).reduce(
    (result, [key, value]) => {
      result[key.toLowerCase().replace(/[^a-z0-9]/g, "")] = value;
      return result;
    },
    {} as Record<string, unknown>,
  );

  for (const name of possibleNames) {
    const value =
      normalizedFields[name.toLowerCase().replace(/[^a-z0-9]/g, "")];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getFullName(fields: Record<string, unknown> = {}): string {
  const fullName = getFieldValue(fields, [
    "fullName",
    "name",
    "yourName",
    "applicantName",
  ]);

  if (fullName) return fullName;

  const firstName = getFieldValue(fields, [
    "firstName",
    "first_name",
    "firstname",
  ]);

  const lastName = getFieldValue(fields, ["lastName", "last_name", "lastname"]);

  return `${firstName} ${lastName}`.trim() || "Unknown";
}

function getDateRanges(searchParams: URLSearchParams): DateRanges | null {
  const keys = ["todayStart", "tomorrowStart", "weekStart", "now"] as const;

  const dates = {} as Record<(typeof keys)[number], Date>;

  for (const key of keys) {
    const value = searchParams.get(key);

    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    dates[key] = date;
  }

  return dates as DateRanges;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const ranges = getDateRanges(searchParams);
    const timezone = searchParams.get("timezone") || "UTC";

    if (!ranges) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid dashboard date ranges are required.",
        },
        { status: 400 },
      );
    }

    const { todayStart, tomorrowStart, weekStart, now } = ranges;

    const todayFilter = {
      createdAt: {
        $gte: todayStart,
        $lt: tomorrowStart,
      },
    };

    const weekFilter = {
      createdAt: {
        $gte: weekStart,
        $lt: now,
      },
    };

    // Fetch counts and recent submissions in parallel.
    const [
      totalContacts,
      totalEventRegistrations,
      totalScholarshipApplications,

      todayContacts,
      todayEventRegistrations,
      todayScholarshipApplications,

      weekContacts,
      weekEventRegistrations,
      weekScholarshipApplications,

      recentContacts,
      recentEvents,
      recentScholarships,
    ] = await Promise.all([
      ContactSubmission.countDocuments(),
      EventRegistration.countDocuments(),
      ScholarshipApplication.countDocuments(),

      ContactSubmission.countDocuments(todayFilter),
      EventRegistration.countDocuments(todayFilter),
      ScholarshipApplication.countDocuments(todayFilter),

      ContactSubmission.countDocuments(weekFilter),
      EventRegistration.countDocuments(weekFilter),
      ScholarshipApplication.countDocuments(weekFilter),

      ContactSubmission.find().sort({ createdAt: -1 }).limit(10).lean(),

      EventRegistration.find().sort({ createdAt: -1 }).limit(10).lean(),

      ScholarshipApplication.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const totalLeads =
      totalContacts + totalEventRegistrations + totalScholarshipApplications;

    const todayLeads =
      todayContacts + todayEventRegistrations + todayScholarshipApplications;

    const weekLeads =
      weekContacts + weekEventRegistrations + weekScholarshipApplications;

    // Normalize all submission types into one structure.
    const contactLeads: RecentLead[] = recentContacts.map((contact) => ({
      _id: contact._id.toString(),
      name: `${contact.firstName} ${contact.lastName}`.trim() || "Unknown",
      email: contact.email || "",
      type: "contact",
      title: "Contact enquiry",
      createdAt: contact.createdAt,
    }));

    const eventLeads: RecentLead[] = recentEvents.map((registration) => {
      const fields = (registration.fields || {}) as Record<string, unknown>;

      return {
        _id: registration._id.toString(),
        name: getFullName(fields),
        email: getFieldValue(fields, [
          "email",
          "emailAddress",
          "email_address",
        ]),
        type: "event",
        title: registration.eventTitle,
        createdAt: registration.createdAt,
      };
    });

    const scholarshipLeads: RecentLead[] = recentScholarships.map(
      (application) => {
        const fields = (application.fields || {}) as Record<string, unknown>;

        return {
          _id: application._id.toString(),
          name: getFullName(fields),
          email: getFieldValue(fields, [
            "email",
            "emailAddress",
            "email_address",
          ]),
          type: "scholarship",
          title: application.scholarshipTitle,
          createdAt: application.createdAt,
        };
      },
    );

    const recentLeads = [...contactLeads, ...eventLeads, ...scholarshipLeads]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        timezone,

        totalLeads,
        todayLeads,
        weekLeads,

        contacts: totalContacts,
        eventRegistrations: totalEventRegistrations,
        scholarshipApplications: totalScholarshipApplications,

        breakdown: {
          contacts: {
            total: totalContacts,
            today: todayContacts,
            thisWeek: weekContacts,
          },
          eventRegistrations: {
            total: totalEventRegistrations,
            today: todayEventRegistrations,
            thisWeek: weekEventRegistrations,
          },
          scholarshipApplications: {
            total: totalScholarshipApplications,
            today: todayScholarshipApplications,
            thisWeek: weekScholarshipApplications,
          },
        },

        recentLeads,
      },
    });
  } catch (error) {
    console.error("CRM Dashboard API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch CRM dashboard data.",
      },
      { status: 500 },
    );
  }
}
