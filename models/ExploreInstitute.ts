import mongoose, { Schema } from "mongoose";

const InstituteImageSchema = new Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  { _id: false },
);

const ExploreInstituteSchema = new Schema(
  {
    name: {
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

    shortDescription: {
      type: String,
      default: "",
      trim: true,
    },

    logo: {
      type: InstituteImageSchema,
      default: null,
    },

    banner: {
      type: InstituteImageSchema,
      default: null,
    },

    // Existing plain-text overview retained for compatibility.
    overview: {
      type: String,
      default: "",
      trim: true,
    },

    // TipTap JSON document.
    content: {
      type: Schema.Types.Mixed,
      default: () => ({
        type: "doc",
        content: [{ type: "paragraph" }],
      }),
    },

    // Independent Explore relationships.
    areas: [
      {
        type: Schema.Types.ObjectId,
        ref: "ExploreArea",
      },
    ],

    brands: [
      {
        type: Schema.Types.ObjectId,
        ref: "ExploreBrand",
      },
    ],

    campuses: [
      {
        type: Schema.Types.ObjectId,
        ref: "ExploreCampus",
      },
    ],

    // SEO.
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

    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

ExploreInstituteSchema.index({ status: 1, sortOrder: 1 });
ExploreInstituteSchema.index({ areas: 1 });
ExploreInstituteSchema.index({ brands: 1 });
ExploreInstituteSchema.index({ campuses: 1 });
ExploreInstituteSchema.index({ createdAt: -1 });

const ExploreInstitute =
  mongoose.models.ExploreInstitute ||
  mongoose.model("ExploreInstitute", ExploreInstituteSchema);

export default ExploreInstitute;
