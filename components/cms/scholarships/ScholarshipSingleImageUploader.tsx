"use client";

import { useRef } from "react";
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

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-zinc-800">{label}</h3>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>

      {image ? (
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 p-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-50">
            <img
              src={image.url}
              alt={label}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="cursor-pointer text-sm font-medium text-zinc-700 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Replace image"}
            </button>

            <button
              type="button"
              onClick={onRemove}
              disabled={uploading}
              className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-sm font-medium text-zinc-700">
            {uploading ? "Uploading..." : `Upload ${label.toLowerCase()}`}
          </span>
          <span className="mt-1 text-xs text-zinc-400">JPG, PNG or WebP</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onUpload}
        disabled={uploading}
        className="hidden"
      />
    </div>
  );
}
