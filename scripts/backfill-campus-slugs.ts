import { connectDB } from "@/lib/mongodb";
import ExploreCampus from "@/models/ExploreCampus";
import { createSlug } from "@/lib/slug";

async function backfillCampusSlugs() {
  await connectDB();

  const campuses = await ExploreCampus.find().sort({ createdAt: 1 });

  const usedSlugs = new Set<string>();

  for (const campus of campuses) {
    const baseSlug = createSlug(campus.name);

    let slug = baseSlug;
    let suffix = 2;

    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    usedSlugs.add(slug);

    campus.slug = slug;
    await campus.save();

    console.log(`${campus.name} -> ${slug}`);
  }

  console.log("Campus slug migration complete.");
  process.exit(0);
}

backfillCampusSlugs().catch((error) => {
  console.error(error);
  process.exit(1);
});
