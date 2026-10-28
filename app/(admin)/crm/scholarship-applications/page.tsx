import ScholarshipApplication from "@/models/ScholarshipApplication";
import CRMRecordsTable, {
  type CRMColumn,
} from "@/components/crm/CRMRecordsTable";
import {
  formatFields,
  formatValue,
  toCRMRecord,
} from "@/lib/crm/format-record";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const columns: CRMColumn[] = [
  {
    key: "title",
    label: "Scholarship",
    className: "font-medium text-zinc-900",
  },
  {
    key: "applicant",
    label: "Applicant",
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "date",
    label: "Applied on",
    className: "whitespace-nowrap",
  },
];

function getAnswer(fields: Record<string, unknown>, ...keys: string[]): string {
  const normalizedFields = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key.toLowerCase().replace(/[\s_-]/g, ""),
      value,
    ]),
  );

  for (const key of keys) {
    const value = normalizedFields[key.toLowerCase().replace(/[\s_-]/g, "")];

    if (value !== undefined && value !== null && value !== "") {
      return formatValue(value);
    }
  }

  return "—";
}

export default async function ScholarshipApplicationsPage() {
  await connectDB();

  const applications = await ScholarshipApplication.find({})
    .sort({ createdAt: -1 })
    .lean();

  const records = applications.map((application) => {
    const fields = (application.fields ?? {}) as Record<string, unknown>;

    const answers = formatFields(fields);

    const firstName = getAnswer(
      fields,
      "firstName",
      "first_name",
      "first name",
    );

    const lastName = getAnswer(fields, "lastName", "last_name", "last name");

    const fullName = [firstName, lastName]
      .filter((value) => value !== "—")
      .join(" ");

    const applicant =
      fullName || getAnswer(fields, "name", "fullName", "full_name") || "—";

    const email = getAnswer(fields, "email", "emailAddress", "email_address");

    return {
      ...toCRMRecord(
        String(application._id),
        String(application.scholarshipTitle || "Untitled scholarship"),
        email,
        application.createdAt,
        [
          {
            label: "Scholarship title",
            value: formatValue(application.scholarshipTitle),
          },
          {
            label: "Scholarship ID",
            value: formatValue(application.scholarshipId),
          },
          {
            label: "Applicant",
            value: applicant,
          },
          {
            label: "Email",
            value: email,
          },
          ...answers,
          {
            label: "Submitted at",
            value: formatValue(application.createdAt),
          },
        ],
      ),
      applicant,
      email,
    };
  });

  return (
    <CRMRecordsTable
      title="Scholarship Applications"
      description="Review applications and the information submitted by prospective students."
      records={records}
      columns={columns}
      searchPlaceholder="Search scholarship, applicant, or email..."
    />
  );
}
