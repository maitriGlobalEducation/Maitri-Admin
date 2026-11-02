import { connectDB } from "@/lib/mongodb";
import ExploreBrand from "@/models/ExploreBrand";
import { createSlug } from "@/lib/slug";

async function backfillBrandSlugs() {
  await connectDB();

  const brands = await ExploreBrand.find().sort({ createdAt: 1 });
  const usedSlugs = new Set<string>();

  for (const brand of brands) {
    const baseSlug = createSlug(brand.name);

    let slug = baseSlug;
    let suffix = 2;

    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    usedSlugs.add(slug);

    brand.slug = slug;
    await brand.save();

    console.log(`${brand.name} -> ${slug}`);
  }

  console.log("Brand slug migration complete.");
  process.exit(0);
}

backfillBrandSlugs().catch((error) => {
  console.error(error);
  process.exit(1);
});
