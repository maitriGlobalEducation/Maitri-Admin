"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MessageSquareQuote,
  Sparkles,
  Users,
} from "lucide-react";

interface WorkspaceLauncherProps {
  username: string;
  canAccessCMS: boolean;
  canAccessCRM: boolean;
}

export default function WorkspaceLauncher({
  username,
  canAccessCMS,
  canAccessCRM,
}: WorkspaceLauncherProps) {
  const reduceMotion = useReducedMotion();
  const displayName = username.split("@")[0];

  const workspaces = [
    {
      id: "cms",
      number: "01",
      category: "CONTENT MANAGEMENT",
      title: "Content Management",
      abbreviation: "CMS",
      description:
        "Manage website content, publish updates, and maintain Maitri's digital presence.",
      href: "/cms/homepage",
      icon: LayoutDashboard,
      features: [
        { label: "Blogs & Content", icon: FileText },
        { label: "Events", icon: CalendarDays },
        { label: "Testimonials", icon: MessageSquareQuote },
      ],
      enabled: canAccessCMS,
    },
    {
      id: "crm",
      number: "02",
      category: "RELATIONSHIP MANAGEMENT",
      title: "Customer Relationships",
      abbreviation: "CRM",
      description:
        "Manage student enquiries, prospective applicants, and follow-ups from one place.",
      href: "/crm/dashboard",
      icon: Users,
      features: [
        { label: "Student Enquiries", icon: Users },
        { label: "Lead Management", icon: Sparkles },
      ],
      enabled: canAccessCRM,
    },
  ].filter((workspace) => workspace.enabled);

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf9f6] px-5 py-6 sm:px-8 sm:py-9 lg:px-12">
      <div className="mx-auto max-w-6xl">
        {/* Top navigation */}
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          className="flex items-center justify-between border-b border-zinc-200/80 pb-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <Sparkles size={19} />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight text-zinc-900">
                Maitri Global Education
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">
                Administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white px-3 py-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="hidden text-xs font-bold text-zinc-600 sm:inline capitalize">
              {displayName}
            </span>
            <span className="text-xs font-bold text-zinc-500 sm:hidden capitalize">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </motion.header>

        {/* Welcome section */}
        <section className="relative py-12 sm:py-16">
          {/* Decorative background */}
          <div className="pointer-events-none absolute -right-12 top-4 hidden size-72 rounded-full bg-amber-100/50 blur-3xl sm:block" />

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.1 }}
            className="relative max-w-2xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50/70 px-3 py-1.5">
              <Sparkles size={13} className="text-amber-700" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800">
                Your administrative space
              </span>
            </div>

            <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight text-zinc-950 sm:text-5xl lg:text-[56px]">
              Good to have you back.
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-500 sm:text-base">
              Welcome,{" "}
              <span className="font-bold capitalize">{displayName}</span>.
              Everything your team needs, thoughtfully organised in one place.
              Where would you like to begin?
            </p>
          </motion.div>
        </section>

        {/* Workspace section */}
        <section className="pb-10">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...transition, delay: 0.2 }}
            className="mb-5 flex items-center justify-between"
          >
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Your workspaces
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Select a workspace to continue
              </p>
            </div>
          </motion.div>

          <div className="space-y-3">
            {workspaces.map((workspace, index) => {
              const Icon = workspace.icon;

              return (
                <motion.div
                  key={workspace.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    ...transition,
                    delay: reduceMotion ? 0 : 0.25 + index * 0.12,
                  }}
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                >
                  <Link
                    href={workspace.href}
                    className="group relative block overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-[#EBC34B] hover:bg-[#FFFDF6] hover:shadow-[0_12px_35px_rgba(180,140,30,0.10)] sm:p-7"
                  >
                    {/* Hover accent */}
                    <div className="absolute bottom-0 left-0 top-0 w-1 origin-bottom scale-y-0 bg-[#E9BC35] transition-transform duration-300 group-hover:scale-y-100" />

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      {/* Workspace number */}
                      <div className="hidden w-12 shrink-0 sm:block">
                        <span className="text-2xl font-light tracking-tight text-zinc-300 transition-colors group-hover:text-[#C49A20]">
                          {workspace.number}
                        </span>
                      </div>

                      {/* Icon */}
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-all duration-300 group-hover:bg-[#E9BC35] group-hover:text-zinc-950">
                        <Icon size={21} strokeWidth={1.8} />
                      </div>

                      {/* Main information */}
                      <div className="min-w-0 flex-1">
                        <p className="mb-1.5 text-[10px] font-semibold tracking-[0.15em] text-zinc-400 transition-colors group-hover:text-[#A98519]">
                          {workspace.category}
                        </p>

                        <h3 className="text-lg font-semibold tracking-tight text-zinc-900 transition-colors group-hover:text-[#987313] sm:text-xl">
                          {workspace.title}
                          <span className="ml-2 text-xs font-medium text-zinc-400">
                            / {workspace.abbreviation}
                          </span>
                        </h3>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                          {workspace.description}
                        </p>

                        {/* Features */}
                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                          {workspace.features.map((feature) => {
                            const FeatureIcon = feature.icon;

                            return (
                              <span
                                key={feature.label}
                                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 transition-colors group-hover:text-[#8C721F]"
                              >
                                <FeatureIcon size={13} />
                                {feature.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 pt-4 transition-colors group-hover:border-[#F0E2B5] sm:flex-col sm:justify-center sm:border-0 sm:pt-0">
                        <span className="text-xs font-semibold text-zinc-500 transition-colors group-hover:text-[#987313] sm:hidden">
                          Open workspace
                        </span>

                        <motion.div
                          className="flex size-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-all duration-300 group-hover:border-[#E9BC35] group-hover:bg-[#E9BC35] group-hover:text-zinc-950"
                          whileHover={reduceMotion ? undefined : { rotate: 45 }}
                        >
                          <ArrowUpRight size={19} />
                        </motion.div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {workspaces.length === 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
              <LayoutDashboard size={25} className="mx-auto text-zinc-400" />
              <h3 className="mt-4 text-sm font-semibold text-zinc-900">
                No workspaces available
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
                Your account does not currently have access to any workspace.
                Please contact your administrator.
              </p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="flex flex-col gap-3 border-t border-zinc-200/80 py-6 text-[11px] text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Maitri Global Education</p>

          <p>
            Signed in as{" "}
            <span className="font-semibold text-zinc-600 capitalize">
              {displayName}
            </span>
          </p>
        </footer>
      </div>
    </main>
  );
}
