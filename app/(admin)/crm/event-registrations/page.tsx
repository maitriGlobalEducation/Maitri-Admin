import EventRegistration from "@/models/EventRegistration";
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
    label: "Event",
    className: "font-medium text-zinc-900",
  },
  {
    key: "registrant",
    label: "Registrant",
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "date",
    label: "Registered",
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

export default async function EventRegistrationsPage() {
  await connectDB();

  const submissions = await EventRegistration.find({})
    .sort({ createdAt: -1 })
    .lean();

  const records = submissions.map((submission) => {
    const fields = (submission.fields ?? {}) as Record<string, unknown>;

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

    const registrant =
      fullName || getAnswer(fields, "name", "fullName", "full_name") || "—";

    const email = getAnswer(fields, "email", "emailAddress", "email_address");

    return {
      ...toCRMRecord(
        String(submission._id),
        String(submission.eventTitle ?? "Untitled event"),
        email,
        submission.createdAt,
        [
          {
            label: "Event",
            value: formatValue(submission.eventTitle),
          },
          {
            label: "Event ID",
            value: formatValue(submission.eventId),
          },
          {
            label: "Registrant",
            value: registrant,
          },
          {
            label: "Email",
            value: email,
          },
          ...formatFields(fields),
          {
            label: "Registered at",
            value: formatValue(submission.createdAt),
          },
        ],
      ),
      registrant,
      email,
    };
  });

  return (
    <CRMRecordsTable
      title="Event Registrations"
      description="View and review registrations submitted through the public website."
      records={records}
      columns={columns}
      searchPlaceholder="Search event, registrant, or email..."
    />
  );
}
