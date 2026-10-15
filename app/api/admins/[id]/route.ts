import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import Admin, { type AdminRole } from "@/models/Admin";

export const runtime = "nodejs";

const roles: AdminRole[] = ["COUNSELLOR", "EDITOR", "MANAGER", "SUPER_ADMIN"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function authorize() {
  const current = await getAuthenticatedAdmin();

  if (!current) {
    return {
      current: null,
      response: NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  if (current.role !== "SUPER_ADMIN") {
    return {
      current: null,
      response: NextResponse.json(
        { message: "Super Admin access required." },
        { status: 403 },
      ),
    };
  }

  return { current, response: null };
}

async function getTarget(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Admin.findById(id);
}

async function wouldRemoveLastSuperAdmin(
  targetId: string,
  nextRole: AdminRole,
  nextActive: boolean,
) {
  if (nextRole === "SUPER_ADMIN" && nextActive) return false;

  const activeSuperAdmins = await Admin.countDocuments({
    role: "SUPER_ADMIN",
    isActive: true,
  });

  const target = await Admin.findById(targetId).select("role isActive");

  return Boolean(
    target?.role === "SUPER_ADMIN" && target.isActive && activeSuperAdmins <= 1,
  );
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;

    const { id } = await params;
    await connectDB();

    const target = await getTarget(id);

    if (!target) {
      return NextResponse.json(
        { message: "Admin account not found." },
        { status: 404 },
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    const username =
      data.username === undefined
        ? target.username
        : typeof data.username === "string"
          ? data.username.trim().toLowerCase()
          : "";

    const role = data.role === undefined ? target.role : data.role;

    const isActive =
      data.isActive === undefined ? target.isActive : data.isActive;

    const password = data.password;

    if (
      !/^[a-z0-9.@_-]{3,30}$/.test(username) ||
      typeof role !== "string" ||
      !roles.includes(role as AdminRole) ||
      typeof isActive !== "boolean" ||
      (password !== undefined &&
        (typeof password !== "string" ||
          password.length < 8 ||
          password.length > 128))
    ) {
      return NextResponse.json(
        { message: "One or more account fields are invalid." },
        { status: 400 },
      );
    }

    if (auth.current!.id === id && (role !== "SUPER_ADMIN" || !isActive)) {
      return NextResponse.json(
        {
          message:
            "You cannot deactivate or change the role of your own Super Admin account.",
        },
        { status: 400 },
      );
    }

    if (await wouldRemoveLastSuperAdmin(id, role as AdminRole, isActive)) {
      return NextResponse.json(
        {
          message: "At least one active Super Admin account must remain.",
        },
        { status: 400 },
      );
    }

    target.username = username;
    target.role = role as AdminRole;
    target.isActive = isActive;

    if (typeof password === "string" && password.length > 0) {
      target.password = await bcrypt.hash(password, 12);
    }

    await target.save();

    return NextResponse.json({
      message: "Admin account updated.",
      admin: {
        id: target._id.toString(),
        username: target.username,
        role: target.role,
        isActive: target.isActive,
        createdAt: target.createdAt,
      },
    });
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

    console.error("Failed to update admin:", error);

    return NextResponse.json(
      { message: "Unable to update admin account." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;

    const { id } = await params;

    if (auth.current!.id === id) {
      return NextResponse.json(
        { message: "You cannot delete your own account." },
        { status: 400 },
      );
    }

    await connectDB();

    const target = await getTarget(id);

    if (!target) {
      return NextResponse.json(
        { message: "Admin account not found." },
        { status: 404 },
      );
    }

    if (await wouldRemoveLastSuperAdmin(id, target.role, false)) {
      return NextResponse.json(
        {
          message: "At least one active Super Admin account must remain.",
        },
        { status: 400 },
      );
    }

    await target.deleteOne();

    return NextResponse.json({
      message: "Admin account deleted.",
    });
  } catch (error) {
    console.error("Failed to delete admin:", error);

    return NextResponse.json(
      { message: "Unable to delete admin account." },
      { status: 500 },
    );
  }
}
