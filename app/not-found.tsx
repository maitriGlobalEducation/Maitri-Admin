"use client";
import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <FileQuestion size={24} className="text-zinc-600" />
        </div>

        <p className="mb-2 text-sm font-medium text-zinc-500">404</p>

        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>

        <div className="mt-7 flex justify-center">
          <Link
            href="/cms/homepage"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            <ArrowLeft size={16} />
            Back to CMS
          </Link>
        </div>
      </div>
    </main>
  );
}
