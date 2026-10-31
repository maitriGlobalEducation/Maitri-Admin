import mongoose, { Schema } from "mongoose";

const ExploreCategorySchema = new Schema(
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
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

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

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  { timestamps: true },
);

ExploreCategorySchema.index({ status: 1, sortOrder: 1 });
ExploreCategorySchema.index({ createdAt: -1 });

const ExploreCategory =
  mongoose.models.ExploreCategory ||
  mongoose.model("ExploreCategory", ExploreCategorySchema);

export default ExploreCategory;
