import { NextResponse } from "next/server";
import Event from "@/models/Event";
import { connectDB } from "@/lib/mongodb";
import { authorizeAdmin } from "@/lib/api-auth";
import { getEventInstant, isValidTimezone } from "@/lib/event-time";
import { revalidatePublicpage } from "@/services/revalidation.service";

export async function GET() {
  try {
    const { admin } = await authorizeAdmin();
    await connectDB();

    const filter = admin ? {} : { status: "published" };

    const events = await Event.find(filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("GET EVENTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    await connectDB();

    const body = await request.json();

    const {
      title,
      slug,
      category,
      eventDate,
      eventTime,
      eventTimezone,
      cardImage,
      contentImage,
      content,
      registrationForm,
      metaTitle,
      metaDescription,
      metaKeywords,
      focusKeyword,
      status,
      featured,
    } = body;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Event title is required",
        },
        { status: 400 },
      );
    }

    if (typeof slug !== "string" || !slug.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Event slug is required",
        },
        { status: 400 },
      );
    }

    if (featured !== undefined && typeof featured !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "Featured must be a boolean",
        },
        { status: 400 },
      );
    }

    if (
      typeof eventDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid event date is required (YYYY-MM-DD)",
        },
        { status: 400 },
      );
    }

    // Reject impossible calendar dates such as 2026-02-30.
    const [year, month, day] = eventDate.split("-").map(Number);
    const calendarDate = new Date(Date.UTC(year, month - 1, day));

    if (
      calendarDate.getUTCFullYear() !== year ||
      calendarDate.getUTCMonth() !== month - 1 ||
      calendarDate.getUTCDate() !== day
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid calendar date",
        },
        { status: 400 },
      );
    }

    if (
      typeof eventTime !== "string" ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(eventTime)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid event time is required (HH:mm)",
        },
        { status: 400 },
      );
    }

    if (typeof eventTimezone !== "string" || !isValidTimezone(eventTimezone)) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid event timezone is required",
        },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: "Event content is required",
        },
        { status: 400 },
      );
    }

    const normalizedSlug = slug.trim().toLowerCase();

    const existingEvent = await Event.findOne({
      slug: normalizedSlug,
    });

    if (existingEvent) {
      return NextResponse.json(
        {
          success: false,
          message: "An event with this slug already exists",
        },
        { status: 409 },
      );
    }

    let eventStartsAt: Date;

    try {
      eventStartsAt = getEventInstant(eventDate, eventTime, eventTimezone);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Could not resolve the event date and time for the selected timezone",
        },
        { status: 400 },
      );
    }

    const event = await Event.create({
      title: title.trim(),
      slug: normalizedSlug,
      category,
      // Preserve the admin's original local date and time.
      eventDate,
      eventTime,
      eventTimezone,

      // Store the actual instant for chronological queries.
      eventStartsAt,

      cardImage: cardImage ?? null,
      contentImage: contentImage ?? null,
      content,
      registrationForm: registrationForm ?? { fields: [] },

      metaTitle: metaTitle ?? "",
      metaDescription: metaDescription ?? "",
      metaKeywords: metaKeywords ?? [],
      focusKeyword: focusKeyword ?? "",
      featured: featured ?? false,
      status: status ?? "draft",
    });

    if (featured === true) {
      await Event.updateMany(
        { _id: { $ne: event._id }, featured: true },
        { $set: { featured: false } },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json(
      {
        success: true,
        data: event,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE EVENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create event",
      },
      { status: 500 },
    );
  }
}
