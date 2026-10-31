import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";
import ExploreArea from "@/models/ExploreArea";
import { cleanText, validImage } from "@/lib/explore-resource";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    await connectDB();

    const areas = await ExploreArea.find().sort({ name: 1 }).lean();

    return NextResponse.json({ success: true, areas });
  } catch (error) {
    console.error("GET areas:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load areas." },
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
    const name = cleanText(body.name);
    const image = validImage(body.image);

    if (!name || !image) {
      return NextResponse.json(
        { success: false, message: "Name and a valid image are required." },
        { status: 400 },
      );
    }

    const area = await ExploreArea.create({ name, image });

    await revalidatePublicpage();

    return NextResponse.json({ success: true, area }, { status: 201 });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        { success: false, message: "An area with this name already exists." },
        { status: 409 },
      );
    }

    console.error("POST area:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create area." },
      { status: 500 },
    );
  }
}
