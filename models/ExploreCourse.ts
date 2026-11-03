import mongoose, { Schema } from "mongoose";

const CourseScholarshipSchema = new mongoose.Schema(
  {
    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scholarship",
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const CourseCategoryReferenceSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ExploreCourseCategory",
      required: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { _id: false },
);

const AreaReferenceSchema = new Schema(
  {
    areaId: {
      type: Schema.Types.ObjectId,
      ref: "ExploreArea",
      required: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { _id: false },
);

const InstituteReferenceSchema = new Schema(
  {
    instituteId: {
      type: Schema.Types.ObjectId,
      ref: "ExploreInstitute",
      required: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { _id: false },
);

const CampusReferenceSchema = new Schema(
  {
    campusId: {
      type: Schema.Types.ObjectId,
      ref: "ExploreCampus",
      required: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { _id: false },
);

const CampusOfferingSchema = new Schema(
  {
    campus: {
      type: CampusReferenceSchema,
      required: true,
    },
    intakes: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => value.length > 0,
        message: "At least one intake month is required.",
      },
    },
    language: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true },
);

const ExploreCourseSchema = new Schema(
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

    courseCategory: {
      type: CourseCategoryReferenceSchema,
      required: true,
    },

    area: {
      type: AreaReferenceSchema,
      required: true,
    },

    institute: {
      type: InstituteReferenceSchema,
      required: true,
    },

    fees: {
      type: String,
      required: true,
      trim: true,
    },

    scholarships: {
      type: [CourseScholarshipSchema],
      default: [],
    },

    duration: {
      value: {
        type: Number,
        required: true,
        min: 1,
      },
      unit: {
        type: String,
        enum: ["days", "weeks", "months", "years"],
        required: true,
      },
    },

    durationFeatures: {
      type: String,
      default: "",
      trim: true,
    },

    campusOfferings: {
      type: [CampusOfferingSchema],
      default: [],
    },

    description: {
      type: Schema.Types.Mixed,
      default: () => ({
        type: "doc",
        content: [{ type: "paragraph" }],
      }),
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

ExploreCourseSchema.index({ status: 1, sortOrder: 1 });
ExploreCourseSchema.index({ institute: 1 });
ExploreCourseSchema.index({ area: 1 });
ExploreCourseSchema.index({ courseCategory: 1 });
ExploreCourseSchema.index({ createdAt: -1 });
ExploreCourseSchema.index({ name: 1 });

const ExploreCourse =
  mongoose.models.ExploreCourse ||
  mongoose.model("ExploreCourse", ExploreCourseSchema);

export default ExploreCourse;
