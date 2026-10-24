"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import type { Event, EventRegistrationField } from "@/types/event";

import EventImageUploader from "./EventImageUploader";
import EventRegistrationFormBuilder, {
  defaultFields,
} from "./EventRegistrationFormBuilder";

import BlogEditor from "@/components/cms/blogs/BlogEditor";
import { EVENT_TIMEZONES } from "@/lib/event-time";
import TimezoneSelect from "@/components/Common Components/TimezoneSelect";

interface EventFormProps {
  event: Event | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  slug: string;
  category: string;
  eventDate: string;
  eventTime: string;

  content: Record<string, unknown>;

  registrationFields: EventRegistrationField[];
  eventTimezone: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  focusKeyword: string;
  featured: boolean;
  status: "draft" | "published";
}

const initialFormData: FormData = {
  title: "",
  slug: "",
  category: "",
  eventDate: "",
  eventTime: "",

  content: {
    type: "doc",
    content: [
      {
        type: "paragraph",
      },
    ],
  },

  registrationFields: defaultFields,
  eventTimezone: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: [],
  focusKeyword: "",
  featured: false,
  status: "draft",
};
interface EventCategoryOption {
  _id: string;
  name: string;
  slug: string;
}

export default function EventForm({
  event,
  onSuccess,
  onCancel,
}: EventFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [categories, setCategories] = useState<EventCategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [images, setImages] = useState<{ url: string; publicId: string }[]>([]);

  const [cardImageIndex, setCardImageIndex] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [metaKeywordsInput, setMetaKeywordsInput] = useState("");

  const isEditing = Boolean(event);

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const [showFeaturedConfirm, setShowFeaturedConfirm] = useState(false);
  const [featuredEventToReplace, setFeaturedEventToReplace] =
    useState<Event | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setCategoryError("");

    try {
      const response = await fetch("/api/cms/event-categories", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to load event categories.");
      }

      setCategories(result.categories ?? []);
    } catch (error) {
      setCategoryError(
        error instanceof Error
          ? error.message
          : "Failed to load event categories.",
      );
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (event) {
      const loadedImages = [event.cardImage, event.contentImage].filter(
        Boolean,
      ) as {
        url: string;
        publicId: string;
      }[];

      const uniqueImages = loadedImages.filter(
        (image, index, array) =>
          array.findIndex((item) => item.publicId === image.publicId) === index,
      );

      const loadedCardImageIndex =
        event.cardImage && uniqueImages.length
          ? uniqueImages.findIndex(
              (image) => image.publicId === event.cardImage?.publicId,
            )
          : 0;

      setFormData({
        title: event.title,
        slug: event.slug,
        category: event.category ?? "",
        eventDate: event.eventDate ? event.eventDate.slice(0, 10) : "",
        eventTime: event.eventTime ?? "",
        eventTimezone: event.eventTimezone ?? "",

        content: event.content,

        registrationFields: event.registrationForm?.fields ?? defaultFields,

        metaTitle: event.metaTitle ?? "",
        metaDescription: event.metaDescription ?? "",
        metaKeywords: event.metaKeywords ?? [],
        focusKeyword: event.focusKeyword ?? "",
        featured: event.featured ?? false,
        status: event.status,
      });

      setMetaKeywordsInput((event.metaKeywords ?? []).join(", "));

      setImages(uniqueImages);

      setCardImageIndex(loadedCardImageIndex >= 0 ? loadedCardImageIndex : 0);

      setSubmitError("");

      return;
    }

    setFormData({
      ...initialFormData,
      registrationFields: defaultFields.map((field) => ({
        ...field,
      })),
    });

    setMetaKeywordsInput("");
    setImages([]);
    setCardImageIndex(0);
    setSubmitError("");
  }, [event]);

  const contentImageIndex = useMemo(() => {
    if (images.length < 2) return 0;

    return cardImageIndex === 0 ? 1 : 0;
  }, [images.length, cardImageIndex]);

  const handleTitleChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      title: value,
      slug: isSlugManuallyEdited
        ? current.slug
        : value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
    }));
  };

  const handleFeaturedChange = async (checked: boolean) => {
    if (!checked) {
      setFormData((current) => ({
        ...current,
        featured: false,
      }));
      return;
    }

    // Don't prompt when this event is already the featured one.
    if (event?.featured) {
      setFormData((current) => ({
        ...current,
        featured: true,
      }));
      return;
    }

    try {
      const response = await fetch("/api/cms/events", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to check featured events.");
      }

      const currentFeaturedEvent = (result.data as Event[]).find(
        (item) => item.featured && item._id !== event?._id,
      );

      if (currentFeaturedEvent) {
        setFeaturedEventToReplace(currentFeaturedEvent);
        setShowFeaturedConfirm(true);
        return;
      }

      setFormData((current) => ({
        ...current,
        featured: true,
      }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to check featured events.",
      );
    }
  };

  const handleSubmit = async (
    submitEvent: React.FormEvent<HTMLFormElement>,
  ) => {
    submitEvent.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const cardImage = images.length > 0 ? images[cardImageIndex] : null;

      const contentImage =
        images.length > 1 ? images[contentImageIndex] : (images[0] ?? null);

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
        category: formData.category,
        eventDate: formData.eventDate || null,
        eventTime: formData.eventTime,
        eventTimezone: formData.eventTimezone,

        cardImage,
        contentImage,

        content: formData.content,

        registrationForm: {
          fields: formData.registrationFields,
        },

        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        metaKeywords,
        focusKeyword: formData.focusKeyword,
        featured: formData.featured,
        status: formData.status,
      };

      const url = isEditing
        ? `/api/cms/events/${event!._id}`
        : "/api/cms/events";

      const method = isEditing ? "PATCH" : "POST";

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
            (isEditing ? "Failed to update event" : "Failed to create event"),
        );
      }

      toast.success(
        isEditing ? "Event updated successfully" : "Event created successfully",
      );

      setFormData({
        ...initialFormData,
        registrationFields: defaultFields.map((field) => ({
          ...field,
        })),
      });

      setMetaKeywordsInput("");
      setImages([]);
      setCardImageIndex(0);

      onSuccess();
    } catch (error) {
      console.error(
        isEditing ? "UPDATE EVENT ERROR:" : "CREATE EVENT ERROR:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : isEditing
            ? "Failed to update event"
            : "Failed to create event";

      setSubmitError(message);
      toast.error(message);
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
              Add the main details for this event.
            </p>
          </div>

          <div className="grid gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Event Title
              </label>

              <input
                type="text"
                value={formData.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="e.g. Study in Italy Webinar"
                className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
                required
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Slug
                </label>

                <input
                  type="text"
                  value={formData.slug}
                  onChange={(event) => {
                    setIsSlugManuallyEdited(true);
                    setFormData((current) => ({
                      ...current,
                      slug: event.target.value,
                    }));
                  }}
                  placeholder="study-in-italy-webinar"
                  className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Event Date
                </label>

                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      eventDate: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Event Time
                </label>

                <input
                  type="time"
                  value={formData.eventTime}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      eventTime: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
                  required
                />
              </div>

              <TimezoneSelect
                label="Event Timezone"
                name="eventTimezone"
                value={formData.eventTimezone}
                options={EVENT_TIMEZONES}
                onChange={(eventTimezone) =>
                  setFormData((current) => ({
                    ...current,
                    eventTimezone,
                  }))
                }
                required
                placeholder="Select event timezone"
              />

              {formData.eventTimezone && (
                <p className="mt-3 text-sm text-zinc-500">
                  The event is scheduled for{" "}
                  <span className="font-medium text-zinc-800">
                    {formData.eventTime || "--:--"}
                  </span>{" "}
                  on{" "}
                  <span className="font-medium text-zinc-800">
                    {formData.eventDate || "no date selected"}
                  </span>{" "}
                  in{" "}
                  <span className="font-medium text-zinc-800">
                    {formData.eventTimezone} Timezone
                  </span>
                  .
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="event-category"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                Event Category
              </label>

              <select
                id="event-category"
                value={formData.category}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                disabled={isLoadingCategories || categories.length === 0}
                className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50"
                required
              >
                <option value="">
                  {isLoadingCategories
                    ? "Loading categories..."
                    : categories.length === 0
                      ? "No categories available"
                      : "Select event category"}
                </option>

                {categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>

              {categoryError && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-red-600">{categoryError}</p>

                  <button
                    type="button"
                    onClick={() => void fetchCategories()}
                    className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Images */}
        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">
              Event Images
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Upload one image to use everywhere, or two images to control the
              card and detail-page images separately.
            </p>
          </div>

          <EventImageUploader
            images={images}
            cardImageIndex={cardImageIndex}
            onImagesChange={setImages}
            onCardImageIndexChange={setCardImageIndex}
          />
        </section>

        {/* Content */}
        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">
              Event Content
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Add the event description, agenda, speakers, eligibility and other
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

        {/* Registration Form */}
        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">
              Registration Form
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Configure the fields students will see when registering for this
              event.
            </p>
          </div>

          <EventRegistrationFormBuilder
            fields={formData.registrationFields}
            onChange={(registrationFields) =>
              setFormData((current) => ({
                ...current,
                registrationFields,
              }))
            }
          />
        </section>

        {/* SEO */}
        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-zinc-900">SEO</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Configure the search engine metadata for this event page.
            </p>
          </div>

          <div className="space-y-5">
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
                placeholder="Event Name | Maitri Global Education"
                className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

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
                placeholder="Write a short description of this event..."
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Meta Keywords
              </label>

              <div className="flex flex-col gap-1.5">
                <textarea
                  value={metaKeywordsInput}
                  onChange={(event) => setMetaKeywordsInput(event.target.value)}
                  placeholder="scholarship, study abroad, Italy"
                  rows={3}
                  className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-400"
                />

                <p className="text-xs text-zinc-400">
                  Enter or paste multiple keywords separated by commas.
                </p>
              </div>
            </div>

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
                placeholder="study in Italy webinar"
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
              Control whether this event is visible publicly.
            </p>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-md">
              <label
                htmlFor="event-status"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Publication status
              </label>

              <select
                id="event-status"
                value={formData.status}
                onChange={(e) =>
                  setFormData((current) => ({
                    ...current,
                    status: e.target.value as FormData["status"],
                  }))
                }
                className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <label className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3 transition-colors hover:border-zinc-300 sm:max-w-sm">
              <div>
                <p className="text-sm font-medium text-zinc-800">
                  Featured event
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Highlight this event on the website.
                </p>
              </div>

              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => void handleFeaturedChange(e.target.checked)}
                className="size-4 shrink-0 cursor-pointer accent-zinc-950"
              />
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
        {event && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-10 rounded-lg cursor-pointer border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel Edit
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 cursor-pointer rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : event ? "Save Changes" : "Create Event"}
        </button>
      </div>

      {showFeaturedConfirm && featuredEventToReplace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeaturedConfirm(false);
              setFeaturedEventToReplace(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="featured-event-confirm-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="p-6 sm:p-7">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <span className="text-xl">★</span>
              </div>

              <h2
                id="featured-event-confirm-title"
                className="text-xl font-semibold text-zinc-900"
              >
                A featured event already exists
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Do you want to replace the currently featured event with this
                one?
              </p>

              <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200">
                {featuredEventToReplace.cardImage?.url && (
                  <img
                    src={featuredEventToReplace.cardImage.url}
                    alt={featuredEventToReplace.title}
                    className="h-44 w-full object-cover"
                  />
                )}

                <div className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Currently featured
                  </p>

                  <h3 className="mt-1 font-semibold text-zinc-900">
                    {featuredEventToReplace.title}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {featuredEventToReplace.category || "Event"}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-zinc-600">
                The new featured selection will take effect when you save this
                event.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowFeaturedConfirm(false);
                  setFeaturedEventToReplace(null);
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
                  setFeaturedEventToReplace(null);
                }}
                className="cursor-pointer rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Yes, replace featured event
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
