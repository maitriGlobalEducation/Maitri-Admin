import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";
import { connectDB } from "@/lib/mongodb";

import ExploreInstitute from "@/models/ExploreInstitute";

import {
  getInstitutePayload,
  validateInstituteReferences,
} from "@/lib/explore-institute-validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const populateInstitute = (query: any) =>
  query
    .populate("areas", "name")
    .populate("brands", "name")
    .populate("campuses", "name city country");

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid institute ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 },
      );
    }

    const payload = getInstitutePayload(body);

    if (payload.error || !payload.data) {
      return NextResponse.json(
        { success: false, message: payload.error },
        { status: 400 },
      );
    }

    const references = await validateInstituteReferences(body);

    if (references.error || !references.data) {
      return NextResponse.json(
        { success: false, message: references.error },
        { status: 400 },
      );
    }

    const duplicate = await ExploreInstitute.findOne({
      slug: payload.data.slug,
      _id: { $ne: id },
    }).lean();

    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "This slug is already in use." },
        { status: 409 },
      );
    }

    const institute = await populateInstitute(
      ExploreInstitute.findByIdAndUpdate(
        id,
        {
          $set: {
            ...payload.data,
            ...references.data,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      ),
    );

    if (!institute) {
      return NextResponse.json(
        { success: false, message: "Institute not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({
      success: true,
      institute,
    });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        { success: false, message: "This slug is already in use." },
        { status: 409 },
      );
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { success: false, message: "Invalid institute data." },
        { status: 400 },
      );
    }

    console.error("PUT institute error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update institute." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid institute ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const institute = await ExploreInstitute.findByIdAndDelete(id);

    if (!institute) {
      return NextResponse.json(
        { success: false, message: "Institute not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE institute error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete institute." },
      { status: 500 },
    );
  }
}
