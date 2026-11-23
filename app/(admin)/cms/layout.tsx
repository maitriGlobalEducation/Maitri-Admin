import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

interface CMSLayoutProps {
  children: ReactNode;
}

export default async function CMSLayout({ children }: CMSLayoutProps) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/login");
  }

  if (!hasPermission(admin.role, "cms:access")) {
    redirect("/crm");
  }

  return <>{children}</>;
}
