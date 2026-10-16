"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

import { uploadImage } from "@/services/media.service";

interface EventImage {
  url: string;
  publicId: string;
}

interface EventImageUploaderProps {
  images: EventImage[];
  cardImageIndex: number;
  onImagesChange: (images: EventImage[]) => void;
  onCardImageIndexChange: (index: number) => void;
}

export default function EventImageUploader({
  images,
  cardImageIndex,
  onImagesChange,
  onCardImageIndexChange,
}: EventImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = async (files: File[]) => {
    if (!files.length || isUploading) return;

    const remainingSlots = 2 - images.length;

    if (remainingSlots <= 0) {
      toast.error("You can upload a maximum of 2 images.");
      return;
    }

    const validFiles = files.filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    );

    if (validFiles.length !== files.length) {
      toast.error("Only JPG, PNG, and WebP images are supported.");
    }

    if (!validFiles.length) return;

    if (validFiles.length > remainingSlots) {
      toast.error(
        `You can upload only ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"}.`,
      );
    }

    const filesToUpload = validFiles.slice(0, remainingSlots);

    // The displayed limit is 10MB per image.
    const oversizedFiles = filesToUpload.filter(
      (file) => file.size > 10 * 1024 * 1024,
    );

    if (oversizedFiles.length) {
      toast.error("Each image must be 10MB or smaller.");
    }

    const acceptedFiles = filesToUpload.filter(
      (file) => file.size <= 10 * 1024 * 1024,
    );

    if (!acceptedFiles.length) return;

    try {
      setIsUploading(true);

      const uploadedImages = await Promise.all(
        acceptedFiles.map((file) => uploadImage(file, "events")),
      );

      const nextImages = [...images, ...uploadedImages];

      onImagesChange(nextImages);

      if (images.length === 0 && nextImages.length > 0) {
        onCardImageIndexChange(0);
      }

      toast.success(
        uploadedImages.length === 1
          ? "Image uploaded successfully."
          : "Images uploaded successfully.",
      );
    } catch (error) {
      console.error("EVENT IMAGE UPLOAD ERROR:", error);

      toast.error(
        error instanceof Error ? error.message : "Failed to upload image.",
      );
    } finally {
      setIsUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    void handleUpload(Array.from(event.target.files ?? []));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // Ignore movement between children inside the drop area.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;

    const files = Array.from(event.dataTransfer.files);
    void handleUpload(files);
  };

  const handleRemove = (index: number) => {
    const nextImages = images.filter((_, imageIndex) => imageIndex !== index);

    onImagesChange(nextImages);

    if (nextImages.length <= 1) {
      onCardImageIndexChange(0);
      return;
    }

    if (index === cardImageIndex) {
      onCardImageIndexChange(0);
    } else if (index < cardImageIndex) {
      onCardImageIndexChange(cardImageIndex - 1);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleSelectFiles}
        className="hidden"
      />

      {images.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {images.map((image, index) => (
            <div
              key={image.publicId}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
            >
              <div className="relative aspect-video bg-zinc-100">
                <img
                  src={image.url}
                  alt={`Event image ${index + 1}`}
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={isUploading}
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/90 text-zinc-600 shadow-sm transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="event-card-image"
                    checked={cardImageIndex === index}
                    onChange={() => onCardImageIndexChange(index)}
                    disabled={isUploading}
                  />
                  Card Image
                </label>

                <span className="text-xs text-zinc-400">Image {index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length < 2 && (
        <div
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${
            isUploading
              ? "cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-70"
              : isDragging
                ? "cursor-copy border-zinc-500 bg-zinc-50"
                : "cursor-pointer border-zinc-300 bg-white hover:bg-zinc-50"
          }`}
          onClick={() => {
            if (!isUploading) inputRef.current?.click();
          }}
          role="button"
          tabIndex={isUploading ? -1 : 0}
          aria-label="Upload event images"
          onKeyDown={(event) => {
            if (!isUploading && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
              <p className="text-sm font-medium text-zinc-700">
                Uploading images...
              </p>
              <p className="text-xs text-zinc-400">
                Please wait until the upload finishes.
              </p>
            </>
          ) : isDragging ? (
            <>
              <ImagePlus className="h-7 w-7 text-zinc-600" />
              <p className="text-sm font-semibold text-zinc-700">
                Drop your images here
              </p>
              <p className="text-xs text-zinc-600">Release to upload</p>
            </>
          ) : (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                <ImagePlus className="h-5 w-5" />
              </div>

              <p className="text-sm font-semibold text-zinc-800">
                {images.length === 0
                  ? "Drag and drop event images here"
                  : "Drag and drop a second image"}
              </p>

              <p className="text-sm text-zinc-500">
                or{" "}
                <span className="font-medium text-zinc-600 underline underline-offset-2">
                  browse files
                </span>
              </p>

              <p className="text-xs text-zinc-400">
                {2 - images.length} upload slot
                {2 - images.length === 1 ? "" : "s"} remaining
              </p>
            </>
          )}
        </div>
      )}

      <p className="text-xs text-zinc-400">
        JPG, PNG or WebP. Maximum 10MB per image. You can upload up to 2 images.
      </p>
    </div>
  );
}
