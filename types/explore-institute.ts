export type ExploreInstituteStatus = "draft" | "published";

export interface InstituteImage {
  url: string;
  publicId: string;
}

export interface InstituteCampus {
  _id?: string;
  name: string;
  city: string;
  country: string;
  description: string;
}

export interface ExploreInstitute {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  logo: InstituteImage | null;
  banner: InstituteImage | null;
  overview: string;
  content: Record<string, unknown>;
  campuses: InstituteCampus[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  focusKeyword: string;
  sortOrder: number;
  status: ExploreInstituteStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExploreInstituteInput = {
  name: string;
  slug: string;
  shortDescription: string;
  logo: InstituteImage | null;
  banner: InstituteImage | null;
  areas: string[];
  brands: string[];
  campuses: string[];
  overview: string;
  content: Record<string, unknown>; // Keep your existing content type here if it is already defined.
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  focusKeyword: string;
  sortOrder: number;
  status: ExploreInstituteStatus;
  featured: boolean;
};
