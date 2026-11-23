"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  TrendingUp,
  ArrowUpRight,
  Clock,
  RefreshCw,
  Sparkles,
  Inbox,
  Mail,
  Award,
} from "lucide-react";
import { getDashboardDateRanges } from "@/helpers/date";

type Lead = {
  _id: string;
  name: string;
  email: string;
  type: "contact" | "event" | "scholarship";
  createdAt: string;
};

type DashboardData = {
  totalLeads: number;
  todayLeads: number;
  weekLeads: number;
  recentLeads: Lead[];
};

const crmSections = [
  {
    title: "All Leads",
    description: "View and manage all incoming leads",
    href: "/crm/leads",
    icon: Users,
  },
];

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

const typeConfig = {
  contact: {
    label: "Contact",
    icon: Mail,
    color: "bg-blue-50 text-blue-700",
  },
  event: {
    label: "Event",
    icon: CalendarDays,
    color: "bg-emerald-50 text-emerald-700",
  },
  scholarship: {
    label: "Scholarship",
    icon: Award,
    color: "bg-violet-50 text-violet-700",
  },
} as const;

export default function CRMPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError("");

      const ranges = getDashboardDateRanges();
      const params = new URLSearchParams(ranges);

      const response = await fetch(`/api/crm/dashboard?${params.toString()}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to fetch dashboard data.");
      }

      setData(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while fetching dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  const overviewStats = [
    {
      label: "Total Leads",
      value: data?.totalLeads,
      description: "All incoming enquiries",
      icon: Users,
    },
    {
      label: "Today's Leads",
      value: data?.todayLeads,
      description: "Received today",
      icon: CalendarDays,
    },
    {
      label: "This Week",
      value: data?.weekLeads,
      description: "Received this week",
      icon: TrendingUp,
    },
  ];

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-white px-3 py-1.5">
            <Sparkles className="size-3.5 text-amber-600" />
            <span className="text-[11px] font-semibold tracking-wider text-[#101828]">
              MAITRI GLOBAL EDUCATION
            </span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#101828] sm:text-4xl">
                CRM{" "}
                <span className="bg-gold-gradient bg-clip-text text-transparent">
                  Overview
                </span>
              </h1>

              <p className="mt-2 text-sm text-[#667085]">
                Monitor and manage all incoming leads.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchDashboardData()}
              disabled={loading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#eaecf0] bg-white px-3.5 py-2.5 text-sm font-medium text-[#344054] transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          <div className="mt-6 h-px bg-linear-to-r from-amber-400/70 via-amber-200/40 to-transparent" />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}

            <button
              type="button"
              onClick={() => void fetchDashboardData()}
              className="cursor-pointer font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Overview statistics */}
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold text-[#101828]">Lead Overview</h2>
            <p className="mt-1 text-sm text-[#667085]">
              A snapshot of your incoming leads.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overviewStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[#eaecf0] bg-white p-5 shadow-[0_2px_10px_rgba(16,24,40,0.025)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#667085]">
                      {stat.label}
                    </span>

                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#101828] text-amber-400">
                      <Icon className="size-5" />
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-3xl font-bold tracking-tight text-[#101828] tabular-nums">
                      {loading
                        ? "—"
                        : (stat.value ?? 0).toLocaleString("en-IN")}
                    </p>

                    <p className="mt-1 text-xs text-[#98a2b3]">
                      {stat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* All Leads section */}
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold text-[#101828]">CRM Management</h2>
            <p className="mt-1 text-sm text-[#667085]">
              Manage all your enquiries, registrations and applications from one
              place.
            </p>
          </div>

          {crmSections.map((item) => {
            const Icon = item.icon;
            const count = data?.totalLeads;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 rounded-2xl border border-[#eaecf0] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg hover:shadow-black/5"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#101828] text-amber-400 transition-colors group-hover:bg-gold-gradient">
                  <Icon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#101828]">
                    {item.title}
                  </p>

                  <p className="mt-1 text-xs text-[#98a2b3]">
                    {item.description}
                  </p>

                  <p className="mt-3 text-2xl font-bold text-[#101828] tabular-nums">
                    {loading ? "—" : (count ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>

                <ArrowUpRight className="size-5 shrink-0 text-[#98a2b3] transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-amber-700" />
              </Link>
            );
          })}
        </section>

        {/* Recent leads */}
        <section className="overflow-hidden rounded-2xl border border-[#eaecf0] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eaecf0] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold text-[#101828]">Recent Leads</h2>

              <p className="mt-1 text-xs text-[#98a2b3]">
                Latest incoming leads across all types.
              </p>
            </div>

            <span className="flex items-center gap-1.5 text-xs font-medium text-[#667085]">
              <Clock className="size-3.5" />
              Latest activity
            </span>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-12 animate-pulse rounded-lg bg-zinc-100"
                />
              ))}
            </div>
          ) : data?.recentLeads?.length ? (
            <div className="divide-y divide-[#f2f4f7]">
              {data.recentLeads.map((lead) => {
                const config = typeConfig[lead.type];
                const Icon = config.icon;

                return (
                  <div
                    key={lead._id}
                    className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-[#faf9f6] sm:px-6"
                  >
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${config.color}`}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#101828]">
                        {lead.name}
                      </p>

                      <p className="truncate text-xs text-[#98a2b3]">
                        {lead.email}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}
                    >
                      {config.label}
                    </span>

                    <span className="w-full text-xs text-[#98a2b3] sm:w-auto sm:text-right">
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center px-5 py-12 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-[#faf9f6] text-[#b08028]">
                <Inbox className="size-5" />
              </div>

              <p className="text-sm font-semibold text-[#101828]">
                No recent leads
              </p>

              <p className="mt-1 text-xs text-[#98a2b3]">
                New submissions will appear here.
              </p>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="flex flex-wrap justify-between gap-3 border-t border-[#eaecf0] pt-5">
          <p className="text-xs text-[#98a2b3]">
            Maitri Global Education · Administration Portal
          </p>

          <p className="text-xs text-[#667085]">CRM Dashboard</p>
        </div>
      </div>
    </main>
  );
}
