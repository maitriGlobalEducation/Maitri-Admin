import mongoose from "mongoose";
import ExploreInstitute from "@/models/ExploreInstitute";

export const cleanText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export function parseImage(value: unknown) {
  if (!value || typeof value !== "object") {
    return { url: "", publicId: "" };
  }

  const image = value as Record<string, unknown>;

  return {
    url: cleanText(image.url),
    publicId: cleanText(image.publicId),
  };
}

export function validImage(value: unknown) {
  const image = parseImage(value);

  if (!image.url || !image.publicId) return null;

  return image;
}

export async function validInstitute(id: unknown) {
  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
    return false;
  }

  return Boolean(await ExploreInstitute.exists({ _id: id }));
}

export function validId(id: string) {
  return mongoose.isValidObjectId(id);
}
