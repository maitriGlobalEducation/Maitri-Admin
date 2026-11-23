import type { AdminRole } from "@/models/Admin";

export type Permission =
  | "crm:access"
  | "crm:view-all-leads"
  | "crm:view-my-leads"
  | "crm:download"
  | "crm:assign"
  | "cms:access"
  | "cms:edit"
  | "admin:manage";

const permissions: Record<AdminRole, Permission[]> = {
  COUNSELLOR: ["crm:access", "crm:view-my-leads"],

  EDITOR: ["cms:access", "cms:edit"],

  MANAGER: [
    "crm:access",
    "crm:view-all-leads",
    "crm:view-my-leads",
    "crm:download",
    "crm:assign",
    "cms:access",
    "cms:edit",
  ],

  SUPER_ADMIN: [
    "crm:access",
    "crm:view-all-leads",
    "crm:view-my-leads",
    "crm:download",
    "crm:assign",
    "cms:access",
    "cms:edit",
    "admin:manage",
  ],
};

export function hasPermission(
  role: AdminRole,
  permission: Permission,
): boolean {
  return permissions[role].includes(permission);
}

export const ADMIN_ROLE_OPTIONS = [
  {
    value: "COUNSELLOR",
    label: "Counsellor",
    description: "CRM access and assigned leads only",
  },
  {
    value: "EDITOR",
    label: "Editor",
    description: "CMS access and content editing",
  },
  {
    value: "MANAGER",
    label: "Manager",
    description: "Full CRM access, lead assignment, and CMS editing",
  },
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Full access",
  },
] as const;

export const ROLE_STYLES: Record<AdminRole, string> = {
  COUNSELLOR: "border-blue-200 bg-blue-50 text-blue-700",

  EDITOR: "border-amber-200 bg-amber-50 text-amber-700",

  MANAGER: "border-teal-200 bg-teal-50 text-teal-700",

  SUPER_ADMIN: "border-purple-200 bg-purple-50 text-purple-800",
};
