import mongoose, { Schema } from "mongoose";

const ExploreCourseCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true },
);

const ExploreCourseCategory =
  mongoose.models.ExploreCourseCategory ||
  mongoose.model("ExploreCourseCategory", ExploreCourseCategorySchema);

export default ExploreCourseCategory;
