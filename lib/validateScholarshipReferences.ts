import Scholarship from "@/models/Scholarship";
import mongoose from "mongoose";

export async function validateScholarshipReferences(
  scholarshipIds: unknown,
): Promise<{
  error?: string;
  data?: {
    scholarshipId: mongoose.Types.ObjectId;
    slug: string;
  }[];
}> {
  if (!Array.isArray(scholarshipIds)) {
    return {
      error: "Invalid scholarships.",
    };
  }

  if (scholarshipIds.some((id) => !mongoose.isValidObjectId(id))) {
    return {
      error: "Invalid scholarship ID.",
    };
  }

  const uniqueIds = [...new Set(scholarshipIds.map(String))];

  const scholarships = await Scholarship.find({
    _id: { $in: uniqueIds },
  })
    .select("_id slug")
    .lean();

  if (scholarships.length !== uniqueIds.length) {
    return {
      error: "One or more scholarships could not be found.",
    };
  }

  const scholarshipMap = new Map(
    scholarships.map((scholarship) => [String(scholarship._id), scholarship]),
  );

  return {
    data: uniqueIds.map((id) => {
      const scholarship = scholarshipMap.get(id)!;

      return {
        scholarshipId: scholarship._id,
        slug: scholarship.slug,
      };
    }),
  };
}
