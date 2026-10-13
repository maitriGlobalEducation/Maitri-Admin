import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AdminRole } from "@/models/Admin";
import { connectDB } from "./mongodb";
import Admin from "@/models/Admin";

const COOKIE_NAME = "maitri_admin_session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set to a secret of at least 32 characters",
    );
  }

  return new TextEncoder().encode(secret);
}

export interface AdminSession {
  adminId: string;
  role: AdminRole;
}

export async function createSession(session: AdminSession) {
  const token = await new SignJWT({
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.adminId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (
      typeof payload.sub !== "string" ||
      !["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(payload.role as string)
    ) {
      return null;
    }

    return {
      adminId: payload.sub,
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function hasRole(session: AdminSession, allowedRoles: AdminRole[]) {
  return allowedRoles.includes(session.role);
}

export async function getAuthenticatedAdmin() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  await connectDB();

  const admin = await Admin.findOne({
    _id: session.adminId,
    isActive: true,
  })
    .select("_id username role")
    .lean();

  if (!admin || admin.role !== session.role) {
    return null;
  }

  return {
    id: admin._id.toString(),
    username: admin.username,
    role: admin.role,
  };
}
