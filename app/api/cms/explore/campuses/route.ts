import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/api-auth";
import { revalidatePublicpage } from "@/services/revalidation.service";
import ExploreCampus from "@/models/ExploreCampus";
import { cleanText, validImage } from "@/lib/explore-resource";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    const { response } = await authorizeAdmin();
    if (response) return response;

    await connectDB();

    const campuses = await ExploreCampus.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, campuses });
  } catch (error) {
    console.error("GET campuses:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load campuses." },
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
    const city = cleanText(body.city);
    const country = cleanText(body.country);
    const image = validImage(body.image);

    if (!name || !city || !country || !image) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, city, country and a valid image are required.",
        },
        { status: 400 },
      );
    }

    const campus = await ExploreCampus.create({
      name,
      city,
      country,
      image,
    });

    await revalidatePublicpage();

    return NextResponse.json({ success: true, campus }, { status: 201 });
  } catch (error) {
    console.error("POST campus:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create campus." },
      { status: 500 },
    );
  }
}
