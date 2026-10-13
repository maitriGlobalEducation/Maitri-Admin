import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MessageSquareQuote,
  Sparkles,
  Users,
} from "lucide-react";
import { getAuthenticatedAdmin } from "@/lib/auth";

export default async function Home() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm">
            <Sparkles size={14} className="text-amber-500" />
            Maitri Global Education
          </div>

          <p className="mb-2 text-sm font-medium text-zinc-500">
            YOUR ADMIN WORKSPACE
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Welcome back,{" "}
            <span className="text-zinc-500">{admin.username}</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
            What would you like to work on today? Choose a workspace to get
            started.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <Link
            href="/cms/homepage"
            className="group relative flex min-h-80 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg sm:p-8"
          >
            <div className="absolute -right-12 -top-12 size-40 rounded-full bg-zinc-100 transition-colors duration-300 group-hover:bg-amber-50 group-hover:scale-125" />

            <div className="relative flex size-12 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm transition-colors duration-200 group-hover:bg-amber-600">
              <LayoutDashboard size={23} />
            </div>

            <div className="relative mt-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 transition-colors duration-200 group-hover:text-amber-600">
                Workspace 01
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                Content Management (CMS)
              </h2>

              <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-600">
                Manage your website content, publish updates, and keep
                everything on the Maitri website up to date.
              </p>
            </div>

            <div className="relative mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-600 transition-colors duration-200 group-hover:border-amber-100 group-hover:bg-amber-50 group-hover:text-amber-700">
                <FileText size={13} />
                Blogs &amp; Content
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-600 transition-colors duration-200 group-hover:border-amber-100 group-hover:bg-amber-50 group-hover:text-amber-700">
                <CalendarDays size={13} />
                Events
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-600 transition-colors duration-200 group-hover:border-amber-100 group-hover:bg-amber-50 group-hover:text-amber-700">
                <MessageSquareQuote size={13} />
                Testimonials
              </span>
            </div>

            <div className="relative mt-auto flex items-center justify-between border-t border-zinc-100 pt-5">
              <span className="text-sm font-medium text-zinc-900">
                Open CMS
              </span>

              <span className="flex size-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition-colors duration-200 group-hover:border-amber-600 group-hover:bg-amber-600 group-hover:text-white">
                <ArrowUpRight size={17} />
              </span>
            </div>
          </Link>

          <Link
            href="/crm"
            className="group relative flex min-h-80 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg sm:p-8"
          >
            <div className="absolute -right-12 -top-12 size-40 rounded-full bg-zinc-100 transition-colors duration-300 group-hover:bg-amber-50 group-hover:scale-125" />

            <div className="relative flex size-12 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm transition-colors duration-200 group-hover:bg-amber-600">
              <Users size={23} />
            </div>

            <div className="relative mt-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 transition-colors duration-200 group-hover:text-amber-600">
                Workspace 02
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                Customer Relationships (CRM)
              </h2>

              <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-600">
                A dedicated workspace for managing student enquiries,
                prospective applicants, and follow-ups.
              </p>
            </div>

            <div className="relative mt-6">
              <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors duration-200 group-hover:border-amber-100 group-hover:bg-amber-50 group-hover:text-amber-700">
                <Users size={14} />
                Student &amp; Lead Management
              </span>
            </div>

            <div className="relative mt-auto flex items-center justify-between border-t border-zinc-100 pt-5">
              <span className="text-sm font-medium text-zinc-900">
                Open CRM
              </span>

              <span className="flex size-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition-colors duration-200 group-hover:border-amber-600 group-hover:bg-amber-600 group-hover:text-white">
                <ArrowUpRight size={17} />
              </span>
            </div>
          </Link>
        </section>

        <footer className="mt-10 flex flex-col gap-2 border-t border-zinc-200 pt-5 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Maitri Global Education · Admin Portal</p>
          <p>
            Signed in as{" "}
            <span className="font-medium text-zinc-600">{admin.username}</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
