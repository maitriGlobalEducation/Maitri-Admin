"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import type {
  University,
  UniversityImage,
  UniversityStatus,
} from "@/types/university";
import { uploadImage } from "@/services/media.service";

interface UniversityFormProps {
  university?: University | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface UniversityFormData {
  name: string;
  slug: string;
  country: string;
  reportLabel: string;
  reportYear: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  status: UniversityStatus;
}

const initialFormData: UniversityFormData = {
  name: "",
  slug: "",
  country: "",
  reportLabel: "Report",
  reportYear: "",
  title: "",
  description: "",
  ctaLabel: "Go to University Page",
  ctaUrl: "",
  status: "draft",
};

const inputStyles =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400";

export default function UniversityForm({
  university,
  onSuccess,
  onCancel,
}: UniversityFormProps) {
  const [formData, setFormData] = useState<UniversityFormData>(initialFormData);

  const [logo, setLogo] = useState<UniversityImage | null>(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  // const cardImageInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(university);

  useEffect(() => {
    if (university) {
      setFormData({
        name: university.name ?? "",
        slug: university.slug ?? "",
        country: university.country ?? "",
        reportLabel: university.reportLabel ?? "Report",
        reportYear: university.reportYear ?? "",
        title: university.title ?? "",
        description: university.description ?? "",
        ctaLabel: university.ctaLabel ?? "Go to University Page",
        ctaUrl: university.ctaUrl ?? "",
        status: university.status ?? "draft",
      });

      setLogo(university.logo ?? null);
      // setCardImage(university.cardImage ?? null);
    } else {
      setFormData(initialFormData);
      setLogo(null);
      // setCardImage(null);
    }
  }, [university]);

  const updateField = <K extends keyof UniversityFormData>(
    field: K,
    value: UniversityFormData[K],
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleNameChange = (value: string) => {
    updateField("name", value);

    if (!isEditing) {
      updateField(
        "slug",
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  };

  const handleImageUpload = async (file: File, type: "logo" | "cardImage") => {
    if (type !== "logo") return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be 10 MB or less");
      return;
    }

    setIsUploadingLogo(true);

    try {
      const uploaded = await toast.promise(uploadImage(file, "universities"), {
        pending: "Uploading university logo...",
        success: "Logo uploaded successfully",
        error: "Failed to upload logo",
      });

      setLogo({
        url: uploaded.url,
        publicId: uploaded.publicId,
      });
    } catch (error) {
      console.error("UNIVERSITY IMAGE UPLOAD ERROR:", error);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (
    submitEvent: React.FormEvent<HTMLFormElement>,
  ) => {
    submitEvent.preventDefault();

    if (isSubmitting) return;

    if (!formData.ctaUrl.trim()) {
      toast.error("Please enter the university page URL");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        logo,
      };

      const url = isEditing
        ? `/api/cms/universities/${university!._id}`
        : "/api/cms/universities";

      await toast.promise(
        (async () => {
          const response = await fetch(url, {
            method: isEditing ? "PATCH" : "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.message || "Failed to save university");
          }

          return result;
        })(),
        {
          pending: isEditing
            ? "Updating university..."
            : "Creating university...",
          success: isEditing
            ? "University updated successfully"
            : "University created successfully",
          error: {
            render({ data }) {
              return data instanceof Error
                ? data.message
                : "Failed to save university";
            },
          },
        },
      );

      onSuccess();
    } catch (error) {
      console.error("SAVE UNIVERSITY ERROR:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageInput = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "cardImage",
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      void handleImageUpload(file, type);
    }

    event.target.value = "";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">
            {isEditing ? "Edit University" : "Add University"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the university homepage card.
          </p>
        </div>
      </div>

      <section className="space-y-4 rounded-xl border border-zinc-200 p-5">
        <h3 className="font-semibold text-zinc-900">University Information</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              University Name *
            </label>
            <input
              required
              value={formData.name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="e.g. POLIMODA"
              className={inputStyles}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Slug *
            </label>
            <input
              required
              value={formData.slug}
              onChange={(event) => updateField("slug", event.target.value)}
              placeholder="polimoda"
              className={inputStyles}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Country *
            </label>
            <input
              required
              value={formData.country}
              onChange={(event) => updateField("country", event.target.value)}
              placeholder="e.g. USA"
              className={inputStyles}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-200 p-5">
        <h3 className="font-semibold text-zinc-900">University Images</h3>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              University Logo
            </label>

            {logo ? (
              <div className="space-y-3">
                <div className="flex h-36 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.url}
                    alt="University logo"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Replace logo
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogo(null)}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-500 hover:bg-zinc-50 disabled:cursor-not-allowed"
              >
                {isUploadingLogo ? "Uploading logo..." : "＋ Upload logo"}
              </button>
            )}

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleImageInput(event, "logo")}
            />

            <p className="mt-2 text-xs text-zinc-400">
              Transparent PNG or SVG-compatible raster image recommended.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-200 p-5">
        <h3 className="font-semibold text-zinc-900">Card Content</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Report Label
            </label>
            <input
              value={formData.reportLabel}
              onChange={(event) =>
                updateField("reportLabel", event.target.value)
              }
              placeholder="Report"
              className={inputStyles}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Report Year
            </label>
            <input
              value={formData.reportYear}
              onChange={(event) =>
                updateField("reportYear", event.target.value)
              }
              placeholder="2025"
              className={inputStyles}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Highlight Title *
            </label>
            <input
              required
              value={formData.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Global Education Excellence Scholarship"
              className={inputStyles}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe the scholarship, achievement, or university highlight..."
              className={inputStyles + " resize-y"}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-200 p-5">
        <h3 className="font-semibold text-zinc-900">Call to Action</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Button Label *
            </label>
            <input
              required
              value={formData.ctaLabel}
              onChange={(event) => updateField("ctaLabel", event.target.value)}
              placeholder="Go to University Page"
              className={inputStyles}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Button URL *
            </label>
            <input
              required
              type="text"
              value={formData.ctaUrl}
              onChange={(event) => updateField("ctaUrl", event.target.value)}
              placeholder="/universities/polimoda or https://..."
              className={inputStyles}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-200 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting || isUploadingLogo}
          className="cursor-pointer rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Create University"}
        </button>
      </div>
    </form>
  );
}
