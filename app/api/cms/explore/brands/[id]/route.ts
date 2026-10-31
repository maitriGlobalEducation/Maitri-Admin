import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import ExploreBrand from "@/models/ExploreBrand";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";
import { cleanText, validImage } from "@/lib/explore-resource";
import { connectDB } from "@/lib/mongodb";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: Context) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid brand ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const body = await request.json();
    const name = cleanText(body.name);
    const image = validImage(body.image);

    if (!name || !image) {
      return NextResponse.json(
        { success: false, message: "Name and image are required." },
        { status: 400 },
      );
    }

    const brand = await ExploreBrand.findByIdAndUpdate(
      id,
      { $set: { name, image } },
      { new: true, runValidators: true },
    );

    if (!brand) {
      return NextResponse.json(
        { success: false, message: "Brand not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({ success: true, brand });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { success: false, message: "A brand with this name already exists." },
        { status: 409 },
      );
    }

    console.error("UPDATE EXPLORE BRAND ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update brand." },
      { status: 500 },
    );
  }
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid brand ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const brand = await ExploreBrand.findByIdAndDelete(id);

    if (!brand) {
      return NextResponse.json(
        { success: false, message: "Brand not found." },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({
      success: true,
      message: "Brand deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE EXPLORE BRAND ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete brand." },
      { status: 500 },
    );
  }
}
