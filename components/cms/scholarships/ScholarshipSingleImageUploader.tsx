"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { ScholarshipImage } from "@/types/scholarship";

interface ScholarshipSingleImageUploaderProps {
  label: string;
  description: string;
  image: ScholarshipImage | null;
  uploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export default function ScholarshipSingleImageUploader({
  label,
  description,
  image,
  uploading,
  onUpload,
  onRemove,
}: ScholarshipSingleImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openFilePicker = () => {
    if (!uploading) {
      inputRef.current?.click();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (uploading) return;

    const files = Array.from(event.dataTransfer.files);
    const file = files.find((item) =>
      ["image/jpeg", "image/png", "image/webp"].includes(item.type),
    );

    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    // Pass the dropped file through the existing input-based upload handler.
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    if (inputRef.current) {
      inputRef.current.files = dataTransfer.files;

      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-zinc-800">{label}</h3>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onUpload}
        disabled={uploading}
        className="hidden"
      />

      <div
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-4 transition ${
          uploading
            ? "cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-70"
            : isDragging
              ? "border-zinc-500 bg-zinc-50"
              : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
        }`}
      >
        {image ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-50 sm:w-28">
              <img
                src={image.url}
                alt={label}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-800">{label}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {isDragging
                  ? "Drop to replace the current image"
                  : "Drag a new image here to replace this one"}
              </p>

              <div className="mt-4 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={uploading}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-zinc-700 transition hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  {uploading ? "Uploading..." : "Replace image"}
                </button>

                <button
                  type="button"
                  onClick={onRemove}
                  disabled={uploading}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={uploading ? -1 : 0}
            aria-label={`Upload ${label.toLowerCase()}`}
            onClick={openFilePicker}
            onKeyDown={(event) => {
              if (!uploading && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                openFilePicker();
              }
            }}
            className={`flex min-h-32 flex-col items-center justify-center rounded-lg text-center ${
              uploading ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
            ) : (
              <div
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full ${
                  isDragging
                    ? "bg-zinc-100 text-zinc-600"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                <ImagePlus className="h-5 w-5" />
              </div>
            )}

            <p className="text-sm font-semibold text-zinc-800">
              {uploading
                ? "Uploading image..."
                : isDragging
                  ? "Drop your image here"
                  : `Drag and drop ${label.toLowerCase()} here`}
            </p>

            {!uploading && (
              <>
                <p className="mt-1 text-sm text-zinc-500">
                  or{" "}
                  <span className="font-medium text-zinc-600 underline underline-offset-2">
                    browse files
                  </span>
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  JPG, PNG or WebP · Max 10MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400">
        Accepted formats: JPG, PNG and WebP. Maximum file size: 10MB.
      </p>
    </div>
  );
}
