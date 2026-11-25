import { getAuthenticatedAdmin } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function CMSPage() {
  const admin = await getAuthenticatedAdmin();

  if (!admin || !hasPermission(admin.role, "crm:access")) {
    redirect("/login");
  }

  return redirect("/crm/dashboard");
}
