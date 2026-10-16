import mongoose, { Schema, type Model } from "mongoose";

export interface IEventCategory {
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventCategorySchema = new Schema<IEventCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
  },
  { timestamps: true },
);

const EventCategory: Model<IEventCategory> =
  mongoose.models.EventCategory ??
  mongoose.model<IEventCategory>("EventCategory", EventCategorySchema);

export default EventCategory;
