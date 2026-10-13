import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("username" in body) ||
      !("password" in body) ||
      typeof body.username !== "string" ||
      typeof body.password !== "string" ||
      !body.username.trim() ||
      !body.password ||
      body.username.length > 30 ||
      body.password.length > 128
    ) {
      return NextResponse.json(
        { message: "Invalid username or password." },
        { status: 400 },
      );
    }

    const username = body.username.trim().toLowerCase();
    const password = body.password;

    await connectDB();

    const admin = await Admin.findOne({ username }).select("+password");

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { message: "Invalid username or password." },
        { status: 401 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, admin.password);

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid username or password." },
        { status: 401 },
      );
    }

    await createSession({
      adminId: admin._id.toString(),
      role: admin.role,
    });

    return NextResponse.json({
      message: "Login successful.",
      admin: {
        id: admin._id.toString(),
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login failed:", error);

    return NextResponse.json(
      { message: "Unable to log in right now." },
      { status: 500 },
    );
  }
}
