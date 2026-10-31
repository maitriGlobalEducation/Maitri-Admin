import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { authorizeAdmin } from "@/lib/api-auth";

import ExploreInstitute from "@/models/ExploreInstitute";
import ExploreArea from "@/models/ExploreArea";
import ExploreCampus from "@/models/ExploreCampus";
import ExploreBrand from "@/models/ExploreBrand";
import mongoose from "mongoose";

const PAGE_SIZE = 10;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    await connectDB();

    console.log("Mongoose connection:", mongoose.connection.name);
    console.log("Registered models:", mongoose.modelNames());
    console.log("Brand model registered:", mongoose.models.ExploreBrand);

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const search = (searchParams.get("search") ?? "").trim();

    const skip = (page - 1) * PAGE_SIZE;

    const filter: Record<string, unknown> = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      const [matchingAreas, matchingCampuses] = await Promise.all([
        ExploreArea.find({ name: regex }).distinct("_id"),
        ExploreCampus.find({ name: regex }).distinct("_id"),
      ]);

      filter.$or = [
        { name: regex },
        { slug: regex },
        { status: regex },
        { areas: { $in: matchingAreas } },
        { campuses: { $in: matchingCampuses } },
      ];
    }

    console.log("Production model check:", {
      connectionName: mongoose.connection.name,
      registeredModels: mongoose.modelNames(),
      brandModel: !!mongoose.models.ExploreBrand,
      instituteConnection: ExploreInstitute.db.name,
      brandConnection: ExploreBrand.db.name,
    });

    const [institutes, total] = await Promise.all([
      ExploreInstitute.find(filter)
        .select(
          "name slug logo status featured areas brands campuses sortOrder createdAt",
        )
        .populate("areas", "name")
        .populate("brands", "name")
        .populate("campuses", "name city country")
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),

      ExploreInstitute.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      institutes,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        hasNextPage: skip + institutes.length < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("GET paginated institutes error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load institutes." },
      { status: 500 },
    );
  }
}
