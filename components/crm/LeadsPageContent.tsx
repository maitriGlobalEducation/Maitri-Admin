import CRMRecordsTable from "@/components/crm/CRMRecordsTable";
import type { CRMColumn } from "@/components/crm/CRMRecordsTable";
import { formatValue, toCRMRecord } from "@/lib/crm/format-record";
import { connectDB } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import Admin from "@/models/Admin";
import Lead from "@/models/Lead";
import mongoose from "mongoose";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const columns: CRMColumn[] = [
  {
    key: "title",
    label: "Name",
    className: "font-medium text-zinc-900",
  },
  { key: "type", label: "Lead Type" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Mobile" },
  { key: "country", label: "Country" },
  {
    key: "date",
    label: "Submitted",
    className: "whitespace-nowrap",
  },
];

const validTypes = ["contact", "scholarship", "event"] as const;

const validStatuses = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
] as const;

const allowedPageSizes = [10, 25, 50];

type SearchParams = {
  q?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  pageSize?: string;
};

type Props = {
  mode: "all" | "mine";
  searchParams: Promise<SearchParams>;
};

function parseDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function LeadsPageContent({ mode, searchParams }: Props) {
  const currentAdmin = await getAuthenticatedAdmin();

  if (!hasPermission(currentAdmin?.role!, "crm:access")) {
    redirect("/login");
  }

  if (
    mode === "all" &&
    !hasPermission(currentAdmin?.role!, "crm:view-all-leads")
  ) {
    redirect("/crm/my-leads");
  }

  await connectDB();

  const params = await searchParams;

  const q = (params.q ?? "").trim();

  const type = validTypes.includes(params.type as (typeof validTypes)[number])
    ? params.type!
    : "";

  const status = validStatuses.includes(
    params.status as (typeof validStatuses)[number],
  )
    ? params.status!
    : "";

  const startDate = parseDate(params.startDate);
  const endDate = parseDate(params.endDate);

  const requestedPage = Math.max(1, Number(params.page) || 1);

  const requestedPageSize = Number(params.pageSize);
  const pageSize = allowedPageSizes.includes(requestedPageSize)
    ? requestedPageSize
    : 10;

  const filter: Record<string, unknown> = {};

  // My Leads: only leads assigned to the logged-in admin.
  if (mode === "mine") {
    filter.assignedTo = new mongoose.Types.ObjectId(currentAdmin?.id);
  }

  if (type) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  }

  if (q) {
    const searchRegex = new RegExp(escapeRegex(q), "i");

    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { mobile: searchRegex },
      { country: searchRegex },
      { sourceTitle: searchRegex },
    ];
  }

  if (startDate || endDate) {
    const createdAt: Record<string, Date> = {};

    if (startDate) {
      createdAt.$gte = startDate;
    }

    if (endDate) {
      const exclusiveEndDate = new Date(endDate);
      exclusiveEndDate.setUTCDate(exclusiveEndDate.getUTCDate() + 1);
      createdAt.$lt = exclusiveEndDate;
    }

    filter.createdAt = createdAt;
  }

  const totalRecords = await Lead.countDocuments(filter);

  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPage = Math.min(requestedPage, Math.max(totalPages, 1));

  const skip = (currentPage - 1) * pageSize;

  const leads = await Lead.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(pageSize)
    .lean();

  // Fetch counsellor usernames for the assignment controls.
  const assignedAdminIds = [
    ...new Set(
      leads
        .map((lead) => lead.assignedTo?.toString())
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const assignedAdmins = assignedAdminIds.length
    ? await Admin.find({
        _id: { $in: assignedAdminIds },
      })
        .select("_id username")
        .lean()
    : [];

  const assignedAdminNames = new Map(
    assignedAdmins.map((admin) => [admin._id.toString(), admin.username]),
  );

  const records = leads.map((lead) => {
    const fullName =
      `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "Unnamed lead";

    const typeLabels: Record<string, string> = {
      contact: "Contact",
      scholarship: "Scholarship",
      event: "Event",
    };

    const typeLabel = typeLabels[lead.type] ?? lead.type;

    const details = [
      {
        label: "Lead type",
        value: formatValue(typeLabel),
      },
      {
        label: "First name",
        value: formatValue(lead.firstName),
      },
      {
        label: "Last name",
        value: formatValue(lead.lastName),
      },
      {
        label: "Email",
        value: formatValue(lead.email),
      },
      {
        label: "Mobile",
        value: formatValue(lead.mobile),
      },
      {
        label: "Country",
        value: formatValue(lead.country),
      },
      {
        label: "Status",
        value: formatValue(lead.status),
      },
      {
        label: "Submitted at",
        value: lead.createdAt.toISOString(),
      },
    ];

    if (lead.type === "contact") {
      details.push(
        {
          label: "Message",
          value: formatValue(lead.message),
        },
        {
          label: "Terms accepted",
          value: formatValue(lead.termsAccepted),
        },
        {
          label: "Marketing consent",
          value: formatValue(lead.marketingConsent),
        },
        {
          label: "Profiling consent",
          value: formatValue(lead.profilingConsent),
        },
      );
    }

    if (lead.type === "scholarship" || lead.type === "event") {
      details.push({
        label: lead.type === "scholarship" ? "Scholarship" : "Event",
        value: formatValue(lead.sourceTitle),
      });
    }

    const assignedTo = lead.assignedTo?.toString() ?? null;

    return {
      ...toCRMRecord(
        String(lead._id),
        fullName,
        String(lead.email ?? "No email provided"),
        lead.createdAt,
        details,
      ),
      date: lead.createdAt.toISOString(),
      type: lead.type,
      email: String(lead.email ?? "—"),
      mobile: String(lead.mobile ?? "—"),
      country: String(lead.country ?? "—"),
      assignedTo,
      assignedToName: assignedTo
        ? (assignedAdminNames.get(assignedTo) ?? null)
        : null,
    };
  });

  return (
    <CRMRecordsTable
      title={mode === "all" ? "All Leads" : "My Leads"}
      description={
        mode === "all"
          ? "View and manage all contact enquiries, scholarship applications, and event registrations."
          : "View and manage the leads assigned to you."
      }
      records={records}
      columns={columns}
      searchPlaceholder="Search name, email, or mobile..."
      totalRecords={totalRecords}
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      filters={{
        q,
        type,
        status,
        startDate: startDate ? params.startDate! : "",
        endDate: endDate ? params.endDate! : "",
      }}
      canAssignLeads={hasPermission(currentAdmin?.role!, "crm:assign")}
    />
  );
}
