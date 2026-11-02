import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

async function backfillCourseReferenceSlugs() {
  const { connectDB } = await import("@/lib/mongodb");

  const { default: ExploreCourse } = await import("@/models/ExploreCourse");
  const { default: ExploreCourseCategory } =
    await import("@/models/ExploreCourseCategory");
  const { default: ExploreArea } = await import("@/models/ExploreArea");
  const { default: ExploreInstitute } =
    await import("@/models/ExploreInstitute");
  const { default: ExploreCampus } = await import("@/models/ExploreCampus");

  await connectDB();

  // Raw collections bypass Mongoose schema casting.
  const coursesCollection = ExploreCourse.collection;
  const categoriesCollection = ExploreCourseCategory.collection;
  const areasCollection = ExploreArea.collection;
  const institutesCollection = ExploreInstitute.collection;
  const campusesCollection = ExploreCampus.collection;

  const courses = await coursesCollection.find({}).toArray();

  console.log(`Found ${courses.length} courses to process.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const course of courses) {
    const updates: Record<string, unknown> = {};

    // Course category
    const categoryId =
      course.courseCategory?.categoryId ?? course.courseCategory;

    const category = categoryId
      ? await categoriesCollection.findOne({ _id: categoryId })
      : null;

    if (category?.slug) {
      updates.courseCategory = {
        categoryId: category._id,
        slug: category.slug,
      };
    } else {
      console.warn(`Category not found for "${course.name}": ${categoryId}`);
    }

    // Area
    const areaId = course.area?.areaId ?? course.area;

    const area = areaId ? await areasCollection.findOne({ _id: areaId }) : null;

    if (area?.slug) {
      updates.area = {
        areaId: area._id,
        slug: area.slug,
      };
    } else {
      console.warn(`Area not found for "${course.name}": ${areaId}`);
    }

    // Institute
    const instituteId = course.institute?.instituteId ?? course.institute;

    const institute = instituteId
      ? await institutesCollection.findOne({ _id: instituteId })
      : null;

    if (institute?.slug) {
      updates.institute = {
        instituteId: institute._id,
        slug: institute.slug,
      };
    } else {
      console.warn(`Institute not found for "${course.name}": ${instituteId}`);
    }

    // Campus offerings
    const campusOfferings = [];

    for (const offering of course.campusOfferings ?? []) {
      const campusId = offering.campus?.campusId ?? offering.campus;

      const campus = campusId
        ? await campusesCollection.findOne({ _id: campusId })
        : null;

      if (campus?.slug) {
        campusOfferings.push({
          ...offering,
          campus: {
            campusId: campus._id,
            slug: campus.slug,
          },
        });
      } else {
        console.warn(
          `Campus not found for course "${course.name}": ${campusId}`,
        );

        campusOfferings.push(offering);
      }
    }

    updates.campusOfferings = campusOfferings;

    // Only update if all required references were resolved.
    const allReferencesFound =
      Boolean(category?.slug) &&
      Boolean(area?.slug) &&
      Boolean(institute?.slug) &&
      (course.campusOfferings ?? []).length ===
        campusOfferings.filter(
          (offering: any) => offering.campus?.campusId && offering.campus?.slug,
        ).length;

    if (!allReferencesFound) {
      console.warn(`Skipping incomplete course: ${course.name}`);
      skippedCount++;
      continue;
    }

    await coursesCollection.updateOne({ _id: course._id }, { $set: updates });

    updatedCount++;
    console.log(`Updated: ${course.name}`);
  }

  console.log("\nMigration complete.");
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);

  process.exit(0);
}

backfillCourseReferenceSlugs().catch((error) => {
  console.error("Course migration failed:", error);
  process.exit(1);
});
