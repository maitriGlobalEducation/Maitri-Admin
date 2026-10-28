import mongoose, { Schema, type Model } from "mongoose";

export interface ContactSubmissionDocument extends mongoose.Document {
  firstName: string;
  lastName: string;
  country: string;
  mobile: string;
  email: string;
  message: string;
  termsAccepted: boolean;
  marketingConsent: boolean;
  profilingConsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSubmissionSchema = new Schema<ContactSubmissionDocument>(
  {
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
    country: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    termsAccepted: {
      type: Boolean,
      required: true,
      validate: {
        validator: (value: boolean) => value === true,
        message: "Terms acceptance is required.",
      },
    },
    marketingConsent: {
      type: Boolean,
      default: false,
    },
    profilingConsent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "contactsubmissions",
  },
);

const ContactSubmission: Model<ContactSubmissionDocument> =
  mongoose.models.ContactSubmission ??
  mongoose.model<ContactSubmissionDocument>(
    "ContactSubmission",
    ContactSubmissionSchema,
  );

export default ContactSubmission;
