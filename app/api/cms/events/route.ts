import { NextResponse } from "next/server";
import Event from "@/models/Event";
import { connectDB } from "@/lib/mongodb";
import { authorizeAdmin } from "@/lib/api-auth";

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
      eventDate,
      eventTime,
      cardImage,
      contentImage,
      content,
      registrationForm,
      metaTitle,
      metaDescription,
      metaKeywords,
      focusKeyword,
      status,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Event title is required",
        },
        { status: 400 },
      );
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Event slug is required",
        },
        { status: 400 },
      );
    }

    if (!eventDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Event date is required",
        },
        { status: 400 },
      );
    }

    if (!eventTime?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Event time is required",
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

    const existingEvent = await Event.findOne({
      slug: slug.trim().toLowerCase(),
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

    const event = await Event.create({
      title: title.trim(),
      slug: slug.trim().toLowerCase(),

      eventDate: new Date(eventDate),
      eventTime: eventTime.trim(),

      cardImage: cardImage ?? null,
      contentImage: contentImage ?? null,

      content,

      registrationForm: registrationForm ?? {
        fields: [],
      },

      metaTitle: metaTitle ?? "",
      metaDescription: metaDescription ?? "",
      metaKeywords: metaKeywords ?? [],
      focusKeyword: focusKeyword ?? "",

      status: status ?? "draft",
    });

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
