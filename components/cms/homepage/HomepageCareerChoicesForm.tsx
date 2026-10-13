"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import type {
  HomepageCareerChoicesContent,
  HomepageCareerChoiceCard,
} from "@/types/homepage";
import { uploadImage } from "@/services/media.service";

interface HomepageCareerChoicesFormProps {
  content: HomepageCareerChoicesContent;
  onChange: (content: HomepageCareerChoicesContent) => void;
  isVisible: boolean;
  onVisibilityChange: (isVisible: boolean) => void;
}

const inputStyles =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400";

export default function HomepageCareerChoicesForm({
  content,
  onChange,
  isVisible,
  onVisibilityChange,
}: HomepageCareerChoicesFormProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  const updateContent = (updates: Partial<HomepageCareerChoicesContent>) => {
    onChange({ ...content, ...updates });
  };

  const updateCard = (
    id: string,
    updates: Partial<HomepageCareerChoiceCard>,
  ) => {
    updateContent({
      cards: content.cards.map((card) =>
        card.id === id ? { ...card, ...updates } : card,
      ),
    });
  };

  const addCard = () => {
    const card: HomepageCareerChoiceCard = {
      id: crypto.randomUUID(),
      image: null,
      tags: [],
      title: "",
      source: "",
    };

    updateContent({ cards: [...content.cards, card] });
    setExpandedCard(card.id);
  };

  const removeCard = (id: string) => {
    updateContent({
      cards: content.cards.filter((card) => card.id !== id),
    });

    if (expandedCard === id) {
      setExpandedCard(null);
    }
  };

  const handleImageUpload = async (id: string, file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be 10 MB or less");
      return;
    }

    setUploadingCardId(id);

    try {
      const uploaded = await toast.promise(
        uploadImage(file, "career-choices"),
        {
          pending: "Uploading career card image...",
          success: "Image uploaded successfully",
          error: "Failed to upload image",
        },
      );

      updateCard(id, {
        image: {
          url: uploaded.url,
          publicId: uploaded.publicId,
        },
      });
    } catch (error) {
      console.error("CAREER CHOICE IMAGE UPLOAD ERROR:", error);
    } finally {
      setUploadingCardId(null);
    }
  };

  const updateTags = (id: string, value: string) => {
    updateCard(id, {
      tags: value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .filter((tag, index, tags) => tags.indexOf(tag) === index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Section visibility */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-4">
        <div>
          <p className="text-sm font-medium text-zinc-900">Show on homepage</p>
          <p className="mt-1 text-xs text-zinc-500">
            Control the visibility of the entire section.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isVisible}
          aria-label="Show Elite Career Choices section"
          onClick={() => onVisibilityChange(!isVisible)}
          className={`relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${
            isVisible ? "bg-zinc-900" : "bg-zinc-300"
          }`}
        >
          <span
            className={`pointer-events-none absolute left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
              isVisible ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Section heading */}
      <section className="space-y-4 rounded-xl border border-zinc-200 p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Section Heading
          </label>
          <input
            value={content.heading}
            onChange={(event) => updateContent({ heading: event.target.value })}
            placeholder="Elite Career Choices"
            className={inputStyles}
          />
        </div>
      </section>

      {/* Career cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Career Cards
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Manage the images, tags and content displayed on each card.
            </p>
          </div>

          <button
            type="button"
            onClick={addCard}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <Plus className="size-4" />
            Add Card
          </button>
        </div>

        {content.cards.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center">
            <p className="text-sm text-zinc-500">No career cards added yet.</p>
            <p className="mt-1 text-xs text-zinc-400">
              Add your first card to get started.
            </p>
          </div>
        )}

        {content.cards.map((card, index) => {
          const isExpanded = expandedCard === card.id;
          const isUploading = uploadingCardId === card.id;

          return (
            <div
              key={card.id}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
            >
              {/* Collapsed card header */}
              <div className="flex items-center gap-3 p-3 sm:p-4">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                >
                  {card.image?.url ? (
                    <img
                      src={card.image.url}
                      alt={card.title || "Career card"}
                      className="size-16 shrink-0 rounded-lg border border-zinc-200 object-cover"
                    />
                  ) : (
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50">
                      <ImagePlus className="size-5 text-zinc-400" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {card.title.trim() || `Career Card ${index + 1}`}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {card.source.trim() || "No source added"}
                    </p>
                    {card.tags.length > 0 && (
                      <p className="mt-1 truncate text-xs text-zinc-400">
                        {card.tags.join(" · ")}
                      </p>
                    )}
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="size-4 shrink-0 text-zinc-500" />
                  ) : (
                    <ChevronDown className="size-4 shrink-0 text-zinc-500" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => removeCard(card.id)}
                  disabled={isUploading}
                  aria-label={`Remove career card ${index + 1}`}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {/* Expanded editor */}
              {isExpanded && (
                <div className="space-y-5 border-t border-zinc-100 bg-zinc-50/50 p-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">
                      Card Image
                    </label>

                    {card.image?.url && (
                      <div className="space-y-2">
                        <img
                          src={card.image.url}
                          alt={card.title || "Career card preview"}
                          className="h-48 w-full max-w-sm rounded-lg border border-zinc-200 object-cover"
                        />
                        <p className="truncate text-xs text-zinc-400">
                          {card.image.publicId}
                        </p>
                      </div>
                    )}

                    <input
                      ref={(element) => {
                        inputRefs.current[card.id] = element;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingCardId !== null}
                      onChange={(event) => {
                        void handleImageUpload(
                          card.id,
                          event.target.files?.[0],
                        );
                        event.target.value = "";
                      }}
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => inputRefs.current[card.id]?.click()}
                        disabled={uploadingCardId !== null}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUploading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ImagePlus className="size-4" />
                        )}
                        {isUploading
                          ? "Uploading..."
                          : card.image
                            ? "Replace Image"
                            : "Upload Image"}
                      </button>

                      {card.image && (
                        <button
                          type="button"
                          onClick={() => updateCard(card.id, { image: null })}
                          disabled={isUploading}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <X className="size-4" />
                          Remove image
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">
                      Card Title
                    </label>
                    <input
                      value={card.title}
                      onChange={(event) =>
                        updateCard(card.id, { title: event.target.value })
                      }
                      placeholder="e.g. Interior Design and Architecture Services"
                      className={inputStyles}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">
                      Company / Source
                    </label>
                    <input
                      value={card.source}
                      onChange={(event) =>
                        updateCard(card.id, { source: event.target.value })
                      }
                      placeholder="e.g. GOMA"
                      className={inputStyles}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">
                      Category Tags
                    </label>

                    <input
                      value={tagInputs[card.id] ?? card.tags.join(", ")}
                      onChange={(event) => {
                        const value = event.target.value;

                        setTagInputs((prev) => ({
                          ...prev,
                          [card.id]: value,
                        }));

                        updateTags(card.id, value);
                      }}
                      onBlur={() => {
                        setTagInputs((prev) => {
                          const next = { ...prev };
                          delete next[card.id];
                          return next;
                        });
                      }}
                      placeholder="Design, Creative, Build"
                      className={inputStyles}
                    />

                    <p className="text-xs text-zinc-400">
                      Separate tags with commas.
                    </p>

                    {card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {card.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
