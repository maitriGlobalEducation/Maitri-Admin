"use client";

import { useEffect } from "react";
import { AlertTriangle, LoaderCircle, X } from "lucide-react";

type Props = {
  open: boolean;
  title?: string;
  itemName?: string;
  description?: string;
  isDeleting?: boolean;
  error?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteModal({
  open,
  title = "Delete item?",
  itemName,
  description = "This action cannot be undone.",
  isDeleting = false,
  error = "",
  confirmLabel = "Delete",
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isDeleting, onClose]);

  if (!open) return null;

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl border border-zinc-100 bg-white p-6 shadow-2xl duration-150"
      >
        {/* Icon and close */}
        <div className="flex items-start justify-between">
          <div className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={21} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close dialog"
            className="cursor-pointer rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <h3
          id="delete-modal-title"
          className="mt-4 text-lg font-semibold text-zinc-950"
        >
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {description}{" "}
          {itemName && (
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-zinc-800">"{itemName}"</span>?
            </>
          )}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting && <LoaderCircle size={15} className="animate-spin" />}
            {isDeleting ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
