import mongoose, { Schema, type Model } from "mongoose";

export interface EventRegistrationDocument extends mongoose.Document {
  eventId: mongoose.Types.ObjectId;
  eventTitle: string;
  fields: Record<string, string | boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const EventRegistrationSchema = new Schema<EventRegistrationDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    eventTitle: {
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
    collection: "eventregistrations",
  },
);

const EventRegistration: Model<EventRegistrationDocument> =
  mongoose.models.EventRegistration ??
  mongoose.model<EventRegistrationDocument>(
    "EventRegistration",
    EventRegistrationSchema,
  );

export default EventRegistration;
