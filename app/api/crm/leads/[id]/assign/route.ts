import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";

import Admin, { AdminRole } from "@/models/Admin";
import Lead from "@/models/Lead";
import { hasPermission } from "@/lib/permissions";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const currentAdmin = await getAuthenticatedAdmin();

    if (!currentAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(currentAdmin.role, "crm:assign")) {
      return NextResponse.json(
        { message: "You do not have permission to assign leads." },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid lead ID." },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || !("assignedTo" in body)) {
      return NextResponse.json(
        { message: "Assigned member is required." },
        { status: 400 },
      );
    }

    const assignedTo = body.assignedTo;

    if (
      assignedTo !== null &&
      (typeof assignedTo !== "string" || !mongoose.isValidObjectId(assignedTo))
    ) {
      return NextResponse.json(
        { message: "Invalid member ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const lead = await Lead.findById(id);

    if (!lead) {
      return NextResponse.json({ message: "Lead not found." }, { status: 404 });
    }

    let targetAdmin = null;

    if (typeof assignedTo === "string") {
      targetAdmin = await Admin.findOne({
        _id: assignedTo,
        isActive: true,
      })
        .select("_id username role")
        .lean();

      if (!targetAdmin) {
        return NextResponse.json(
          {
            message: "This member does not exist or their account is inactive.",
          },
          { status: 400 },
        );
      }

      const allowedRoles: Record<AdminRole, AdminRole[]> = {
        SUPER_ADMIN: ["COUNSELLOR", "EDITOR", "MANAGER", "SUPER_ADMIN"],
        MANAGER: ["COUNSELLOR", "EDITOR", "MANAGER"],
        COUNSELLOR: ["COUNSELLOR"],
        EDITOR: [],
      };

      if (!allowedRoles[currentAdmin.role].includes(targetAdmin.role)) {
        const errorMessages: Record<AdminRole, string> = {
          SUPER_ADMIN: "You cannot assign leads to this member.",
          MANAGER: "Managers cannot assign leads to Super Admins.",
          COUNSELLOR: "Counsellors can only assign leads to other Counsellors.",
          EDITOR: "Editors do not have permission to assign leads.",
        };

        return NextResponse.json(
          { message: errorMessages[currentAdmin.role] },
          { status: 403 },
        );
      }
    }

    const newAssigneeId = targetAdmin
      ? new mongoose.Types.ObjectId(targetAdmin._id.toString())
      : null;

    const currentAssigneeId = lead.assignedTo?.toString() ?? null;
    const nextAssigneeId = newAssigneeId?.toString() ?? null;

    if (currentAssigneeId === nextAssigneeId) {
      return NextResponse.json({
        success: true,
        message: "This lead is already assigned to this member.",
      });
    }

    const assignedAt = new Date();
    const assignedBy = new mongoose.Types.ObjectId(currentAdmin.id);

    const action = newAssigneeId ? "assigned" : "unassigned";

    lead.assignedTo = newAssigneeId;
    lead.assignedBy = assignedBy;
    lead.assignedAt = newAssigneeId ? assignedAt : null;

    lead.assignmentHistory.push({
      assignedTo: newAssigneeId,
      assignedBy,
      assignedAt,
      action,
    });

    await lead.save();

    return NextResponse.json({
      success: true,
      message: newAssigneeId
        ? `Lead assigned to ${targetAdmin?.username}.`
        : "Lead unassigned successfully.",
      assignment: {
        assignedTo: newAssigneeId?.toString() ?? null,
        assignedBy: currentAdmin.id,
        assignedAt: newAssigneeId ? assignedAt : null,
      },
    });
  } catch (error) {
    console.error("Assign lead error:", error);

    return NextResponse.json(
      { message: "Failed to update lead assignment." },
      { status: 500 },
    );
  }
}
