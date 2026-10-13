import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import type { AdminRole } from "@/models/Admin";

export async function authorizeAdmin(
  allowedRoles: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"],
) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return {
      admin: null,
      response: NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  if (!allowedRoles.includes(admin.role)) {
    return {
      admin: null,
      response: NextResponse.json(
        { message: "You do not have permission to perform this action." },
        { status: 403 },
      ),
    };
  }

  return {
    admin,
    response: null,
  };
}
