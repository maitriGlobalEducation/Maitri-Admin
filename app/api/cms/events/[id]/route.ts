import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Event from "@/models/Event";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/mongodb";
import { authorizeAdmin } from "@/lib/api-auth";

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

    const event = await Event.findByIdAndUpdate(
      id,
      {
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
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

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
