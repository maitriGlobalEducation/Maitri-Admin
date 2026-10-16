export interface HomepageVideo {
  url: string;
  publicId: string;
}

export interface HomepageCTA {
  label: string;
  url: string;
  enabled: boolean;
}

export interface HomepageHero {
  backgroundVideo: HomepageVideo | null;
  heading: string;
  subtitle: string;
  cta1: HomepageCTA;
  cta2: HomepageCTA;
  overlayOpacity: number;
  isVisible: boolean;
}

export interface HomepageImage {
  url: string;
  publicId: string;
}

export interface HomepageAboutContent {
  image: HomepageImage | null;
  heading: string;
  description: string;
  cta: {
    label: string;
    url: string;
  };
}

export interface HomepageSection {
  type: string;
  isVisible: boolean;
  order: number;
  content: Record<string, unknown>;
}

export interface HomepageSEO {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  focusKeyword: string;
}

export interface Homepage {
  _id?: string;
  hero: HomepageHero;
  sections: HomepageSection[];
  seo?: HomepageSEO;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomepageCountryCard {
  countryName: string;
  image: HomepageImage | null;
}

export interface HomepageLocationsContent {
  heading: string;
  cta: {
    label: string;
    url: string;
  };
  countries: HomepageCountryCard[];
}

export interface HomepageNavigationLink {
  label: string;
  url: string;
}

export interface HomepageAdmissionsContent {
  heading: string;
  navigationLinks: HomepageNavigationLink[];
}

export interface HomepageUniversityCard {
  id: string;
  name: string;
  slug: string;
  country: string;
  logo: HomepageImage | null;
  reportLabel: string;
  reportYear: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface HomepageUniversitiesContent {
  heading: string;
  cards: HomepageUniversityCard[];
}

export interface HomepageCareerChoiceCard {
  id: string;
  image: {
    url: string;
    publicId: string;
  } | null;
  tags: string[];
  title: string;
  source: string;
}

export interface HomepageCareerChoicesContent {
  heading: string;
  cards: HomepageCareerChoiceCard[];
}
