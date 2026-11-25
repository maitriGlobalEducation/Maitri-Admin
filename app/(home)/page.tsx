import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import WorkspaceLauncher from "@/components/Workspace Components/WorkspaceLauncher";

export default async function Home() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/login");
  }

  const canAccessCMS = hasPermission(admin.role, "cms:access");
  const canAccessCRM = hasPermission(admin.role, "crm:access");

  return (
    <WorkspaceLauncher
      username={admin.username}
      canAccessCMS={canAccessCMS}
      canAccessCRM={canAccessCRM}
    />
  );
}
