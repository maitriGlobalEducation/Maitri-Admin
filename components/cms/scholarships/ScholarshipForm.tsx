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
  featured: boolean;
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
  featured: false,
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

  const [featuredScholarshipToReplace, setFeaturedScholarshipToReplace] =
    useState<Scholarship | null>(null);

  const [showFeaturedConfirm, setShowFeaturedConfirm] = useState(false);
  const [isCheckingFeatured, setIsCheckingFeatured] = useState(false);

  const handleFeaturedChange = async (checked: boolean) => {
    if (!checked) {
      setFormData((current) => ({
        ...current,
        featured: false,
      }));
      return;
    }

    // This scholarship is already featured.
    if (scholarship?.featured) {
      setFormData((current) => ({
        ...current,
        featured: true,
      }));
      return;
    }

    try {
      setIsCheckingFeatured(true);

      const response = await fetch("/api/cms/scholarships");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "Failed to check featured scholarship",
        );
      }

      if (!Array.isArray(result.data)) {
        throw new Error("Unexpected response from the scholarships API.");
      }

      const existingFeaturedScholarship = (result.data as Scholarship[]).find(
        (item) => item.featured && item._id !== scholarship?._id,
      );

      if (existingFeaturedScholarship) {
        setFeaturedScholarshipToReplace(existingFeaturedScholarship);
        setShowFeaturedConfirm(true);
        return;
      }

      setFormData((current) => ({
        ...current,
        featured: true,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to check featured scholarship";

      toast.error(message);
    } finally {
      setIsCheckingFeatured(false);
    }
  };

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
        featured: scholarship.featured ?? false,
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
        featured: formData.featured,
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

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-md">
              <label
                htmlFor="scholarship-status"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Publication status
              </label>

              <select
                id="scholarship-status"
                name="scholarship-status"
                value={formData.status}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    status: e.target.value as typeof current.status,
                  }))
                }
                className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="w-full sm:max-w-sm">
              <label className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3 transition-colors hover:border-zinc-300">
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    Featured scholarship
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Highlight this scholarship on the website.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={formData.featured}
                  disabled={isCheckingFeatured}
                  onChange={(e) => handleFeaturedChange(e.target.checked)}
                  className="size-4 shrink-0 cursor-pointer accent-zinc-950 disabled:cursor-wait"
                />
              </label>
            </div>
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
            className="h-10 cursor-pointer rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
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

      {showFeaturedConfirm && featuredScholarshipToReplace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeaturedConfirm(false);
              setFeaturedScholarshipToReplace(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="featured-scholarship-confirm-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="p-6 sm:p-7">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <span className="text-xl">★</span>
              </div>

              <h2
                id="featured-scholarship-confirm-title"
                className="text-xl font-semibold text-zinc-900"
              >
                A featured scholarship already exists
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Do you want to replace the currently featured scholarship with
                this one?
              </p>

              <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200">
                {featuredScholarshipToReplace.cardImage?.url && (
                  <img
                    src={featuredScholarshipToReplace.cardImage.url}
                    alt={featuredScholarshipToReplace.title}
                    className="h-44 w-full object-cover"
                  />
                )}

                <div className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Currently featured
                  </p>

                  <h3 className="mt-1 font-semibold text-zinc-900">
                    {featuredScholarshipToReplace.title}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {featuredScholarshipToReplace.amount || "Scholarship"}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-zinc-600">
                The new featured selection will take effect when you save this
                scholarship.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowFeaturedConfirm(false);
                  setFeaturedScholarshipToReplace(null);
                }}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                No, cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData((current) => ({
                    ...current,
                    featured: true,
                  }));

                  setShowFeaturedConfirm(false);
                  setFeaturedScholarshipToReplace(null);
                }}
                className="cursor-pointer rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Yes, replace featured scholarship
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
