export type ExploreStatus = "draft" | "published";

export interface ExploreCategory {
  _id: string;
  title: string;
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  focusKeyword: string;
  sortOrder: number;
  status: ExploreStatus;
  createdAt: string;
  updatedAt: string;
}

export type ExploreCategoryInput = Omit<
  ExploreCategory,
  "_id" | "createdAt" | "updatedAt"
>;
