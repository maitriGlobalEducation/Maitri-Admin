import type { AdminRole } from "@/models/Admin";

export type Permission =
  | "crm:access"
  | "crm:download"
  | "crm:assign"
  | "cms:access"
  | "cms:edit"
  | "admin:manage";

const permissions: Record<AdminRole, Permission[]> = {
  COUNSELLOR: ["crm:access"],
  EDITOR: ["cms:access", "cms:edit"],
  MANAGER: [
    "crm:access",
    "crm:download",
    "crm:assign",
    "cms:access",
    "cms:edit",
  ],
  SUPER_ADMIN: [
    "crm:access",
    "crm:download",
    "crm:assign",
    "cms:access",
    "cms:edit",
    "admin:manage",
  ],
};

export function hasPermission(role: AdminRole, permission: Permission) {
  return permissions[role].includes(permission);
}

export const ADMIN_ROLE_OPTIONS = [
  {
    value: "COUNSELLOR",
    label: "Counsellor",
    description: "CRM access only",
  },
  {
    value: "EDITOR",
    label: "Editor",
    description: "CMS access and content editing",
  },
  {
    value: "MANAGER",
    label: "Manager",
    description: "CRM downloads, lead assignment, and CMS editing",
  },
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Full access",
  },
] as const;
