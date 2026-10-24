export type EventStatus = "draft" | "published";

export type EventFieldType =
  | "text"
  | "email"
  | "phone"
  | "select"
  | "date"
  | "checkbox";

export interface EventImage {
  url: string;
  publicId: string;
}

export interface EventRegistrationField {
  key: string;
  label: string;
  type: EventFieldType;
  required: boolean;
}

export interface EventRegistrationForm {
  fields: EventRegistrationField[];
}

export interface Event {
  _id: string;

  title: string;
  slug: string;
  category: string;
  eventDate: string;
  eventTime: string;

  cardImage: EventImage | null;
  contentImage: EventImage | null;

  content: Record<string, unknown>;
  eventTimezone: string;
  registrationForm: EventRegistrationForm;

  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  focusKeyword: string;

  status: EventStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}
