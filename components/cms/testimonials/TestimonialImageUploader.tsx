"use client";

import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { ImagePlus, LoaderCircle, UploadCloud, X } from "lucide-react";

import { uploadImage, type UploadedMedia } from "@/services/media.service";

interface TestimonialImageUploaderProps {
  image: UploadedMedia | null;
  onImageChange: (image: UploadedMedia | null) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function TestimonialImageUploader({
  image,
  onImageChange,
}: TestimonialImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFile = async (file?: File) => {
    if (!file || isUploading) return;

    setUploadError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      const message = "Please upload a JPG, PNG, or WebP image.";
      setUploadError(message);
      toast.error(message);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const message = "Image size must not exceed 10 MB.";
      setUploadError(message);
      toast.error(message);
      return;
    }

    setIsUploading(true);

    try {
      const uploadedImage = await toast.promise(
        uploadImage(file, "testimonials"),
        {
          pending: "Uploading student image...",
          success: "Student image uploaded successfully",
          error: {
            render({ data }) {
              return data instanceof Error
                ? data.message
                : "Failed to upload student image";
            },
          },
        },
      );

      onImageChange(uploadedImage);
    } catch (error) {
      console.error("TESTIMONIAL IMAGE UPLOAD ERROR:", error);

      setUploadError(
        error instanceof Error
          ? error.message
          : "Failed to upload student image",
      );
    } finally {
      setIsUploading(false);

      // Allow selecting the same file again.
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void handleFile(event.target.files?.[0]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    // Ignore movement between children inside the drop area.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (isUploading) return;

    void handleFile(event.dataTransfer.files?.[0]);
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    setUploadError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {image ? (
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 p-3">
          <img
            src={image.url}
            alt="Student"
            className="size-20 shrink-0 rounded-lg border border-zinc-200 object-cover"
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-900">Student image</p>

            <p className="mt-1 text-xs text-zinc-500">
              Image uploaded successfully.
            </p>

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 cursor-pointer text-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Replace image
            </button>
          </div>

          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={isUploading}
            aria-label="Remove student image"
            className="cursor-pointer rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`flex min-h-44 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
            isDragging
              ? "border-zinc-900 bg-zinc-100"
              : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100/70"
          } ${isUploading ? "cursor-wait opacity-70" : "cursor-pointer"}`}
        >
          <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-white text-zinc-600 shadow-sm ring-1 ring-zinc-200">
            {isUploading ? (
              <LoaderCircle size={21} className="animate-spin" />
            ) : isDragging ? (
              <UploadCloud size={21} />
            ) : (
              <ImagePlus size={21} />
            )}
          </div>

          <p className="text-sm font-medium text-zinc-800">
            {isUploading
              ? "Uploading image..."
              : isDragging
                ? "Drop your image here"
                : "Drag and drop an image here"}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            or{" "}
            <span className="font-medium text-zinc-800 underline underline-offset-2">
              browse files
            </span>
          </p>

          <p className="mt-3 text-xs text-zinc-400">
            JPG, PNG, or WebP · Maximum 10 MB
          </p>
        </div>
      )}

      {uploadError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {uploadError}
        </p>
      )}
    </div>
  );
}
