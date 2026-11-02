import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

import { connectDB } from "@/lib/mongodb";
import ExploreArea from "@/models/ExploreArea";
import { createSlug } from "@/lib/slug";

async function backfillAreaSlugs() {
  await connectDB();

  const areas = await ExploreArea.find().sort({ createdAt: 1 });

  const usedSlugs = new Set<string>();

  for (const area of areas) {
    const baseSlug = createSlug(area.name);
    let slug = baseSlug;
    let suffix = 2;

    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    usedSlugs.add(slug);

    area.slug = slug;
    await area.save();

    console.log(`Updated: ${area.name} -> ${slug}`);
  }

  console.log("Area slug migration complete.");
  process.exit(0);
}

backfillAreaSlugs().catch((error) => {
  console.error(error);
  process.exit(1);
});
