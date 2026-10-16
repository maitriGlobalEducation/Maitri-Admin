import mongoose, { Schema } from "mongoose";

const CTASchema = new Schema(
  {
    label: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    enabled: { type: Boolean, default: false },
  },
  { _id: false },
);

const HeroSchema = new Schema(
  {
    backgroundVideo: {
      url: { type: String, trim: true, default: "" },
      publicId: { type: String, trim: true, default: "" },
    },
    heading: { type: String, trim: true, default: "" },
    subtitle: { type: String, trim: true, default: "" },
    cta1: {
      type: CTASchema,
      default: () => ({}),
    },
    cta2: {
      type: CTASchema,
      default: () => ({}),
    },
    overlayOpacity: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const HomepageSectionSchema = new Schema(
  {
    type: { type: String, required: true },
    isVisible: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    content: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false },
);

const HomepageSEOSchema = new Schema(
  {
    metaTitle: {
      type: String,
      trim: true,
      default: "",
    },
    metaDescription: {
      type: String,
      trim: true,
      default: "",
    },
    metaKeywords: {
      type: [String],
      default: [],
    },
    focusKeyword: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const HomepageSchema = new Schema(
  {
    hero: {
      type: HeroSchema,
      default: () => ({}),
    },
    sections: {
      type: [HomepageSectionSchema],
      default: [],
    },
    seo: {
      type: HomepageSEOSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

const Homepage =
  mongoose.models.Homepage || mongoose.model("Homepage", HomepageSchema);

export default Homepage;
