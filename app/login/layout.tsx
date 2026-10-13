import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAuthenticatedAdmin();

  if (admin) {
    redirect("/");
  }

  return children;
}
