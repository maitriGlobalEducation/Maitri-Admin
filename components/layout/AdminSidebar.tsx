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
  LayoutDashboard,
} from "lucide-react";
import { AdminRole } from "@/models/Admin";
import { hasPermission } from "@/lib/permissions";

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

const crmSections = (role: AdminRole) => [
  {
    label: "Dashboard",
    href: "/crm/dashboard",
    icon: LayoutDashboard,
  },
  ...(hasPermission(role, "crm:view-all-leads")
    ? [
        {
          label: "All Leads",
          href: "/crm/leads",
          icon: Users,
        },
      ]
    : []),
  ...(hasPermission(role, "crm:view-my-leads")
    ? [
        {
          label: "My Leads",
          href: "/crm/my-leads",
          icon: UserRound,
        },
      ]
    : []),
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#E9E5DC] bg-[#FBFAF7]">
      {/* Header */}
      <div className="flex h-19 shrink-0 items-center border-b border-[#E9E5DC] px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#172C3D] text-lg font-semibold text-[#D3B77F]">
            M
          </div>
          <div>
            <p className="text-[17px] font-semibold tracking-tight text-[#172C3D]">
              Maitri
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.19em] text-[#9A8B70]">
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Workspace switcher */}
        <div className="mb-8">
          <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#A49A89]">
            Workspaces
          </p>

          <div className="grid grid-cols-2 gap-2">
            {hasPermission(admin.role, "cms:access") && (
              <Link
                href="/cms/homepage"
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-semibold transition-all ${
                  isCMS
                    ? "bg-[#172C3D] text-white shadow-sm"
                    : "border border-[#E9E5DC] bg-white text-[#6F716F] hover:border-[#D3B77F] hover:bg-[#F7F3E9] hover:text-[#172C3D]"
                }`}
              >
                <Home size={15} />
                CMS
              </Link>
            )}

            {hasPermission(admin.role, "crm:access") && (
              <Link
                href="/crm/dashboard"
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-semibold transition-all ${
                  isCRM
                    ? "bg-[#172C3D] text-white shadow-sm"
                    : "border border-[#E9E5DC] bg-white text-[#6F716F] hover:border-[#D3B77F] hover:bg-[#F7F3E9] hover:text-[#172C3D]"
                }`}
              >
                <Users size={15} />
                CRM
              </Link>
            )}
          </div>
        </div>

        {/* Context-specific navigation */}
        <div>
          <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#A49A89]">
            {isCRM ? "Customer Management" : "Content Management"}
          </p>

          <nav className="space-y-1">
            {isCRM
              ? crmSections(admin.role).map((section) => {
                  const Icon = section.icon;
                  const active =
                    pathname === section.href ||
                    pathname.startsWith(`${section.href}/`);

                  return (
                    <Link
                      key={section.href}
                      href={section.href}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all ${
                        active
                          ? "bg-[#F0EBDD] font-semibold text-[#172C3D]"
                          : "text-[#74756F] hover:bg-[#F3F0E9] hover:text-[#172C3D]"
                      }`}
                    >
                      {active && (
                        <span className="absolute bottom-2 left-0 top-2 w-0.75 rounded-r-full bg-[#B99A5D]" />
                      )}
                      <Icon
                        size={17}
                        className={
                          active
                            ? "text-[#9B7D43]"
                            : "text-[#929087] group-hover:text-[#9B7D43]"
                        }
                      />
                      <span>{section.label}</span>
                    </Link>
                  );
                })
              : cmsSections.map((section) => {
                  const Icon = section.icon;
                  const hasChildren = "items" in section;

                  if (!hasChildren) {
                    const active =
                      pathname === section.href ||
                      pathname.startsWith(`${section.href}/`);

                    return (
                      <Link
                        key={section.href}
                        href={section.href}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all ${
                          active
                            ? "bg-[#F0EBDD] font-semibold text-[#172C3D]"
                            : "text-[#74756F] hover:bg-[#F3F0E9] hover:text-[#172C3D]"
                        }`}
                      >
                        {active && (
                          <span className="absolute bottom-2 left-0 top-2 w-0.75 rounded-r-full bg-[#B99A5D]" />
                        )}
                        <Icon
                          size={17}
                          className={
                            active
                              ? "text-[#9B7D43]"
                              : "text-[#929087] group-hover:text-[#9B7D43]"
                          }
                        />
                        <span>{section.label}</span>
                      </Link>
                    );
                  }

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
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition-all ${
                          hasActiveItem
                            ? "font-semibold text-[#172C3D]"
                            : "text-[#74756F] hover:bg-[#F3F0E9] hover:text-[#172C3D]"
                        }`}
                      >
                        <Icon
                          size={17}
                          className={
                            hasActiveItem ? "text-[#9B7D43]" : "text-[#929087]"
                          }
                        />
                        <span className="flex-1">{section.label}</span>
                        <ChevronDown
                          size={15}
                          className={`text-[#A49A89] transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="ml-5 mt-1 space-y-1 border-l border-[#E4DDCF] pl-3">
                          {section.items?.map((item) => {
                            const ItemIcon = item.icon;
                            const active =
                              pathname === item.href ||
                              pathname.startsWith(`${item.href}/`);

                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all ${
                                  active
                                    ? "bg-[#F0EBDD] font-semibold text-[#172C3D]"
                                    : "text-[#85847D] hover:bg-[#F3F0E9] hover:text-[#172C3D]"
                                }`}
                              >
                                <ItemIcon size={15} />
                                <span>{item.label}</span>
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

        {/* Administration */}
        {admin?.role === "SUPER_ADMIN" && (
          <div className="mt-8 border-t border-[#E9E5DC] pt-5">
            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#A49A89]">
              Administration
            </p>

            <Link
              href="/admin"
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all ${
                pathname === "/admin"
                  ? "bg-[#F0EBDD] font-semibold text-[#172C3D]"
                  : "text-[#74756F] hover:bg-[#F3F0E9] hover:text-[#172C3D]"
              }`}
            >
              {pathname === "/admin" && (
                <span className="absolute bottom-2 left-0 top-2 w-0.75 rounded-r-full bg-[#B99A5D]" />
              )}
              <ShieldCheck size={17} className="text-[#9B7D43]" />
              Admin
            </Link>
          </div>
        )}
      </div>

      {/* Profile and logout */}
      <div className="relative">
        {profileMenuOpen && (
          <button
            type="button"
            aria-label="Close profile menu"
            onClick={() => setProfileMenuOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-transparent"
          />
        )}

        <button
          type="button"
          onClick={() => setProfileMenuOpen((prev) => !prev)}
          aria-expanded={profileMenuOpen}
          className="relative z-50 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-all hover:border-[#E9E5DC] hover:bg-white"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#172C3D] text-sm font-semibold text-[#D3B77F]">
            {admin?.username?.charAt(0).toUpperCase() || (
              <UserRound size={18} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#172C3D]">
              {admin?.username ?? "Loading account..."}
            </p>
            <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wider text-[#9A8B70]">
              {admin?.role?.replaceAll("_", " ") ?? "Administrator"}
            </p>
          </div>

          <span
            className="size-2 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-50"
            title="Signed in"
          />
        </button>

        {profileMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl border border-[#E9E5DC] bg-white p-1.5 shadow-lg shadow-[#172C3D]/10">
            <div className="border-b border-[#F0EDE6] px-3 py-2">
              <p className="text-xs font-semibold text-[#172C3D]">
                Signed in as
              </p>
              <p className="mt-0.5 truncate text-xs text-[#85847D]">
                {admin?.username}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="group mt-1 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#74756F] transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut size={16} />
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
