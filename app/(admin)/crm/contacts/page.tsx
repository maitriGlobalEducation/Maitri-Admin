import CRMRecordsTable from "@/components/crm/CRMRecordsTable";
import { formatValue, toCRMRecord } from "@/lib/crm/format-record";
import { connectDB } from "@/lib/mongodb";
import ContactSubmission from "@/models/ContactSubmission";

export const dynamic = "force-dynamic";

import type { CRMColumn } from "@/components/crm/CRMRecordsTable";

const columns: CRMColumn[] = [
  {
    key: "title",
    label: "Name",
    className: "font-medium text-zinc-900",
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "mobile",
    label: "Mobile",
  },
  {
    key: "country",
    label: "Country",
  },
  {
    key: "date",
    label: "Submitted",
    className: "whitespace-nowrap",
  },
];

export default async function ContactEnquiriesPage() {
  await connectDB();

  const submissions = await ContactSubmission.find({})
    .sort({ createdAt: -1 })
    .lean();

  const records = submissions.map((submission) => {
    const fullName =
      `${submission.firstName ?? ""} ${submission.lastName ?? ""}`.trim() ||
      "Unnamed contact";

    return {
      ...toCRMRecord(
        String(submission._id),
        fullName,
        String(submission.email ?? "No email provided"),
        submission.createdAt,
        [
          { label: "First name", value: formatValue(submission.firstName) },
          { label: "Last name", value: formatValue(submission.lastName) },
          { label: "Email", value: formatValue(submission.email) },
          { label: "Country", value: formatValue(submission.country) },
          { label: "Mobile", value: formatValue(submission.mobile) },
          { label: "Message", value: formatValue(submission.message) },
          {
            label: "Terms accepted",
            value: formatValue(submission.termsAccepted),
          },
          {
            label: "Marketing consent",
            value: formatValue(submission.marketingConsent),
          },
          {
            label: "Profiling consent",
            value: formatValue(submission.profilingConsent),
          },
          { label: "Submitted at", value: formatValue(submission.createdAt) },
        ],
      ),
      email: String(submission.email ?? "—"),
      mobile: String(submission.mobile ?? "—"),
      country: String(submission.country ?? "—"),
    };
  });

  return (
    <CRMRecordsTable
      title="Contact Enquiries"
      description="Review enquiries submitted through the public website contact form."
      records={records}
      columns={columns}
      searchPlaceholder="Search name, email, or mobile..."
    />
  );
}
