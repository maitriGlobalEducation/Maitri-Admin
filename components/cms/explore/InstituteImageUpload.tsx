"use client";

import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, UploadCloud, X } from "lucide-react";
import { toast } from "react-toastify";
import type { InstituteImage } from "@/types/explore-institute";
import { uploadImage } from "@/services/media.service";

type Props = {
  label: string;
  mediaType: "explore-institutes";
  value: InstituteImage | null;
  onChange: (image: InstituteImage | null) => void;
  aspect?: string;
};

export default function InstituteImageUpload({
  label,
  mediaType,
  value,
  onChange,
  aspect = "aspect-video",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function processFile(file?: File) {
    if (!file || uploading) return;

    setUploading(true);

    try {
      const uploaded = await toast.promise(uploadImage(file, mediaType), {
        pending: `Uploading ${label.toLowerCase()}...`,
        success: `${label} uploaded successfully`,
        error: {
          render({ data }) {
            return data instanceof Error
              ? data.message
              : `Failed to upload ${label.toLowerCase()}`;
          },
        },
      });

      onChange({
        url: uploaded.url,
        publicId: uploaded.publicId,
      });
    } catch (error) {
      console.error(`INSTITUTE ${label.toUpperCase()} UPLOAD ERROR:`, error);
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </label>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void processFile(event.dataTransfer.files?.[0]);
        }}
        onClick={() => {
          if (!uploading) inputRef.current?.click();
        }}
        className={`relative flex ${aspect} cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
          dragging
            ? "border-orange-500 bg-orange-50"
            : "border-zinc-300 bg-zinc-50 hover:border-orange-400 hover:bg-orange-50/40"
        }`}
      >
        {value?.url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.url}
              alt={`${label} preview`}
              className="absolute inset-0 size-full object-contain p-3"
            />

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-zinc-950/65 px-3 py-2.5 text-xs font-medium text-white">
              <ImagePlus size={14} />
              Replace image
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
              }}
              className="absolute right-2 top-2 z-10 cursor-pointer rounded-full bg-white p-1.5 text-zinc-700 shadow hover:text-red-600"
              aria-label={`Remove ${label}`}
            >
              <X size={15} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center px-4 text-center">
            {uploading ? (
              <LoaderCircle
                className="mb-3 animate-spin text-orange-600"
                size={28}
              />
            ) : (
              <UploadCloud className="mb-3 text-zinc-400" size={30} />
            )}

            <p className="text-sm font-medium text-zinc-700">
              {uploading ? "Uploading..." : "Drop your image here"}
            </p>

            <p className="mt-1 text-xs text-zinc-500">or click to browse</p>

            <p className="mt-2 text-[11px] text-zinc-400">JPEG, PNG or WebP</p>
          </div>
        )}

        {uploading && value?.url && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75">
            <LoaderCircle className="animate-spin text-orange-600" size={30} />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void processFile(event.target.files?.[0])}
      />
    </div>
  );
}
