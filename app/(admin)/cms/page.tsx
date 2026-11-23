import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export default async function CMSPage() {
  const admin = await getAuthenticatedAdmin();

  if (!admin || !hasPermission(admin.role, "cms:access")) {
    redirect("/login");
  }

  redirect("/cms/homepage");
}
