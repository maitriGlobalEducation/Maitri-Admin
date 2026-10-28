import mongoose, { Schema, type Model } from "mongoose";

export interface ScholarshipApplicationDocument extends mongoose.Document {
  scholarshipId: mongoose.Types.ObjectId;
  scholarshipTitle: string;
  fields: Record<string, string | boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const ScholarshipApplicationSchema = new Schema<ScholarshipApplicationDocument>(
  {
    scholarshipId: {
      type: Schema.Types.ObjectId,
      ref: "Scholarship",
      required: true,
      index: true,
    },
    scholarshipTitle: {
      type: String,
      required: true,
      trim: true,
    },
    fields: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "scholarshipapplications",
  },
);

const ScholarshipApplication: Model<ScholarshipApplicationDocument> =
  mongoose.models.ScholarshipApplication ??
  mongoose.model<ScholarshipApplicationDocument>(
    "ScholarshipApplication",
    ScholarshipApplicationSchema,
  );

export default ScholarshipApplication;
