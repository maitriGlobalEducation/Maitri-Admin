import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { getAuthenticatedAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminSidebar admin={admin} />

      <main className="ml-64 min-h-screen">
        <div className="mx-auto max-w-[1560px] p-8">{children}</div>
      </main>
    </div>
  );
}
