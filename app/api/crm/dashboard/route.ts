import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import Lead from "@/models/Lead";
import { hasPermission } from "@/lib/permissions";

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

  if (
    dates.todayStart >= dates.tomorrowStart ||
    dates.weekStart >= dates.now ||
    dates.todayStart > dates.now
  ) {
    return null;
  }

  return dates as DateRanges;
}

export async function GET(request: NextRequest) {
  try {
    const currentAdmin = await getAuthenticatedAdmin();

    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 },
      );
    }

    if (!hasPermission(currentAdmin.role, "crm:access")) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to access CRM.",
        },
        { status: 403 },
      );
    }

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

    await connectDB();

    const { todayStart, tomorrowStart, weekStart, now } = ranges;

    // Counsellors can only see leads assigned to themselves.
    // Managers and super admins can see all leads.
    const accessFilter =
      currentAdmin.role === "COUNSELLOR"
        ? {
            assignedTo: new mongoose.Types.ObjectId(currentAdmin.id),
          }
        : {};

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

    const [
      totalLeads,
      todayLeads,
      weekLeads,
      totalContacts,
      totalEvents,
      totalScholarships,
      todayContacts,
      todayEvents,
      todayScholarships,
      weekContacts,
      weekEvents,
      weekScholarships,
      recentDocuments,
    ] = await Promise.all([
      Lead.countDocuments(accessFilter),
      Lead.countDocuments({ ...accessFilter, ...todayFilter }),
      Lead.countDocuments({ ...accessFilter, ...weekFilter }),

      Lead.countDocuments({ ...accessFilter, type: "contact" }),
      Lead.countDocuments({ ...accessFilter, type: "event" }),
      Lead.countDocuments({ ...accessFilter, type: "scholarship" }),

      Lead.countDocuments({
        ...accessFilter,
        type: "contact",
        ...todayFilter,
      }),
      Lead.countDocuments({
        ...accessFilter,
        type: "event",
        ...todayFilter,
      }),
      Lead.countDocuments({
        ...accessFilter,
        type: "scholarship",
        ...todayFilter,
      }),

      Lead.countDocuments({
        ...accessFilter,
        type: "contact",
        ...weekFilter,
      }),
      Lead.countDocuments({
        ...accessFilter,
        type: "event",
        ...weekFilter,
      }),
      Lead.countDocuments({
        ...accessFilter,
        type: "scholarship",
        ...weekFilter,
      }),

      Lead.find(accessFilter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(10)
        .select("firstName lastName email type sourceTitle createdAt")
        .lean(),
    ]);

    const recentLeads: RecentLead[] = recentDocuments.map((lead) => ({
      _id: lead._id.toString(),
      name:
        `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "Unknown",
      email: lead.email || "",
      type: lead.type,
      title:
        lead.type === "contact"
          ? "Contact enquiry"
          : lead.sourceTitle ||
            (lead.type === "event"
              ? "Event registration"
              : "Scholarship application"),
      createdAt: lead.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        timezone,

        totalLeads,
        todayLeads,
        weekLeads,

        contacts: totalContacts,
        eventRegistrations: totalEvents,
        scholarshipApplications: totalScholarships,

        breakdown: {
          contacts: {
            total: totalContacts,
            today: todayContacts,
            thisWeek: weekContacts,
          },
          eventRegistrations: {
            total: totalEvents,
            today: todayEvents,
            thisWeek: weekEvents,
          },
          scholarshipApplications: {
            total: totalScholarships,
            today: todayScholarships,
            thisWeek: weekScholarships,
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
