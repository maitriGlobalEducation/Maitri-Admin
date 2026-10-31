import mongoose, { Schema } from "mongoose";

const CampusSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const ExploreCampus =
  mongoose.models.ExploreCampus ||
  mongoose.model("ExploreCampus", CampusSchema);

export default ExploreCampus;
