import mongoose, { Schema, type Model } from "mongoose";

export type LeadType = "contact" | "scholarship" | "event";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost";

export interface LeadAssignment {
  assignedTo: mongoose.Types.ObjectId | null;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  action: "assigned" | "unassigned";
}

export interface LeadDocument extends mongoose.Document {
  type: LeadType;

  // Common information
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  country: string;

  // Contact-specific
  message?: string;
  termsAccepted?: boolean;
  marketingConsent?: boolean;
  profilingConsent?: boolean;

  // Scholarship / Event-specific
  sourceId?: mongoose.Types.ObjectId;
  sourceTitle?: string;
  applicationData?: Record<string, unknown>;

  // CRM management
  status: LeadStatus;
  assignedTo?: mongoose.Types.ObjectId | null;
  assignedBy?: mongoose.Types.ObjectId | null;
  assignedAt?: Date | null;
  assignmentHistory: LeadAssignment[];
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<LeadAssignment>(
  {
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    action: {
      type: String,
      enum: ["assigned", "unassigned"],
      required: true,
    },
  },
  { _id: false },
);

const LeadSchema = new Schema<LeadDocument>(
  {
    type: {
      type: String,
      enum: ["contact", "scholarship", "event"],
      required: true,
      index: true,
    },

    // Common information
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    country: {
      type: String,
      default: "",
      trim: true,
    },

    // Contact-specific
    message: {
      type: String,
      trim: true,
      maxlength: 10000,
    },

    termsAccepted: {
      type: Boolean,
      default: false,
    },

    marketingConsent: {
      type: Boolean,
      default: false,
    },

    profilingConsent: {
      type: Boolean,
      default: false,
    },

    // Scholarship / Event reference
    sourceId: {
      type: Schema.Types.ObjectId,
    },

    sourceTitle: {
      type: String,
      trim: true,
    },

    // Dynamic application form responses
    applicationData: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // CRM management
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "converted", "lost"],
      default: "new",
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    assignmentHistory: {
      type: [AssignmentSchema],
      default: [],
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "leads",
  },
);

LeadSchema.index({ type: 1, createdAt: -1 });
LeadSchema.index({ email: 1 });
LeadSchema.index({ status: 1, createdAt: -1 });
LeadSchema.index({ assignedTo: 1, createdAt: -1 });
LeadSchema.index({ type: 1, status: 1, createdAt: -1 });

const Lead: Model<LeadDocument> =
  (mongoose.models.Lead as Model<LeadDocument> | undefined) ??
  mongoose.model<LeadDocument>("Lead", LeadSchema);

export default Lead;
