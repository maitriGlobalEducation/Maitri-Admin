import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

interface CRMLayoutProps {
  children: ReactNode;
}

export default async function CRMLayout({ children }: CRMLayoutProps) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/login");
  }

  if (!hasPermission(admin.role, "crm:access")) {
    redirect("/cms/homepage");
  }

  return <>{children}</>;
}
