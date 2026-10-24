import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Event from "@/models/Event";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongodb";
import { authorizeAdmin } from "@/lib/api-auth";
import { getEventInstant, isValidTimezone } from "@/lib/event-time";
import { revalidatePublicpage } from "@/services/revalidation.service";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { admin } = await authorizeAdmin();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const filter = admin ? { _id: id } : { _id: id, status: "published" };

    const event = await Event.findOne(filter).lean();

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("GET EVENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch event",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID",
        },
        { status: 400 },
      );
    }

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
      _id: { $ne: id },
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

    const event = await Event.findByIdAndUpdate(
      id,
      {
        title: title.trim(),
        slug: normalizedSlug,
        category,
        // Preserve the admin's original local date and time.
        eventDate,
        eventTime,
        eventTimezone,

        // Recalculate whenever the event is edited.
        eventStartsAt,

        cardImage: cardImage ?? null,
        contentImage: contentImage ?? null,
        content,
        registrationForm: registrationForm ?? { fields: [] },

        metaTitle: metaTitle ?? "",
        metaDescription: metaDescription ?? "",
        metaKeywords: metaKeywords ?? [],
        focusKeyword: focusKeyword ?? "",
        ...(typeof featured === "boolean" ? { featured } : {}),
        status: status ?? "draft",
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    if (featured === true) {
      await Event.updateMany(
        { _id: { $ne: event._id }, featured: true },
        { $set: { featured: false } },
      );
    }

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found",
        },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("UPDATE EVENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update event",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const event = await Event.findById(id);

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found",
        },
        { status: 404 },
      );
    }

    const publicIds = [
      event.cardImage?.publicId,
      event.contentImage?.publicId,
    ].filter(Boolean);

    const uniquePublicIds = [...new Set(publicIds)];

    await Promise.all(
      uniquePublicIds.map((publicId) => cloudinary.uploader.destroy(publicId)),
    );

    await Event.findByIdAndDelete(id);

    await revalidatePublicpage();

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("DELETE EVENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete event",
      },
      { status: 500 },
    );
  }
}
