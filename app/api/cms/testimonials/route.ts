import { NextRequest, NextResponse } from "next/server";
import Testimonial from "@/models/Testimonial";
import { connectDB } from "@/lib/mongodb";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";

export async function GET() {
  try {
    await connectDB();

    const testimonials = await Testimonial.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    console.error("GET TESTIMONIALS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch testimonials",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    const body = await request.json();

    const { name, course, university, image, testimonial } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required",
        },
        { status: 400 },
      );
    }

    if (!course?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Course is required",
        },
        { status: 400 },
      );
    }

    if (!university?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "University is required",
        },
        { status: 400 },
      );
    }

    if (!testimonial?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Testimonial is required",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const createdTestimonial = await Testimonial.create({
      name: name.trim(),
      course: course.trim(),
      university: university.trim(),
      image: image ?? null,
      testimonial: testimonial.trim(),
    });

    await revalidatePublicpage();

    return NextResponse.json(
      {
        success: true,
        message: "Testimonial created successfully",
        data: createdTestimonial,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE TESTIMONIAL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create testimonial",
      },
      { status: 500 },
    );
  }
}
