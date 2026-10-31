import mongoose, { Schema } from "mongoose";

const ExploreBrandSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
  },
  { timestamps: true },
);

const ExploreBrand =
  mongoose.models.ExploreBrand ||
  mongoose.model("ExploreBrand", ExploreBrandSchema);

export default ExploreBrand;
