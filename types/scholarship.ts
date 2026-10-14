export type ScholarshipStatus = "draft" | "published";

export type ScholarshipFieldType =
  | "text"
  | "email"
  | "phone"
  | "select"
  | "date"
  | "checkbox";

export interface ScholarshipImage {
  url: string;
  publicId: string;
}

export interface ScholarshipFormField {
  key: string;
  label: string;
  type: ScholarshipFieldType;
  required: boolean;
  options?: string[];
}

export interface ScholarshipApplicationForm {
  fields: ScholarshipFormField[];
}

export interface Scholarship {
  _id: string;

  title: string;
  description: string;
  amount: string | null;
  slug: string;

  cardImage: ScholarshipImage | null;
  logo: ScholarshipImage | null;
  wallpaper: ScholarshipImage | null;
  contentImage: ScholarshipImage | null;

  deadline: string | null;

  content: Record<string, unknown>;

  applicationForm: ScholarshipApplicationForm;

  ctaLabel: string;
  ctaUrl: string;

  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  focusKeyword: string;

  status: ScholarshipStatus;

  createdAt: string;
  updatedAt: string;
}
