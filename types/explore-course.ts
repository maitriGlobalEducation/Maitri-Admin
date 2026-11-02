export type ExploreCourseStatus = "draft" | "published";

export type CourseDurationUnit = "days" | "weeks" | "months" | "years";

export const COURSE_INTAKES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const COURSE_LANGUAGES = [
  "English",
  "Italian",
  "Italian & English",
  "French",
  "Spanish",
  "German",
] as const;

export type CourseIntake = (typeof COURSE_INTAKES)[number];
export type CourseLanguage = (typeof COURSE_LANGUAGES)[number];

export type CourseCampusOfferingInput = {
  campus: string;
  intakes: CourseIntake[];
  language: CourseLanguage;
};

export type ExploreCourseInput = {
  name: string;
  slug: string;
  courseCategory: string;
  area: string;
  institute: string;

  duration: {
    value: number;
    unit: CourseDurationUnit;
  };

  durationFeatures: string;
  campusOfferings: CourseCampusOfferingInput[];

  description: Record<string, unknown>;

  status: ExploreCourseStatus;
  sortOrder: number;
};

export type CourseReference = {
  _id: string;
  name: string;
};

export type CourseCampusOffering = {
  _id?: string;
  campus: string | CourseReference;
  intakes: CourseIntake[];
  language: CourseLanguage;
};

export type ExploreCourse = Omit<
  ExploreCourseInput,
  "courseCategory" | "area" | "institute" | "campusOfferings"
> & {
  _id: string;
  courseCategory: string | CourseReference;
  area: string | CourseReference;
  institute: string | CourseReference;
  campusOfferings: CourseCampusOffering[];
  createdAt: string;
  updatedAt: string;
};
