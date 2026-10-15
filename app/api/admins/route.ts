import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import Admin, { type AdminRole } from "@/models/Admin";

export const runtime = "nodejs";

const roles: AdminRole[] = ["COUNSELLOR", "EDITOR", "MANAGER", "SUPER_ADMIN"];

async function requireSuperAdmin() {
  const current = await getAuthenticatedAdmin();

  if (!current) {
    return {
      admin: null,
      response: NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  if (current.role !== "SUPER_ADMIN") {
    return {
      admin: null,
      response: NextResponse.json(
        { message: "Super Admin access required." },
        { status: 403 },
      ),
    };
  }

  return { admin: current, response: null };
}

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.response) return auth.response;

    await connectDB();

    const admins = await Admin.find({})
      .select("_id username role isActive createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      admins: admins.map((admin) => ({
        id: admin._id.toString(),
        username: admin.username,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to list admins:", error);

    return NextResponse.json(
      { message: "Unable to load admin accounts." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.response) return auth.response;

    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;
    const username =
      typeof data.username === "string"
        ? data.username.trim().toLowerCase()
        : "";
    const password = typeof data.password === "string" ? data.password : "";
    const role = data.role;

    if (
      !/^[a-z0-9.@_-]{3,30}$/.test(username) ||
      password.length < 8 ||
      password.length > 128 ||
      typeof role !== "string" ||
      !roles.includes(role as AdminRole)
    ) {
      return NextResponse.json(
        {
          message:
            "Enter a valid username, a password of 8–128 characters, and a valid role.",
        },
        { status: 400 },
      );
    }

    // The validation above guarantees that role is one of the allowed roles.
    const validatedRole = role as AdminRole;

    await connectDB();

    const existing = await Admin.findOne({ username }).lean();

    if (existing) {
      return NextResponse.json(
        { message: "That username is already in use." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      username,
      password: hashedPassword,
      role: validatedRole,
      isActive: true,
    });

    return NextResponse.json(
      {
        message: "Admin account created.",
        admin: {
          id: admin._id.toString(),
          username: admin.username,
          role: admin.role,
          isActive: admin.isActive,
          createdAt: admin.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { message: "That username is already in use." },
        { status: 409 },
      );
    }

    console.error("Failed to create admin:", error);

    return NextResponse.json(
      { message: "Unable to create admin account." },
      { status: 500 },
    );
  }
}
