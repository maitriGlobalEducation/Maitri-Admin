"use client";

import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Video,
  Upload,
  X,
  RefreshCw,
  LoaderCircle,
  FileImage,
} from "lucide-react"; // Adjust this import path
import {
  MediaType,
  UploadedMedia,
  uploadImage,
  uploadVideo,
} from "@/services/media.service";
import { toast } from "react-toastify";

type Props = {
  label: string;
  value: UploadedMedia | null;
  onChange: (media: UploadedMedia | null) => void;
  mediaType: MediaType;
  kind?: "image" | "video";
  aspect?: string;
  description?: string;
};

export default function MediaUploader({
  label,
  value,
  onChange,
  mediaType,
  kind = "image",
  aspect = "aspect-video",
  description,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const isVideo = kind === "video";
  const hasMedia = Boolean(value?.url);
  const previewUrl = localPreview || value?.url;

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function clearLocalPreview() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setLocalPreview(null);
  }

  async function handleFile(file?: File) {
    if (!file || isUploading) return;

    setError("");
    clearLocalPreview();

    // Show a temporary preview while the file uploads.
    const preview = URL.createObjectURL(file);
    objectUrlRef.current = preview;
    setLocalPreview(preview);

    setIsUploading(true);

    try {
      const uploadedMedia = isVideo
        ? await uploadVideo(file, mediaType)
        : await uploadImage(file, mediaType);

      clearLocalPreview();
      onChange(uploadedMedia);
      toast.success("Media Uploaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload media.");
      toast.error(
        err instanceof Error ? err.message : "Failed to upload media.",
      );
      clearLocalPreview();
    } finally {
      setIsUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (isUploading) return;

    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  }

  function handleRemove() {
    if (isUploading) return;

    clearLocalPreview();
    setError("");
    onChange(null);
  }

  const accept = isVideo
    ? "video/mp4,video/webm,video/quicktime"
    : "image/jpeg,image/png,image/webp";

  return (
    <div className="w-full">
      {/* Label */}
      <div className="mb-2 flex items-center gap-2">
        <label className="text-sm font-semibold text-zinc-800">{label}</label>

        {/* {hasMedia && !isUploading && (
          <span className="rounded-lg bg-emerald-100 border border-emerald-600 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            Uploaded
          </span>
        )} */}
      </div>

      {/* Preview */}
      {previewUrl ? (
        <div
          className={`group relative w-full max-w-90 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 ${aspect}`}
        >
          {isVideo ? (
            <video
              key={previewUrl}
              src={previewUrl}
              controls={!isUploading}
              className="size-full object-contain"
            />
          ) : (
            <img
              src={previewUrl}
              alt={label}
              className="size-full object-cover p-3"
            />
          )}

          {/* Upload overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/85 backdrop-blur-sm">
              <LoaderCircle
                size={21}
                className="animate-spin text-orange-600"
              />
              <span className="text-xs font-semibold text-zinc-700">
                Uploading {isVideo ? "video" : "image"}...
              </span>
              <span className="text-[10px] text-zinc-400">Please wait</span>
            </div>
          )}

          {/* Actions */}
          {!isUploading && (
            <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-orange-600"
                title="Replace media"
              >
                <RefreshCw size={15} />
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                title="Remove media"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Dropzone */
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!isUploading) setIsDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploading) inputRef.current?.click();
          }}
          className={`flex min-h-32 max-w-90 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
            isDragging
              ? "border-orange-400 bg-orange-50"
              : "border-zinc-200 bg-zinc-50/70 hover:border-orange-300 hover:bg-orange-50/40"
          }`}
        >
          {isUploading ? (
            <>
              <LoaderCircle
                size={28}
                className="animate-spin text-orange-600"
              />
              <p className="mt-3 text-sm font-semibold text-zinc-700">
                Uploading...
              </p>
            </>
          ) : (
            <>
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-orange-600 shadow-sm">
                {isVideo ? <Video size={22} /> : <ImagePlus size={22} />}
              </div>

              <p className="text-sm font-semibold text-zinc-800">
                Drop your {isVideo ? "video" : "image"} here, or{" "}
                <span className="text-orange-600">browse</span>
              </p>

              <p className="mt-1.5 text-xs text-zinc-400">
                {isVideo
                  ? "MP4, WebM or MOV · Maximum 100 MB"
                  : "JPG, PNG or WebP · Maximum 10 MB"}
              </p>
            </>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="mt-2 text-xs leading-5 text-zinc-400">{description}</p>
      )}

      {/* Replace action for existing media */}
      {hasMedia && !isUploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-orange-600"
        >
          <Upload size={13} />
          Replace {isVideo ? "video" : "image"}
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={isUploading}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
