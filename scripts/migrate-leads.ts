import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing from environment variables.");
}

type LeadType = "contact" | "scholarship" | "event";

interface MigrationLead {
  _id: mongoose.Types.ObjectId;
  type: LeadType;

  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  country: string;

  message?: string;
  termsAccepted?: boolean;
  marketingConsent?: boolean;
  profilingConsent?: boolean;

  sourceId?: mongoose.Types.ObjectId;
  sourceTitle?: string;

  applicationData?: Record<string, unknown>;

  status: "new";
  assignedTo: null;
  notes: string;

  createdAt: Date;
  updatedAt: Date;
}

const isExecute = process.argv.includes("--execute");

const normalizeKey = (key: string) =>
  key.toLowerCase().replace(/[^a-z0-9]/g, "");

const getString = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return "";
  return String(value).trim();
};

const getField = (
  fields: Record<string, unknown>,
  aliases: string[],
): string => {
  const normalizedFields = Object.entries(fields).map(
    ([key, value]) => [normalizeKey(key), value] as const,
  );

  for (const alias of aliases) {
    const match = normalizedFields.find(([key]) => key === normalizeKey(alias));

    if (match) {
      const value = getString(match[1]);
      if (value) return value;
    }
  }

  return "";
};

const extractCommonFields = (fields: Record<string, unknown>) => {
  let firstName = getField(fields, [
    "firstName",
    "first_name",
    "first name",
    "fname",
  ]);

  let lastName = getField(fields, [
    "lastName",
    "last_name",
    "last name",
    "lname",
  ]);

  // Handle forms that collect a single full name.
  if (!firstName) {
    const fullName = getField(fields, ["fullName", "full_name", "name"]);

    if (fullName) {
      const nameParts = fullName.split(/\s+/);
      firstName = nameParts.shift() || "";
      lastName = lastName || nameParts.join(" ");
    }
  }

  return {
    firstName,
    lastName,

    email: getField(fields, ["email", "emailAddress"]),

    mobile: getField(fields, [
      "mobile",
      "phone",
      "phoneNumber",
      "mobileNumber",
      "contactNumber",
    ]),

    country: getField(fields, ["country", "countryName"]),
  };
};

const validateCommonFields = () => {
  return [];
};

async function migrateLeads() {
  try {
    console.log("\nConnecting to MongoDB...");

    await mongoose.connect(MONGODB_URI!);

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("MongoDB database connection failed.");
    }

    const contactCollection = db.collection("contactsubmissions");
    const scholarshipCollection = db.collection("scholarshipapplications");
    const eventCollection = db.collection("eventregistrations");

    const leadsCollection = db.collection("leads");

    console.log("Connected successfully.\n");

    console.log("Fetching existing submissions...");

    const [contacts, scholarships, events] = await Promise.all([
      contactCollection.find({}).toArray(),
      scholarshipCollection.find({}).toArray(),
      eventCollection.find({}).toArray(),
    ]);

    console.log(`Contacts: ${contacts.length}`);
    console.log(`Scholarship applications: ${scholarships.length}`);
    console.log(`Event registrations: ${events.length}\n`);

    const migratedLeads: MigrationLead[] = [];
    const skipped: string[] = [];

    // -----------------------------------------
    // 1. CONTACT SUBMISSIONS
    // -----------------------------------------

    for (const contact of contacts) {
      const lead: MigrationLead = {
        _id: contact._id as mongoose.Types.ObjectId,

        type: "contact",

        firstName: getString(contact.firstName),
        lastName: getString(contact.lastName),
        email: getString(contact.email).toLowerCase(),
        mobile: getString(contact.mobile),
        country: getString(contact.country),

        message: getString(contact.message),

        termsAccepted: Boolean(contact.termsAccepted),
        marketingConsent: Boolean(contact.marketingConsent),
        profilingConsent: Boolean(contact.profilingConsent),

        status: "new",
        assignedTo: null,
        notes: "",

        createdAt: contact.createdAt || new Date(),
        updatedAt: contact.updatedAt || new Date(),
      };

      //   const missing = validateCommonFields(lead);

      //   if (missing.length) {
      //     skipped.push(`Contact ${contact._id}: Missing ${missing.join(", ")}`);
      //     continue;
      //   }

      migratedLeads.push(lead);
    }

    // -----------------------------------------
    // 2. SCHOLARSHIP APPLICATIONS
    // -----------------------------------------

    for (const application of scholarships) {
      const fields = (application.fields || {}) as Record<string, unknown>;

      const common = extractCommonFields(fields);

      const lead: MigrationLead = {
        _id: application._id as mongoose.Types.ObjectId,

        type: "scholarship",

        ...common,
        email: common.email.toLowerCase(),

        sourceId: application.scholarshipId,
        sourceTitle: application.scholarshipTitle,

        applicationData: fields,

        status: "new",
        assignedTo: null,
        notes: "",

        createdAt: application.createdAt || new Date(),
        updatedAt: application.updatedAt || new Date(),
      };

      //   const missing = validateCommonFields(lead);

      //   if (missing.length) {
      //     skipped.push(
      //       `Scholarship ${application._id}: Missing ${missing.join(", ")}`,
      //     );
      //     continue;
      //   }

      migratedLeads.push(lead);
    }

    // -----------------------------------------
    // 3. EVENT REGISTRATIONS
    // -----------------------------------------

    for (const registration of events) {
      const fields = (registration.fields || {}) as Record<string, unknown>;

      const common = extractCommonFields(fields);

      const lead: MigrationLead = {
        _id: registration._id as mongoose.Types.ObjectId,

        type: "event",

        ...common,
        email: common.email.toLowerCase(),

        sourceId: registration.eventId,
        sourceTitle: registration.eventTitle,

        applicationData: fields,

        status: "new",
        assignedTo: null,
        notes: "",

        createdAt: registration.createdAt || new Date(),
        updatedAt: registration.updatedAt || new Date(),
      };

      //   const missing = validateCommonFields(lead);

      //   if (missing.length) {
      //     skipped.push(
      //       `Event ${registration._id}: Missing ${missing.join(", ")}`,
      //     );
      //     continue;
      //   }

      migratedLeads.push(lead);
    }

    // -----------------------------------------
    // 4. MIGRATION SUMMARY
    // -----------------------------------------

    const contactCount = migratedLeads.filter(
      (lead) => lead.type === "contact",
    ).length;

    const scholarshipCount = migratedLeads.filter(
      (lead) => lead.type === "scholarship",
    ).length;

    const eventCount = migratedLeads.filter(
      (lead) => lead.type === "event",
    ).length;

    console.log("\n========== MIGRATION SUMMARY ==========");

    console.log(`Contacts ready: ${contactCount}`);
    console.log(`Scholarships ready: ${scholarshipCount}`);
    console.log(`Events ready: ${eventCount}`);

    console.log(`Total ready: ${migratedLeads.length}`);
    console.log(`Skipped: ${skipped.length}`);

    if (skipped.length) {
      console.log("\nRecords skipped:");

      skipped.forEach((reason) => {
        console.log(`- ${reason}`);
      });
    }

    // -----------------------------------------
    // 5. DRY RUN OR EXECUTE
    // -----------------------------------------

    if (!isExecute) {
      console.log("\nDRY RUN COMPLETE.");
      console.log("No records were inserted or modified.");
      console.log("Run with --execute to perform the migration.");
      return;
    }

    if (!migratedLeads.length) {
      console.log("\nNo valid records to migrate.");
      return;
    }

    console.log("\nStarting migration...");

    // Process in batches to avoid oversized MongoDB operations.
    const batchSize = 500;
    let migratedCount = 0;

    for (let i = 0; i < migratedLeads.length; i += batchSize) {
      const batch = migratedLeads.slice(i, i + batchSize);

      const operations = batch.map((lead) => ({
        replaceOne: {
          filter: { _id: lead._id },
          replacement: lead,
          upsert: true,
        },
      }));

      await leadsCollection.bulkWrite(operations as any, { ordered: false });

      migratedCount += batch.length;

      console.log(`Processed ${migratedCount}/${migratedLeads.length}`);
    }

    console.log("\n========== MIGRATION COMPLETED ==========");

    console.log(`Successfully processed: ${migratedCount}`);
    console.log(`Skipped: ${skipped.length}`);

    console.log("\nOriginal collections have not been modified.");
  } catch (error) {
    console.error("\nMigration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("\nMongoDB connection closed.");
  }
}

migrateLeads();
