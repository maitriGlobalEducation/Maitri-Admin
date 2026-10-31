import mongoose, { Schema } from "mongoose";

const ExploreAreaSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

const ExploreArea =
  mongoose.models.ExploreArea ||
  mongoose.model("ExploreArea", ExploreAreaSchema);

export default ExploreArea;
