import mongoose, { Schema } from "mongoose";

const ExploreCourseCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

ExploreCourseCategorySchema.index({ name: 1 }, { unique: true });

const ExploreCourseCategory =
  mongoose.models.ExploreCourseCategory ||
  mongoose.model("ExploreCourseCategory", ExploreCourseCategorySchema);

export default ExploreCourseCategory;
