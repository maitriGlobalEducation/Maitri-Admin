"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { Testimonial } from "@/types/testimonial";
import TestimonialImageUploader from "./TestimonialImageUploader";
import type { UploadedMedia } from "@/services/media.service";

interface TestimonialFormProps {
  testimonial: Testimonial | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface TestimonialFormData {
  name: string;
  course: string;
  university: string;
  image: UploadedMedia | null;
  testimonial: string;
}

const initialFormData: TestimonialFormData = {
  name: "",
  course: "",
  university: "",
  image: null,
  testimonial: "",
};

export default function TestimonialForm({
  testimonial,
  onCancel,
  onSuccess,
}: TestimonialFormProps) {
  const [formData, setFormData] =
    useState<TestimonialFormData>(initialFormData);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (testimonial) {
      setFormData({
        name: testimonial.name,
        course: testimonial.course,
        university: testimonial.university,
        image: testimonial.image,
        testimonial: testimonial.testimonial,
      });

      setSubmitError("");

      return;
    }

    setFormData(initialFormData);
    setSubmitError("");
  }, [testimonial]);

  const updateField = <K extends keyof TestimonialFormData>(
    field: K,
    value: TestimonialFormData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    const isEditing = Boolean(testimonial);

    setIsSubmitting(true);
    setSubmitError("");

    const request = async () => {
      const url = isEditing
        ? `/api/cms/testimonials/${testimonial!._id}`
        : "/api/cms/testimonials";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            (isEditing
              ? "Failed to update testimonial"
              : "Failed to create testimonial"),
        );
      }

      return result;
    };

    try {
      await toast.promise(request(), {
        pending: isEditing
          ? "Updating testimonial..."
          : "Creating testimonial...",
        success: isEditing
          ? "Testimonial updated successfully"
          : "Testimonial created successfully",
        error: {
          render({ data }) {
            return data instanceof Error
              ? data.message
              : isEditing
                ? "Failed to update testimonial"
                : "Failed to create testimonial";
          },
        },
      });

      setFormData(initialFormData);
      onSuccess();
    } catch (error) {
      console.error(
        isEditing ? "UPDATE TESTIMONIAL ERROR:" : "CREATE TESTIMONIAL ERROR:",
        error,
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : isEditing
            ? "Failed to update testimonial"
            : "Failed to create testimonial",
      );
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
        {/* Student information */}
        <FormSection
          title="Student information"
          description="Basic information about the student."
        >
          <div className="space-y-5">
            <FormField label="Name" required>
              <input
                required
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Jasmeet Singh"
                className={inputStyles}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-5">
              <FormField label="Course" required>
                <input
                  required
                  value={formData.course}
                  onChange={(e) => updateField("course", e.target.value)}
                  placeholder="e.g. MSc Fashion Management"
                  className={inputStyles}
                />
              </FormField>

              <FormField label="University" required>
                <input
                  required
                  value={formData.university}
                  onChange={(e) => updateField("university", e.target.value)}
                  placeholder="e.g. Istituto Marangoni"
                  className={inputStyles}
                />
              </FormField>
            </div>
          </div>
        </FormSection>

        {/* Image */}
        <FormSection
          title="Student image"
          description="Upload the student's profile image."
        >
          <TestimonialImageUploader
            image={formData.image}
            onImageChange={(image) => updateField("image", image)}
          />
        </FormSection>

        {/* Testimonial */}
        {/* <FormSection
          title="Testimonial"
          description="Write the student's testimonial as it should appear on the website."
        > */}
        <FormField label="Testimonial" required>
          <textarea
            required
            value={formData.testimonial}
            onChange={(e) => updateField("testimonial", e.target.value)}
            placeholder="Write the student's testimonial..."
            rows={8}
            className={`${inputStyles} resize-y`}
          />
        </FormField>
        {/* </FormSection> */}
      </div>

      {submitError && (
        <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 rounded-b-xl border-t border-zinc-200 bg-white px-6 py-4">
        {testimonial && (
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
          {isSubmitting
            ? "Saving..."
            : testimonial
              ? "Save Changes"
              : "Create Testimonial"}
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
