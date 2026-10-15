import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Testimonial from "@/models/Testimonial";
import cloudinary from "@/lib/cloudinary";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid testimonial ID",
        },
        { status: 400 },
      );
    }

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

    const existingTestimonial = await Testimonial.findById(id);

    if (!existingTestimonial) {
      return NextResponse.json(
        {
          success: false,
          message: "Testimonial not found",
        },
        { status: 404 },
      );
    }

    existingTestimonial.name = name.trim();
    existingTestimonial.course = course.trim();
    existingTestimonial.university = university.trim();
    existingTestimonial.image = image ?? null;
    existingTestimonial.testimonial = testimonial.trim();

    await existingTestimonial.save();

    await revalidatePublicpage();

    return NextResponse.json({
      success: true,
      message: "Testimonial updated successfully",
      data: existingTestimonial,
    });
  } catch (error) {
    console.error("UPDATE TESTIMONIAL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update testimonial",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { response } = await authorizeAdmin();
  if (response) return response;
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid testimonial ID",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return NextResponse.json(
        {
          success: false,
          message: "Testimonial not found",
        },
        { status: 404 },
      );
    }

    const imagePublicId = testimonial.image?.publicId;

    await testimonial.deleteOne();

    if (imagePublicId) {
      try {
        await cloudinary.uploader.destroy(imagePublicId, {
          resource_type: "image",
        });
      } catch (error) {
        console.error("CLOUDINARY TESTIMONIAL IMAGE DELETE ERROR:", error);
      }
    }

    await revalidatePublicpage();

    return NextResponse.json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    console.error("DELETE TESTIMONIAL ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete testimonial",
      },
      { status: 500 },
    );
  }
}
