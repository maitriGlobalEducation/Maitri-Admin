"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import ScholarshipApplicationFormBuilder from "./ScholarshipApplicationFormBuilder";
import BlogEditor from "@/components/cms/blogs/BlogEditor";

import type {
  Scholarship,
  ScholarshipFormField,
  ScholarshipImage,
} from "@/types/scholarship";

import { uploadImage } from "@/services/media.service";
import ScholarshipSingleImageUploader from "./ScholarshipSingleImageUploader";

interface ScholarshipFormProps {
  scholarship: Scholarship | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  slug: string;
  description: string;
  amount: string;
  deadline: string;
  ctaLabel: string;
  ctaUrl: string;
  content: Record<string, unknown>;

  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  focusKeyword: string;

  status: "draft" | "published";
  applicationFields: ScholarshipFormField[];
}

const initialFormData: FormData = {
  title: "",
  slug: "",
  description: "",
  amount: "",
  deadline: "",
  ctaLabel: "Learn More",
  ctaUrl: "",

  content: {
    type: "doc",
    content: [{ type: "paragraph" }],
  },

  metaTitle: "",
  metaDescription: "",
  metaKeywords: [],
  focusKeyword: "",

  status: "draft",
  applicationFields: [],
};

export default function ScholarshipForm({
  scholarship,
  onSuccess,
  onCancel,
}: ScholarshipFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [cardImage, setCardImage] = useState<ScholarshipImage | null>(null);
  const [wallpaper, setWallpaper] = useState<ScholarshipImage | null>(null);
  const [logo, setLogo] = useState<ScholarshipImage | null>(null);

  const [uploadingImage, setUploadingImage] = useState<
    "cardImage" | "wallpaper" | "logo" | null
  >(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [metaKeywordsInput, setMetaKeywordsInput] = useState("");

  const isEditing = Boolean(scholarship);

  useEffect(() => {
    if (scholarship) {
      const loadedImages = [
        scholarship.cardImage,
        scholarship.contentImage,
      ].filter(Boolean) as {
        url: string;
        publicId: string;
      }[];

      const uniqueImages = loadedImages.filter(
        (image, index, array) =>
          array.findIndex((item) => item.publicId === image.publicId) === index,
      );

      const loadedCardImageIndex =
        scholarship.cardImage && uniqueImages.length
          ? uniqueImages.findIndex(
              (image) => image.publicId === scholarship.cardImage?.publicId,
            )
          : 0;

      setFormData({
        title: scholarship.title ?? "",
        slug: scholarship.slug ?? "",
        description: scholarship.description ?? "",
        amount: scholarship.amount ?? "",
        deadline: scholarship.deadline ? scholarship.deadline.slice(0, 10) : "",
        ctaLabel: scholarship.ctaLabel ?? "Learn More",
        ctaUrl: scholarship.ctaUrl ?? "",

        content: scholarship.content,

        metaTitle: scholarship.metaTitle ?? "",
        metaDescription: scholarship.metaDescription ?? "",
        metaKeywords: scholarship.metaKeywords ?? [],
        focusKeyword: scholarship.focusKeyword ?? "",

        status: scholarship.status,
        applicationFields: scholarship.applicationForm?.fields ?? [],
      });

      setMetaKeywordsInput((scholarship.metaKeywords ?? []).join(", "));
      setCardImage(scholarship.cardImage ?? null);
      setWallpaper(scholarship.wallpaper ?? null);
      setLogo(scholarship.logo ?? null);
      setSubmitError("");

      return;
    }

    setFormData(initialFormData);
    setMetaKeywordsInput("");
    setCardImage(null);
    setWallpaper(null);
    setLogo(null);
    setSubmitError("");
  }, [scholarship]);

  const handleTitleChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      title: value,
      slug: current.slug
        ? current.slug
        : value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
    }));
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: "cardImage" | "wallpaper" | "logo",
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const uploadPromise = uploadImage(file, "scholarships");

    try {
      setUploadingImage(imageType);

      const uploadedImage = await toast.promise(uploadPromise, {
        pending: `Uploading ${imageType === "cardImage" ? "scholarship image" : imageType === "wallpaper" ? "scholarship wallpaper" : "institute logo"}...`,
        success: "Image uploaded successfully!",
        error: {
          render({ data }) {
            return data instanceof Error
              ? data.message
              : "Failed to upload image";
          },
        },
      });

      if (imageType === "cardImage") {
        setCardImage(uploadedImage);
      } else if (imageType === "wallpaper") {
        setWallpaper(uploadedImage);
      } else {
        setLogo(uploadedImage);
      }
    } catch (error) {
      console.error(`SCHOLARSHIP ${imageType} UPLOAD ERROR:`, error);
    } finally {
      setUploadingImage(null);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const metaKeywords = [
        ...new Set(
          metaKeywordsInput
            .split(",")
            .map((keyword) => keyword.trim().toLowerCase())
            .filter(Boolean),
        ),
      ];

      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        amount: formData.amount.trim() || null,

        cardImage,
        logo,
        wallpaper,

        deadline: formData.deadline || null,
        content: formData.content,

        applicationForm: {
          fields: formData.applicationFields,
        },

        ctaLabel: formData.ctaLabel,
        ctaUrl: formData.ctaUrl,

        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        metaKeywords,
        focusKeyword: formData.focusKeyword,

        status: formData.status,
      };

      const url = isEditing
        ? `/api/cms/scholarships/${scholarship!._id}`
        : "/api/cms/scholarships";

      const method = isEditing ? "PATCH" : "POST";

      const savePromise = (async () => {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ??
              (isEditing
                ? "Failed to update scholarship"
                : "Failed to create scholarship"),
          );
        }

        return result;
      })();

      await toast.promise(savePromise, {
        pending: isEditing
          ? "Updating scholarship..."
          : "Creating scholarship...",
        success: isEditing
          ? "Scholarship updated successfully"
          : "Scholarship created successfully",
        error: {
          render({ data }) {
            return data instanceof Error
              ? data.message
              : "Failed to save scholarship";
          },
        },
      });

      setFormData(initialFormData);
      setCardImage(null);
      setWallpaper(null);
      setLogo(null);

      onSuccess();
    } catch (error) {
      console.error(
        isEditing ? "UPDATE SCHOLARSHIP ERROR:" : "CREATE SCHOLARSHIP ERROR:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : isEditing
            ? "Failed to update scholarship"
            : "Failed to create scholarship";

      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white"
    >
      <div className="space-y-8 p-6">
        {/* Basic Information */}
        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">
              Basic Information
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Add the main scholarship details.
            </p>
          </div>

          <div className="grid gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Scholarship Title
              </label>

              <input
                type="text"
                value={formData.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="e.g. Istituto Marangoni Personalized Scholarships"
                className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Short Description
              </label>
              <textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Briefly describe this scholarship..."
                rows={3}
                className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Slug
                </label>

                <input
                  type="text"
                  value={formData.slug}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      slug: event.target.value,
                    }))
                  }
                  placeholder="scholarship-slug"
                  className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Application Deadline
                </label>

                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      deadline: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Scholarship Amount
              </label>
              <input
                type="text"
                value={formData.amount}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                placeholder="e.g. €15,000 or 100% Tuition Fee Waiver"
                className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
              />
              <p className="mt-1.5 text-xs text-zinc-400">
                Include the currency or describe the funding amount.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Scholarship Images
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Manage the card image and detail-page wallpaper independently.
            </p>
          </div>

          <ScholarshipSingleImageUploader
            label="Scholarship image"
            description="Displayed on scholarship cards and listing pages."
            image={cardImage}
            uploading={uploadingImage === "cardImage"}
            onUpload={(event) => handleImageUpload(event, "cardImage")}
            onRemove={() => setCardImage(null)}
          />

          <ScholarshipSingleImageUploader
            label="Scholarship wallpaper"
            description="Used as the wallpaper on the scholarship detail page."
            image={wallpaper}
            uploading={uploadingImage === "wallpaper"}
            onUpload={(event) => handleImageUpload(event, "wallpaper")}
            onRemove={() => setWallpaper(null)}
          />

          <ScholarshipSingleImageUploader
            label="Institute logo"
            description="The logo of the university or institute providing the scholarship."
            image={logo}
            uploading={uploadingImage === "logo"}
            onUpload={(event) => handleImageUpload(event, "logo")}
            onRemove={() => setLogo(null)}
          />
        </section>

        {/* Content */}
        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">
              Scholarship Content
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Write the scholarship details, eligibility, benefits and other
              information.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <BlogEditor
              content={formData.content}
              onChange={(content) =>
                setFormData((current) => ({
                  ...current,
                  content,
                }))
              }
            />
          </div>
        </section>

        {/* Call to Action */}
        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">
              Call to Action
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Configure the button shown for this scholarship.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Button Label
              </label>
              <input
                type="text"
                value={formData.ctaLabel}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    ctaLabel: event.target.value,
                  }))
                }
                placeholder="Learn More"
                className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Destination URL
              </label>
              <input
                type="text"
                value={formData.ctaUrl}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    ctaUrl: event.target.value,
                  }))
                }
                placeholder="/scholarships/example or https://..."
                className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>
          </div>
        </section>

        {/* Application Form */}
        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">
              Application Form
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Configure the fields students will see when applying for this
              scholarship.
            </p>
          </div>

          <ScholarshipApplicationFormBuilder
            fields={formData.applicationFields}
            onChange={(applicationFields) =>
              setFormData((current) => ({
                ...current,
                applicationFields,
              }))
            }
          />
        </section>

        {/* SEO */}
        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">SEO</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Configure the search engine metadata for this scholarship page.
            </p>
          </div>

          <div className="space-y-5">
            {/* Meta Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Meta Title
              </label>

              <input
                type="text"
                value={formData.metaTitle}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    metaTitle: event.target.value,
                  }))
                }
                placeholder="Scholarship Name | Maitri Global Education"
                className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            {/* Meta Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Meta Description
              </label>

              <textarea
                value={formData.metaDescription}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    metaDescription: event.target.value,
                  }))
                }
                rows={4}
                placeholder="Write a short description of this scholarship..."
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            {/* Meta Keywords */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Meta Keywords
              </label>

              <textarea
                value={metaKeywordsInput}
                onChange={(event) => setMetaKeywordsInput(event.target.value)}
                placeholder="scholarship, study abroad, Italy scholarship, university funding"
                rows={3}
                className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
              />

              <p className="mt-1.5 text-xs text-zinc-400">
                Enter or paste multiple keywords separated by commas.
              </p>
            </div>

            {/* Focus Keyword */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Focus Keyword
              </label>

              <input
                type="text"
                value={formData.focusKeyword}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    focusKeyword: event.target.value,
                  }))
                }
                placeholder="Italy scholarship"
                className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>
          </div>
        </section>

        {/* Publishing */}
        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">
              Publishing
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Control whether this scholarship is visible publicly.
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
              <input
                type="radio"
                name="scholarship-status"
                value="draft"
                checked={formData.status === "draft"}
                onChange={() =>
                  setFormData((current) => ({
                    ...current,
                    status: "draft",
                  }))
                }
              />
              Draft
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
              <input
                type="radio"
                name="scholarship-status"
                value="published"
                checked={formData.status === "published"}
                onChange={() =>
                  setFormData((current) => ({
                    ...current,
                    status: "published",
                  }))
                }
              />
              Published
            </label>
          </div>
        </section>

        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {submitError}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 rounded-b-xl border-t border-zinc-200 bg-white px-6 py-4">
        {scholarship && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-10 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel Edit
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 cursor-pointer rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : scholarship
              ? "Save Changes"
              : "Create Scholarship"}
        </button>
      </div>
    </form>
  );
}
