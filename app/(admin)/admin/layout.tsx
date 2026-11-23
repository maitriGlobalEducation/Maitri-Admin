import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/login");
  }

  if (!hasPermission(admin.role, "admin:manage")) {
    redirect("/cms/homepage");
  }

  return <>{children}</>;
}
