import mongoose, { Schema } from "mongoose";

const EventImageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const EventRegistrationFieldSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },

    label: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["text", "email", "phone", "select", "date", "checkbox"],
      required: true,
    },

    required: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const EventRegistrationFormSchema = new Schema(
  {
    fields: {
      type: [EventRegistrationFieldSchema],
      default: [],
    },
  },
  { _id: false },
);

const EventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    category: {
      type: String,
      ref: "EventCategory",
    },

    eventDate: {
      type: String, // Local date: YYYY-MM-DD
      required: true,
      trim: true,
    },

    eventTime: {
      type: String, // Local time: HH:mm
      required: true,
      trim: true,
    },

    eventTimezone: {
      type: String, // IANA timezone, e.g. Europe/Rome
      required: true,
      trim: true,
    },

    eventStartsAt: {
      type: Date, // Actual instant stored in UTC
      required: true,
    },

    cardImage: {
      type: EventImageSchema,
      default: null,
    },

    contentImage: {
      type: EventImageSchema,
      default: null,
    },

    content: {
      type: Schema.Types.Mixed,
      required: true,
    },

    registrationForm: {
      type: EventRegistrationFormSchema,
      default: () => ({
        fields: [],
      }),
    },

    // SEO
    metaTitle: {
      type: String,
      default: "",
      trim: true,
    },

    metaDescription: {
      type: String,
      default: "",
      trim: true,
    },

    metaKeywords: {
      type: [String],
      default: [],
    },

    focusKeyword: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  },
);

const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

export default Event;
