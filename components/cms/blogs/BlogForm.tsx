"use client";

import { useEffect, useState } from "react";
import BlogEditor from "./BlogEditor";
import { Blog, BlogStatus } from "@/types/blog";
import BlogImageUploader from "./BlogImageUploader";
import type { UploadedMedia } from "@/services/media.service";
import { toast } from "react-toastify";

interface BlogFormProps {
  blog: Blog | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface BlogFormData {
  title: string;
  slug: string;
  category: string;

  content: Record<string, unknown>;

  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  focusKeyword: string;

  // CTA
  ctaText: string;
  ctaLink: string;

  status: BlogStatus;
  featured: boolean;
}

interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
}

const emptyContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

const initialFormData: BlogFormData = {
  title: "",
  slug: "",
  category: "",

  content: emptyContent,

  // SEO
  metaTitle: "",
  metaDescription: "",
  metaKeywords: [],
  focusKeyword: "",

  // CTA
  ctaText: "",
  ctaLink: "",

  status: "draft",
  featured: false,
};

export default function BlogForm({ blog, onCancel, onSuccess }: BlogFormProps) {
  const [formData, setFormData] = useState<BlogFormData>(initialFormData);
  const [images, setImages] = useState<UploadedMedia[]>([]);
  const [cardImageIndex, setCardImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [metaKeywordsInput, setMetaKeywordsInput] = useState("");
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title,
        slug: blog.slug,
        category: blog.category,

        content: blog.content,

        // SEO
        metaTitle: blog.metaTitle ?? "",
        metaDescription: blog.metaDescription ?? "",
        metaKeywords: blog.metaKeywords ?? [],
        focusKeyword: blog.focusKeyword ?? "",

        // CTA
        ctaText: blog.ctaText ?? "",
        ctaLink: blog.ctaLink ?? "",

        status: blog.status,
        featured: blog.featured,
      });

      setMetaKeywordsInput((blog.metaKeywords ?? []).join(", "));

      const existingImages: UploadedMedia[] = [];

      if (blog.cardImage) {
        existingImages.push(blog.cardImage);
      }

      if (
        blog.contentImage &&
        blog.contentImage.publicId !== blog.cardImage?.publicId
      ) {
        existingImages.push(blog.contentImage);
      }

      setImages(existingImages);
      setCardImageIndex(0);

      return;
    }

    setFormData(initialFormData);
    setMetaKeywordsInput("");
    setImages([]);
    setCardImageIndex(0);
  }, [blog]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        setCategoryError("");

        const response = await fetch("/api/cms/blog-categories");
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message ?? "Failed to fetch categories");
        }

        setCategories(result.categories);
      } catch (error) {
        console.error("FETCH BLOG CATEGORIES ERROR:", error);

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load blog categories";

        setCategoryError(message);
        toast.error(message);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const updateField = <K extends keyof BlogFormData>(
    field: K,
    value: BlogFormData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,

      // Don't overwrite an existing blog's slug while editing.
      slug: blog ? prev.slug : generateSlug(value),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    let cardImage: UploadedMedia | null = null;
    let contentImage: UploadedMedia | null = null;

    if (images.length === 1) {
      cardImage = images[0];
      contentImage = images[0];
    }

    if (images.length === 2) {
      cardImage = images[cardImageIndex];

      contentImage = images[cardImageIndex === 0 ? 1 : 0];
    }

    const metaKeywords = [
      ...new Set(
        metaKeywordsInput
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean)
          .map((keyword) => keyword.toLowerCase()),
      ),
    ];

    const blogData = {
      ...formData,
      metaKeywords,
      cardImage,
      contentImage,
    };

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const isEditing = Boolean(blog);

      const url = isEditing ? `/api/cms/blogs/${blog!._id}` : "/api/cms/blogs";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            (isEditing ? "Failed to update blog" : "Failed to create blog"),
        );
      }
      toast.success(
        blog ? "Blog updated successfully" : "Blog created successfully",
      );

      // Clear the form after creating a new blog
      if (!blog) {
        setFormData(initialFormData);
        setMetaKeywordsInput("");
        setImages([]);
        setCardImageIndex(0);
      }

      onSuccess();
    } catch (error) {
      console.error(blog ? "UPDATE BLOG ERROR:" : "CREATE BLOG ERROR:", error);

      const message =
        error instanceof Error
          ? error.message
          : blog
            ? "Failed to update blog"
            : "Failed to create blog";

      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white"
    >
      <div className="space-y-8 p-6">
        {/* Basic information */}
        <FormSection
          title="Basic information"
          description="Information used to identify and organize this blog."
        >
          <div className="space-y-5">
            <FormField label="Blog title" required>
              <input
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Why Study at Istituto Marangoni Florence?"
                className={inputStyles}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-5">
              <FormField label="Slug" required>
                <input
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    updateField("slug", generateSlug(e.target.value))
                  }
                  placeholder="why-study-at-istituto-marangoni-florence"
                  className={inputStyles}
                />
              </FormField>

              <FormField label="Category" required>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  disabled={isLoadingCategories || categories?.length === 0}
                  className={`${inputStyles} disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500`}
                >
                  <option value="" disabled>
                    {isLoadingCategories
                      ? "Loading categories..."
                      : categoryError
                        ? "Failed to load categories"
                        : categories?.length === 0
                          ? "No categories available"
                          : "Select a category"}
                  </option>

                  {categories?.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {!isLoadingCategories &&
                  categories?.length === 0 &&
                  !categoryError && (
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Create a blog category before creating a blog.
                    </p>
                  )}
              </FormField>
            </div>
          </div>
        </FormSection>

        {/* Blog images */}
        <FormSection
          title="Blog Images"
          description="Upload up to two images. If you upload one image, it will be used for both the blog card and blog page."
        >
          <BlogImageUploader
            images={images}
            cardImageIndex={cardImageIndex}
            onImagesChange={setImages}
            onCardImageChange={setCardImageIndex}
          />
        </FormSection>

        {/* Blog content */}
        <FormSection
          title="Blog content"
          description="Format the article exactly how it should appear on the website."
        >
          <BlogEditor
            content={formData.content}
            onChange={(content) => updateField("content", content)}
          />
        </FormSection>

        {/* SEO */}
        <FormSection
          title="SEO"
          description="Optimize this blog for search engines."
        >
          <div className="space-y-5">
            <FormField label="Meta title">
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => updateField("metaTitle", e.target.value)}
                placeholder="e.g. Study in Italy: Universities, Costs & Requirements"
                maxLength={60}
                className={inputStyles}
              />

              <p className="mt-1.5 text-xs text-zinc-400">
                {formData.metaTitle.length}/60 characters
              </p>
            </FormField>

            <FormField label="Meta description">
              <textarea
                value={formData.metaDescription}
                onChange={(e) => updateField("metaDescription", e.target.value)}
                placeholder="Write a short description that explains what this article is about."
                maxLength={160}
                rows={4}
                className={`${inputStyles} resize-none`}
              />

              <p className="mt-1.5 text-xs text-zinc-400">
                {formData.metaDescription.length}/160 characters
              </p>
            </FormField>

            <div className="grid grid-cols-2 gap-5">
              <FormField label="Meta keywords">
                <textarea
                  value={metaKeywordsInput}
                  onChange={(event) => setMetaKeywordsInput(event.target.value)}
                  placeholder="study abroad, Italy, Italian universities"
                  rows={3}
                  className={`${inputStyles} resize-y`}
                />

                <p className="mt-1.5 text-xs text-zinc-400">
                  Enter or paste multiple keywords separated by commas.
                </p>
              </FormField>

              <FormField label="Focus keyword">
                <input
                  type="text"
                  value={formData.focusKeyword}
                  onChange={(e) => updateField("focusKeyword", e.target.value)}
                  placeholder="e.g. study in Italy"
                  className={inputStyles}
                />

                <p className="mt-1.5 text-xs text-zinc-400">
                  Choose one primary keyword for this article.
                </p>
              </FormField>
            </div>
          </div>
        </FormSection>

        {/* CTA */}
        <FormSection
          title="Call to Action"
          description="Add an optional call to action that will appear at the end of the blog."
        >
          <div className="grid grid-cols-2 gap-5">
            <FormField label="CTA text">
              <input
                type="text"
                value={formData.ctaText}
                onChange={(e) => updateField("ctaText", e.target.value)}
                placeholder="e.g. Talk to Our Education Experts"
                className={inputStyles}
              />
            </FormField>

            <FormField label="CTA link">
              <input
                type="text"
                value={formData.ctaLink}
                onChange={(e) => updateField("ctaLink", e.target.value)}
                placeholder="e.g. /contact"
                className={inputStyles}
              />
            </FormField>
          </div>
        </FormSection>

        {/* Publishing */}
        <FormSection
          title="Publishing"
          description="Control the visibility of this blog."
        >
          <div className="grid grid-cols-2 gap-5">
            <FormField label="Status">
              <select
                value={formData.status}
                onChange={(e) =>
                  updateField("status", e.target.value as BlogStatus)
                }
                className={inputStyles}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </FormField>

            <div className="flex items-end">
              <label className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-zinc-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    Featured blog
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Highlight this article on the website.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => updateField("featured", e.target.checked)}
                  className="h-4 w-4"
                />
              </label>
            </div>
          </div>
        </FormSection>
      </div>

      {/* Error */}
      {submitError && (
        <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 rounded-b-xl border-t border-zinc-200 bg-white px-6 py-4">
        {blog && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="cursor-pointer rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel Edit
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : blog ? "Save Changes" : "Create Blog"}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>

        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      </div>

      {children}
    </section>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      {children}
    </label>
  );
}

const inputStyles =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100";
