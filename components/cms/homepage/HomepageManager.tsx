"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "react-toastify";
import HomepageAboutForm from "./HomepageAboutForm";
import type { HomepageAboutContent, HomepageSection } from "@/types/homepage";
import type { Homepage } from "@/types/homepage";
import { getHomepage, updateHomepage } from "@/services/homepage.service";
import HomepageHeroForm from "./HomepageHeroForm";
import HomepageLocationsForm from "./HomepageLocationsForm";
import type { HomepageLocationsContent } from "@/types/homepage";
import UniversityManager from "@/components/cms/universities/UniversityManager";
import type { HomepageAdmissionsContent } from "@/types/homepage";
import HomepageSectionCard from "./HomepageSectionCard";
import HomepageCareerChoicesForm from "./HomepageCareerChoicesForm";
import type { HomepageCareerChoicesContent } from "@/types/homepage";

const emptyAboutContent: HomepageAboutContent = {
  image: null,
  heading: "",
  description: "",
  cta: {
    label: "",
    url: "",
  },
};

const emptyLocationsContent: HomepageLocationsContent = {
  heading: "",
  cta: {
    label: "",
    url: "",
  },
  countries: [],
};

export default function HomepageManager() {
  const [homepage, setHomepage] = useState<Homepage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedHomepage, setSavedHomepage] = useState<Homepage | null>(null);

  useEffect(() => {
    getHomepage()
      .then((data) => {
        if (data) {
          setHomepage(data);
          setSavedHomepage(data);
        } else {
          toast.error("Homepage settings have not been initialized yet.");
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load homepage settings");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!homepage) return;

    setIsSaving(true);

    try {
      const savedHomepage = await toast.promise(updateHomepage(homepage), {
        pending: "Saving homepage changes...",
        success: "Homepage saved successfully",
        error: {
          render({ data }) {
            return data instanceof Error
              ? data.message
              : "Failed to save homepage";
          },
        },
      });

      setHomepage(savedHomepage);
      setSavedHomepage(savedHomepage);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const isSectionDirty = (type: string) => {
    if (!homepage || !savedHomepage) return false;

    const currentSection =
      homepage.sections.find((section) => section.type === type) ?? null;

    const savedSection =
      savedHomepage.sections.find((section) => section.type === type) ?? null;

    return JSON.stringify(currentSection) !== JSON.stringify(savedSection);
  };

  const isHeroDirty = () => {
    if (!homepage || !savedHomepage) return false;

    return JSON.stringify(homepage.hero) !== JSON.stringify(savedHomepage.hero);
  };

  const aboutSection = homepage?.sections.find(
    (section) => section.type === "about",
  );

  const aboutContent = {
    ...emptyAboutContent,
    ...(aboutSection?.content as Partial<HomepageAboutContent> | undefined),
    cta: {
      ...emptyAboutContent.cta,
      ...(aboutSection?.content as Partial<HomepageAboutContent> | undefined)
        ?.cta,
    },
  };

  const updateAboutContent = (content: HomepageAboutContent) => {
    setHomepage((current) => {
      if (!current) return current;

      const existingSection = current.sections.find(
        (section) => section.type === "about",
      );

      const about: HomepageSection = {
        type: "about",
        isVisible: existingSection?.isVisible ?? false,
        order: existingSection?.order ?? 1,
        content: content as unknown as Record<string, unknown>,
      };

      return {
        ...current,
        sections: existingSection
          ? current.sections.map((section) =>
              section.type === "about" ? about : section,
            )
          : [...current.sections, about],
      };
    });
  };

  const universitiesSection = homepage?.sections.find(
    (section) => section.type === "universities",
  );

  const locationsSection = homepage?.sections.find(
    (section) => section.type === "locations",
  );

  const locationsContent: HomepageLocationsContent = {
    ...emptyLocationsContent,
    ...(locationsSection?.content as
      | Partial<HomepageLocationsContent>
      | undefined),
    cta: {
      ...emptyLocationsContent.cta,
      ...(
        locationsSection?.content as
          | Partial<HomepageLocationsContent>
          | undefined
      )?.cta,
    },
    countries:
      (
        locationsSection?.content as
          | Partial<HomepageLocationsContent>
          | undefined
      )?.countries ?? [],
  };

  const updateLocationsContent = (content: HomepageLocationsContent) => {
    setHomepage((current) => {
      if (!current) return current;

      const existingSection = current.sections.find(
        (section) => section.type === "locations",
      );

      const locations: HomepageSection = {
        type: "locations",
        isVisible: existingSection?.isVisible ?? false,
        order: existingSection?.order ?? 2,
        content: content as unknown as Record<string, unknown>,
      };

      return {
        ...current,
        sections: existingSection
          ? current.sections.map((section) =>
              section.type === "locations" ? locations : section,
            )
          : [...current.sections, locations],
      };
    });
  };

  const updateLocationsVisibility = (isVisible: boolean) => {
    setHomepage((current) => {
      if (!current) return current;

      const existingSection = current.sections.find(
        (section) => section.type === "locations",
      );

      const locations: HomepageSection = {
        type: "locations",
        isVisible,
        order: existingSection?.order ?? 2,
        content:
          existingSection?.content ??
          (emptyLocationsContent as unknown as Record<string, unknown>),
      };

      return {
        ...current,
        sections: existingSection
          ? current.sections.map((section) =>
              section.type === "locations" ? locations : section,
            )
          : [...current.sections, locations],
      };
    });
  };

  const updateAboutVisibility = (isVisible: boolean) => {
    setHomepage((current) => {
      if (!current) return current;

      const existingSection = current.sections.find(
        (section) => section.type === "about",
      );

      const about: HomepageSection = {
        type: "about",
        isVisible,
        order: existingSection?.order ?? 1,
        content:
          existingSection?.content ??
          (emptyAboutContent as unknown as Record<string, unknown>),
      };

      return {
        ...current,
        sections: existingSection
          ? current.sections.map((section) =>
              section.type === "about" ? about : section,
            )
          : [...current.sections, about],
      };
    });
  };

  const updateUniversitiesVisibility = (isVisible: boolean) => {
    setHomepage((current) => {
      if (!current) return current;

      const existing = current.sections.find(
        (section) => section.type === "universities",
      );

      const universities: HomepageSection = {
        type: "universities",
        isVisible,
        order: existing?.order ?? 4,
        content: existing?.content ?? {},
      };

      return {
        ...current,
        sections: existing
          ? current.sections.map((section) =>
              section.type === "universities" ? universities : section,
            )
          : [...current.sections, universities],
      };
    });
  };

  const emptyCareerChoicesContent: HomepageCareerChoicesContent = {
    heading: "Elite Career Choices",
    cards: [],
  };

  const careerChoicesSection = homepage?.sections.find(
    (section) => section.type === "careerChoices",
  );

  const careerChoicesContent: HomepageCareerChoicesContent = {
    ...emptyCareerChoicesContent,
    ...(careerChoicesSection?.content as
      | Partial<HomepageCareerChoicesContent>
      | undefined),
    cards:
      (
        careerChoicesSection?.content as
          | Partial<HomepageCareerChoicesContent>
          | undefined
      )?.cards ?? [],
  };

  const updateCareerChoicesContent = (
    content: HomepageCareerChoicesContent,
  ) => {
    setHomepage((current) => {
      if (!current) return current;

      const existingSection = current.sections.find(
        (section) => section.type === "careerChoices",
      );

      const careerChoices: HomepageSection = {
        type: "careerChoices",
        isVisible: existingSection?.isVisible ?? false,
        order: existingSection?.order ?? 5,
        content: content as unknown as Record<string, unknown>,
      };

      return {
        ...current,
        sections: existingSection
          ? current.sections.map((section) =>
              section.type === "careerChoices" ? careerChoices : section,
            )
          : [...current.sections, careerChoices],
      };
    });
  };

  const updateCareerChoicesVisibility = (isVisible: boolean) => {
    setHomepage((current) => {
      if (!current) return current;

      const existingSection = current.sections.find(
        (section) => section.type === "careerChoices",
      );

      const careerChoices: HomepageSection = {
        type: "careerChoices",
        isVisible,
        order: existingSection?.order ?? 5,
        content:
          existingSection?.content ??
          (emptyCareerChoicesContent as unknown as Record<string, unknown>),
      };

      return {
        ...current,
        sections: existingSection
          ? current.sections.map((section) =>
              section.type === "careerChoices" ? careerChoices : section,
            )
          : [...current.sections, careerChoices],
      };
    });
  };

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading homepage...</p>;
  }

  if (!homepage) {
    return (
      <p className="text-sm text-red-600">
        Could not load homepage settings. Please refresh and try again.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-zinc-50/95 py-4 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Homepage CMS</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the homepage content section by section.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
      <div className="space-y-4">
        <HomepageSectionCard
          number="01"
          title="Hero Section"
          description="Background video, heading, subtitle and two CTAs"
          isDirty={isHeroDirty()}
          // defaultOpen
        >
          <HomepageHeroForm
            hero={homepage.hero}
            onChange={(hero) =>
              setHomepage((current) =>
                current ? { ...current, hero } : current,
              )
            }
          />
        </HomepageSectionCard>

        <HomepageSectionCard
          number="02"
          title="Who We Are & What We Do"
          description="Image, introduction and CTA"
          isDirty={isSectionDirty("about")}
        >
          <HomepageAboutForm
            content={aboutContent}
            isVisible={aboutSection?.isVisible ?? false}
            onChange={updateAboutContent}
            onVisibilityChange={updateAboutVisibility}
          />
        </HomepageSectionCard>

        <HomepageSectionCard
          number="03"
          title="Study in Prestigious Locations"
          description="Section heading, link and country image cards"
          isDirty={isSectionDirty("locations")}
        >
          <HomepageLocationsForm
            content={locationsContent}
            isVisible={locationsSection?.isVisible ?? false}
            onChange={updateLocationsContent}
            onVisibilityChange={updateLocationsVisibility}
          />
        </HomepageSectionCard>

        <HomepageSectionCard
          number="04"
          title="Universities"
          description="Manage university logos, background images, highlights and links"
        >
          <UniversityManager
            isVisible={universitiesSection?.isVisible ?? false}
            onVisibilityChange={updateUniversitiesVisibility}
          />
        </HomepageSectionCard>

        <HomepageSectionCard
          number="05"
          title="Elite Career Choices"
          description="Manage career cards, images, categories and source names"
          isDirty={isSectionDirty("careerChoices")}
        >
          <HomepageCareerChoicesForm
            content={careerChoicesContent}
            onChange={updateCareerChoicesContent}
            isVisible={careerChoicesSection?.isVisible ?? false}
            onVisibilityChange={updateCareerChoicesVisibility}
          />
        </HomepageSectionCard>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 p-6">
        <h2 className="text-sm font-semibold text-zinc-900">
          More homepage sections
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          We'll add the next sections here as we work through your homepage.
        </p>
      </div>
    </div>
  );
}
