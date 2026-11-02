import mongoose from "mongoose";
import dotenv from "dotenv";

import ExploreInstitute from "../models/ExploreInstitute";
import ExploreArea from "../models/ExploreArea";
import ExploreBrand from "../models/ExploreBrand";
import ExploreCampus from "../models/ExploreCampus";

dotenv.config({ path: ".env.local" });

type RelationshipItem =
  | string
  | mongoose.Types.ObjectId
  | {
      areaId?: string | mongoose.Types.ObjectId;
      brandId?: string | mongoose.Types.ObjectId;
      campusId?: string | mongoose.Types.ObjectId;
      _id?: string | mongoose.Types.ObjectId;
    };

function getId(item: RelationshipItem): string {
  if (typeof item === "string") {
    return item;
  }

  if (item instanceof mongoose.Types.ObjectId) {
    return item.toString();
  }

  // Supports old ObjectId records and already-migrated relationship objects.
  const id = item.areaId ?? item.brandId ?? item.campusId ?? item._id;

  if (!id) {
    throw new Error(
      `Unable to extract ID from relationship: ${JSON.stringify(item)}`,
    );
  }

  return id.toString();
}

async function migrate() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing from .env.local");
  }

  await mongoose.connect(uri);

  console.log("Connected to MongoDB.");

  const institutes = await ExploreInstitute.find({})
    .select("_id name areas brands campuses")
    .lean();

  console.log(`Found ${institutes.length} institutes.`);

  let updatedCount = 0;

  for (const institute of institutes) {
    try {
      const areaIds = (institute.areas ?? []).map((item: any) =>
        getId(item as RelationshipItem),
      );

      const brandIds = (institute.brands ?? []).map((item: any) =>
        getId(item as RelationshipItem),
      );

      const campusIds = (institute.campuses ?? []).map((item: any) =>
        getId(item as RelationshipItem),
      );

      const [areas, brands, campuses] = await Promise.all([
        ExploreArea.find({ _id: { $in: areaIds } })
          .select("_id slug")
          .lean(),

        ExploreBrand.find({ _id: { $in: brandIds } })
          .select("_id slug")
          .lean(),

        ExploreCampus.find({ _id: { $in: campusIds } })
          .select("_id slug")
          .lean(),
      ]);

      const areaMap = new Map(
        areas.map((area) => [area._id.toString(), area.slug]),
      );

      const brandMap = new Map(
        brands.map((brand) => [brand._id.toString(), brand.slug]),
      );

      const campusMap = new Map(
        campuses.map((campus) => [campus._id.toString(), campus.slug]),
      );

      // Abort for this institute if any referenced document is missing.
      const missingAreas = areaIds.filter((id: any) => !areaMap.has(id));
      const missingBrands = brandIds.filter((id: any) => !brandMap.has(id));
      const missingCampuses = campusIds.filter((id: any) => !campusMap.has(id));

      if (
        missingAreas.length ||
        missingBrands.length ||
        missingCampuses.length
      ) {
        throw new Error(
          `Missing references — areas: ${missingAreas.join(", ") || "none"}, ` +
            `brands: ${missingBrands.join(", ") || "none"}, ` +
            `campuses: ${missingCampuses.join(", ") || "none"}`,
        );
      }

      const updatedAreas = areaIds.map((areaId: any) => ({
        areaId: new mongoose.Types.ObjectId(areaId),
        slug: areaMap.get(areaId)!,
      }));

      const updatedBrands = brandIds.map((brandId: any) => ({
        brandId: new mongoose.Types.ObjectId(brandId),
        slug: brandMap.get(brandId)!,
      }));

      const updatedCampuses = campusIds.map((campusId: any) => ({
        campusId: new mongoose.Types.ObjectId(campusId),
        slug: campusMap.get(campusId)!,
      }));

      await ExploreInstitute.collection.updateOne(
        { _id: institute._id },
        {
          $set: {
            areas: updatedAreas,
            brands: updatedBrands,
            campuses: updatedCampuses,
          },
        },
      );

      updatedCount++;

      console.log(`Migrated: ${institute.name}`);
    } catch (error) {
      console.error(
        `Failed to migrate institute "${institute.name}" (${institute._id}):`,
        error,
      );

      throw error; // Stop rather than silently skipping broken references.
    }
  }

  console.log(`\nMigration completed. Updated ${updatedCount} institutes.`);
}

migrate()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
