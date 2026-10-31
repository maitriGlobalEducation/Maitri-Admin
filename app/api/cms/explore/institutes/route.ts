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

const populateInstitute = (query: any) =>
  query
    .populate("areas", "name")
    .populate("brands", "name")
    .populate("campuses", "name city country");

export async function GET() {
  try {
    const { admin } = await authorizeAdmin();

    await connectDB();

    const filter = admin ? {} : { status: "published" };

    const institutes = await populateInstitute(ExploreInstitute.find(filter))
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      institutes,
    });
  } catch (error) {
    console.error("GET institutes error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch institutes." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

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

    const institute = await ExploreInstitute.create({
      ...payload.data,
      ...references.data,
    });

    const populatedInstitute = await populateInstitute(
      ExploreInstitute.findById(institute._id),
    ).lean();

    await revalidatePublicpage();

    return NextResponse.json(
      {
        success: true,
        institute: populatedInstitute,
      },
      { status: 201 },
    );
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "An institute with this slug already exists.",
        },
        { status: 409 },
      );
    }

    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      console.error("Institute validation errors:", validationErrors);

      return NextResponse.json(
        {
          success: false,
          message: "Invalid institute data.",
          errors: validationErrors,
        },
        { status: 400 },
      );
    }

    console.error("POST institute error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create institute." },
      { status: 500 },
    );
  }
}
