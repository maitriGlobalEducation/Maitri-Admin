"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgePercent,
  Newspaper,
  CalendarDays,
  MessageSquareQuote,
  Home,
  Users,
  LogOut,
  UserRound,
  ChevronDown,
  FolderOpen,
  FileText,
  GraduationCap,
  Calendar,
  ShieldCheck,
  Compass,
  Palette,
  Building2,
  MapPin,
  Map as MapIcon,
  Layers3,
  Tag,
} from "lucide-react";
import { AdminRole } from "@/models/Admin";

const cmsSections = [
  {
    label: "Homepage",
    href: "/cms/homepage",
    icon: Home,
  },

  {
    label: "Explore",
    icon: Compass,
    items: [
      {
        label: "Institutes",
        href: "/cms/explore/institutes",
        icon: Building2,
      },
      {
        label: "Courses",
        href: "/cms/explore/courses",
        icon: GraduationCap,
      },
      {
        label: "Course Categories",
        href: "/cms/explore/course-categories",
        icon: Layers3,
      },
      {
        label: "Campuses",
        href: "/cms/explore/campuses",
        icon: MapPin,
      },

      {
        label: "Areas",
        href: "/cms/explore/areas",
        icon: MapIcon,
      },
      {
        label: "Brands",
        href: "/cms/explore/brands",
        icon: Tag,
      },
    ],
  },

  {
    label: "Blogs",
    icon: Newspaper,
    items: [
      { label: "Blogs", href: "/cms/blogs", icon: FileText },
      {
        label: "Blog Categories",
        href: "/cms/blogs/blog-categories",
        icon: FolderOpen,
      },
    ],
  },
  {
    label: "Scholarships",
    icon: BadgePercent,
    items: [
      {
        label: "Scholarships",
        href: "/cms/scholarships",
        icon: GraduationCap,
      },
    ],
  },
  {
    label: "Events",
    icon: CalendarDays,
    items: [
      { label: "Events", href: "/cms/events", icon: Calendar },
      {
        label: "Event Categories",
        href: "/cms/events/event-categories",
        icon: FolderOpen,
      },
    ],
  },
  {
    label: "Testimonials",
    href: "/cms/testimonials",
    icon: MessageSquareQuote,
  },
];

const crmSections = [
  {
    label: "Contact Enquiries",
    href: "/crm/contacts",
    icon: MessageSquareQuote,
  },
  {
    label: "Event Registrations",
    href: "/crm/event-registrations",
    icon: CalendarDays,
  },
  {
    label: "Scholarship Applications",
    href: "/crm/scholarship-applications",
    icon: GraduationCap,
  },
];

interface CurrentAdmin {
  id: string;
  username: string;
  role: AdminRole;
}

interface AdminSidebarProps {
  admin: CurrentAdmin;
}

export default function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isCRM = pathname.startsWith("/crm");
  const isCMS = pathname.startsWith("/cms");

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [openSections, setOpenSections] = useState<string[]>([]);

  const isActive = (href: string) => pathname === href;

  // Automatically open the dropdown containing the current page.
  useEffect(() => {
    const activeSection = cmsSections.find(
      (section) =>
        "items" in section &&
        section.items &&
        section.items.some((item) => isActive(item.href)),
    );

    if (activeSection) {
      setOpenSections((current) =>
        current.includes(activeSection.label)
          ? current
          : [...current, activeSection.label],
      );
    }
  }, [pathname]);

  const toggleSection = (label: string) => {
    setOpenSections((current) =>
      current.includes(label)
        ? current.filter((section) => section !== label)
        : [...current, label],
    );
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to log out. Please try again.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Unable to log out. Please try again.",
      );
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-zinc-200 bg-white">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center border-b border-zinc-200 px-6 py-2">
        <div>
          <p className="text-lg font-semibold text-zinc-900">Maitri</p>
          <p className="text-xs text-zinc-500">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        {/* Workspace switcher */}
        <div className="mb-7">
          <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Workspaces
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/cms/homepage"
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                isCMS
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Home size={14} />
              CMS
            </Link>

            <Link
              href="/crm"
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                isCRM
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Users size={14} />
              CRM
            </Link>
          </div>
        </div>

        {/* Context-specific navigation */}
        <div>
          <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
            {isCRM ? "Customer Management" : "Content Management"}
          </p>

          <nav className="space-y-1">
            {isCRM
              ? crmSections.map((section) => {
                  const Icon = section.icon;
                  const active =
                    pathname === section.href ||
                    pathname.startsWith(`${section.href}/`);

                  return (
                    <Link
                      key={section.href}
                      href={section.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-orange-50 font-medium text-[#e94717]"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span>{section.label}</span>
                    </Link>
                  );
                })
              : cmsSections.map((section) => {
                  const Icon = section.icon;
                  const hasChildren = "items" in section;

                  // Direct navigation links
                  if (!hasChildren) {
                    const active =
                      pathname === section.href ||
                      pathname.startsWith(`${section.href}/`);

                    return (
                      <Link
                        key={section.href}
                        href={section.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                          active
                            ? "bg-zinc-100 font-medium text-zinc-950"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                        }`}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span>{section.label}</span>
                      </Link>
                    );
                  }

                  // Expandable CMS sections
                  const isOpen = openSections.includes(section.label);

                  const hasActiveItem = section.items?.some(
                    (item) =>
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`),
                  );

                  return (
                    <div key={section.label}>
                      <button
                        type="button"
                        onClick={() => toggleSection(section.label)}
                        aria-expanded={isOpen}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          hasActiveItem
                            ? "font-medium text-zinc-950"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                        }`}
                      >
                        <Icon size={18} className="shrink-0" />

                        <span className="flex-1">{section.label}</span>

                        <ChevronDown
                          size={16}
                          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="ml-4 mt-1 space-y-1 border-l border-zinc-200 pl-3">
                          {section.items?.map((item) => {
                            const ItemIcon = item.icon;
                            const disableCourses =
                              item.label.toLowerCase() === "courses";

                            const active =
                              pathname === item.href ||
                              pathname.startsWith(`${item.href}/`);

                            const className = `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                              disableCourses
                                ? "cursor-not-allowed opacity-40"
                                : active
                                  ? "bg-zinc-100 font-medium text-zinc-950"
                                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                            }`;

                            const content = (
                              <>
                                <ItemIcon size={16} className="shrink-0" />
                                <span>{item.label}</span>
                              </>
                            );

                            return disableCourses ? (
                              <span
                                key={item.href}
                                className={className}
                                aria-disabled="true"
                              >
                                {content}
                              </span>
                            ) : (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={className}
                              >
                                {content}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
          </nav>
        </div>

        {/* Super admin access */}
        {admin?.role === "SUPER_ADMIN" && (
          <div className="mt-7 border-t border-zinc-100 pt-5">
            <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
              Administration
            </p>

            <Link
              href="/admin"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                pathname === "/admin"
                  ? "bg-zinc-100 font-medium text-zinc-950"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
              }`}
            >
              <ShieldCheck size={18} className="shrink-0" />
              Admin
            </Link>
          </div>
        )}
      </div>

      {/* Account and logout */}
      <div className="shrink-0 border-t border-zinc-200 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white shadow-sm">
            {admin?.username?.charAt(0).toUpperCase() ?? (
              <UserRound size={18} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {admin ? admin.username : "Loading account..."}
            </p>

            {admin && (
              <span className="mt-1 inline-flex items-center rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {admin.role.replaceAll("_", " ")}
              </span>
            )}
          </div>

          <span
            className="size-2 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-50"
            title="Signed in"
          />
        </div>

        {logoutError && (
          <p
            role="alert"
            className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600"
          >
            {logoutError}
          </p>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-zinc-600 transition-all duration-200 hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-red-100 group-hover:text-red-600">
            <LogOut size={16} />
          </span>

          <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>

          {!isLoggingOut && (
            <span className="ml-auto text-xs text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-red-500">
              →
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
