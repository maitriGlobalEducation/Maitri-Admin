"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";

import { uploadImage, type UploadedMedia } from "@/services/media.service";

interface BlogImageUploaderProps {
  images: UploadedMedia[];
  cardImageIndex: number;
  onImagesChange: (images: UploadedMedia[]) => void;
  onCardImageChange: (index: number) => void;
}

export default function BlogImageUploader({
  images,
  cardImageIndex,
  onImagesChange,
  onCardImageChange,
}: BlogImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (selectedFiles: File[]) => {
    if (!selectedFiles.length || uploading) return;

    const availableSlots = 2 - images.length;

    if (availableSlots <= 0) {
      setError("You can upload a maximum of 2 images.");
      return;
    }

    const validFiles = selectedFiles.filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    );

    if (validFiles.length !== selectedFiles.length) {
      setError("Only JPG, PNG, and WebP images are supported.");
    } else {
      setError("");
    }

    if (!validFiles.length) return;

    const filesToConsider = validFiles.slice(0, availableSlots);

    if (validFiles.length > availableSlots) {
      setError(
        `You can upload only ${availableSlots} more image${availableSlots === 1 ? "" : "s"}.`,
      );
    }

    const oversizedFiles = filesToConsider.filter(
      (file) => file.size > 100 * 1024 * 1024,
    );

    if (oversizedFiles.length) {
      setError("Each image must be 100MB or smaller.");
    }

    const filesToUpload = filesToConsider.filter(
      (file) => file.size <= 100 * 1024 * 1024,
    );

    if (!filesToUpload.length) return;

    try {
      setUploading(true);
      setError("");

      const uploadedImages = await Promise.all(
        filesToUpload.map((file) => uploadImage(file, "blogs")),
      );

      const nextImages = [...images, ...uploadedImages];

      onImagesChange(nextImages);

      if (images.length === 0 && nextImages.length > 0) {
        onCardImageChange(0);
      }
    } catch (error) {
      console.error("BLOG IMAGE UPLOAD ERROR:", error);

      setError(
        error instanceof Error ? error.message : "Failed to upload image.",
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    // Allow selecting the same file again later.
    event.target.value = "";

    void handleUpload(files);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!uploading && images.length < 2) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (uploading) return;

    void handleUpload(Array.from(event.dataTransfer.files));
  };

  const handleRemove = (index: number) => {
    const updatedImages = images.filter(
      (_, imageIndex) => imageIndex !== index,
    );

    onImagesChange(updatedImages);

    if (updatedImages.length <= 1) {
      onCardImageChange(0);
      return;
    }

    if (index < cardImageIndex) {
      onCardImageChange(cardImageIndex - 1);
    } else if (index === cardImageIndex) {
      onCardImageChange(0);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={uploading || images.length >= 2}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {images.map((image, index) => {
          const isCardImage = images.length === 1 || cardImageIndex === index;

          return (
            <div
              key={image.publicId}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
            >
              <div className="relative h-72 bg-zinc-100">
                <img
                  src={image.url}
                  alt={`Blog upload ${index + 1}`}
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => handleRemove(index)}
                  title="Remove image"
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/95 text-zinc-600 shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>

                <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
                  Image {index + 1}
                </div>
              </div>

              <div className="p-4">
                {images.length === 1 ? (
                  <div className="rounded-lg bg-zinc-50 px-3 py-2">
                    <p className="text-xs font-medium text-zinc-700">
                      Card image + Blog image
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Upload another image if you want them to be different.
                    </p>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="radio"
                      name="blog-card-image"
                      checked={isCardImage}
                      onChange={() => onCardImageChange(index)}
                      disabled={uploading}
                      className="mt-0.5 h-4 w-4"
                    />

                    <div>
                      <p className="text-sm font-medium text-zinc-800">
                        {isCardImage ? "Card image" : "Blog image"}
                      </p>

                      <p className="mt-0.5 text-xs text-zinc-500">
                        {isCardImage
                          ? "Shown on blog cards and listings."
                          : "Shown inside the blog page."}
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          );
        })}

        {images.length < 2 && (
          <div
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!uploading) inputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (!uploading && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={uploading ? -1 : 0}
            aria-label="Upload blog images"
            className={`flex min-h-52 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
              uploading
                ? "cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-60"
                : isDragging
                  ? "cursor-copy border-zinc-500 bg-zinc-50"
                  : "cursor-pointer border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 size={24} className="animate-spin text-zinc-600" />

                <p className="mt-3 text-sm font-medium text-zinc-700">
                  Uploading...
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Please wait until the upload finishes.
                </p>
              </>
            ) : isDragging ? (
              <>
                <ImagePlus size={24} className="text-zinc-600" />

                <p className="mt-3 text-sm font-semibold text-zinc-700">
                  Drop your images here
                </p>

                <p className="mt-1 text-xs text-zinc-600">Release to upload</p>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white">
                  {images.length === 0 ? (
                    <ImagePlus size={20} className="text-zinc-500" />
                  ) : (
                    <Upload size={20} className="text-zinc-500" />
                  )}
                </div>

                <p className="mt-3 text-sm font-medium text-zinc-700">
                  {images.length === 0
                    ? "Drag and drop blog images here"
                    : "Drag and drop a second image"}
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  or{" "}
                  <span className="font-medium text-zinc-600 underline underline-offset-2">
                    browse files
                  </span>
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  JPG, PNG or WebP · Max 100 MB per image
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  {2 - images.length} upload slot
                  {2 - images.length === 1 ? "" : "s"} remaining
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {images.length === 2 && (
        <p className="text-xs text-zinc-500">
          Select the image to use on blog cards. The other image will
          automatically be used inside the blog.
        </p>
      )}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            disabled={uploading || images.length >= 2}
            onClick={() => {
              setError("");
              inputRef.current?.click();
            }}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={13} />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
