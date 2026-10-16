"use client";

import { useState } from "react";

export interface HomepageSEO {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  focusKeyword: string;
}

interface Props {
  seo: HomepageSEO;
  onChange: (seo: HomepageSEO) => void;
}

const inputClassName =
  "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

const labelClassName = "text-sm font-medium text-zinc-700";

export default function HomepageSEOForm({ seo, onChange }: Props) {
  const [keywordsInput, setKeywordsInput] = useState(() =>
    seo.metaKeywords.join(", "),
  );

  const updateField = <K extends keyof HomepageSEO>(
    field: K,
    value: HomepageSEO[K],
  ) => {
    onChange({ ...seo, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="homepage-meta-title" className={labelClassName}>
          Meta Title
        </label>
        <input
          id="homepage-meta-title"
          value={seo.metaTitle}
          onChange={(e) => updateField("metaTitle", e.target.value)}
          placeholder="Maitri Global Education | Study Abroad"
          maxLength={70}
          className={inputClassName}
        />
        <p className="mt-1 text-xs text-zinc-500">
          {seo.metaTitle.length}/70 characters
        </p>
      </div>

      <div>
        <label htmlFor="homepage-meta-description" className={labelClassName}>
          Meta Description
        </label>
        <textarea
          id="homepage-meta-description"
          value={seo.metaDescription}
          onChange={(e) => updateField("metaDescription", e.target.value)}
          placeholder="Describe your homepage for search engine results..."
          rows={4}
          maxLength={320}
          className={`${inputClassName} resize-y`}
        />
        <p className="mt-1 text-xs text-zinc-500">
          {seo.metaDescription.length}/320 characters
        </p>
      </div>

      <div>
        <label htmlFor="homepage-meta-keywords" className={labelClassName}>
          Meta Keywords
        </label>
        <input
          id="homepage-meta-keywords"
          value={keywordsInput}
          onChange={(e) => {
            const value = e.target.value;

            setKeywordsInput(value);

            updateField(
              "metaKeywords",
              value
                .split(",")
                .map((keyword) => keyword.trim())
                .filter(Boolean),
            );
          }}
          onBlur={() => {
            setKeywordsInput(seo.metaKeywords.join(", "));
          }}
          placeholder="study abroad, overseas education, universities"
          className={inputClassName}
        />
        <p className="mt-1 text-xs text-zinc-500">
          Separate keywords with commas.
        </p>
      </div>

      <div>
        <label htmlFor="homepage-focus-keyword" className={labelClassName}>
          Focus Keyword
        </label>
        <input
          id="homepage-focus-keyword"
          value={seo.focusKeyword}
          onChange={(e) => updateField("focusKeyword", e.target.value)}
          placeholder="study abroad consultants"
          className={inputClassName}
        />
      </div>
    </div>
  );
}
