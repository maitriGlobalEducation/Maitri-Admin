import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import University from "@/models/University";
import { connectDB } from "@/lib/mongodb";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { admin } = await authorizeAdmin();
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid university ID" },
        { status: 400 },
      );
    }

    const filter = admin ? { _id: id } : { _id: id, status: "published" };

    const university = await University.findOne(filter).lean();

    if (!university) {
      return NextResponse.json(
        { success: false, message: "University not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: university,
    });
  } catch (error) {
    console.error("GET UNIVERSITY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch university" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { response } = await authorizeAdmin();
  if (response) return response;

  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid university ID" },
        { status: 400 },
      );
    }

    const body = await request.json();

    const allowedFields = [
      "name",
      "slug",
      "country",
      "logo",
      "reportLabel",
      "reportYear",
      "title",
      "description",
      "ctaLabel",
      "ctaUrl",
      "status",
    ] as const;

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields provided to update" },
        { status: 400 },
      );
    }

    for (const field of [
      "name",
      "country",
      "title",
      "description",
      "ctaUrl",
    ] as const) {
      if (
        field in updates &&
        (typeof updates[field] !== "string" ||
          !(updates[field] as string).trim())
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} cannot be empty`,
          },
          { status: 400 },
        );
      }

      if (field in updates) {
        updates[field] = (updates[field] as string).trim();
      }
    }

    if (typeof updates.slug === "string") {
      updates.slug = updates.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (!updates.slug) {
        return NextResponse.json(
          { success: false, message: "Slug cannot be empty" },
          { status: 400 },
        );
      }

      const duplicateSlug = await University.findOne({
        slug: updates.slug,
        _id: { $ne: id },
      });

      if (duplicateSlug) {
        return NextResponse.json(
          {
            success: false,
            message: "This university slug already exists",
          },
          { status: 409 },
        );
      }
    }

    if (
      "status" in updates &&
      !["draft", "published"].includes(updates.status as string)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid university status" },
        { status: 400 },
      );
    }

    if ("reportLabel" in updates && typeof updates.reportLabel === "string") {
      updates.reportLabel = updates.reportLabel.trim() || "Report";
    }

    if ("reportYear" in updates) {
      updates.reportYear = String(updates.reportYear ?? "").trim();
    }

    if ("ctaLabel" in updates && typeof updates.ctaLabel === "string") {
      updates.ctaLabel = updates.ctaLabel.trim() || "Go to University Page";
    }

    const university = await University.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!university) {
      return NextResponse.json(
        { success: false, message: "University not found" },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({
      success: true,
      message: "University updated successfully",
      data: university,
    });
  } catch (error) {
    console.error("UPDATE UNIVERSITY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update university" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid university ID" },
        { status: 400 },
      );
    }

    const university = await University.findByIdAndDelete(id);

    if (!university) {
      return NextResponse.json(
        { success: false, message: "University not found" },
        { status: 404 },
      );
    }

    await revalidatePublicpage();

    return NextResponse.json({
      success: true,
      message: "University deleted successfully",
    });
  } catch (error) {
    console.error("DELETE UNIVERSITY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete university" },
      { status: 500 },
    );
  }
}
