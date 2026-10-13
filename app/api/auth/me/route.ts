import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!admin) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true, admin });
  } catch (error) {
    console.error("Fetch current admin failed:", error);

    return NextResponse.json(
      { message: "Unable to fetch admin details." },
      { status: 500 },
    );
  }
}
