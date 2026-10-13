import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorizeAdmin } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import cloudinary from "@/lib/cloudinary";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { response } = await authorizeAdmin();

  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid blog ID",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const {
      title,
      slug,
      category,
      content,
      cardImage,
      contentImage,

      // SEO
      metaTitle,
      metaDescription,
      metaKeywords,
      focusKeyword,

      // CTA
      ctaText,
      ctaLink,

      status,
      featured,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog title is required",
        },
        { status: 400 },
      );
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog slug is required",
        },
        { status: 400 },
      );
    }

    if (!category?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog category is required",
        },
        { status: 400 },
      );
    }

    if (!content || content.type !== "doc") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid blog content",
        },
        { status: 400 },
      );
    }

    if (!["draft", "published"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid blog status",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const existingBlog = await Blog.findById(id);

    if (!existingBlog) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog not found",
        },
        { status: 404 },
      );
    }

    const normalizedSlug = slug.trim().toLowerCase();

    // Make sure another blog isn't already using this slug.
    const slugExists = await Blog.findOne({
      slug: normalizedSlug,
      _id: { $ne: id },
    });

    if (slugExists) {
      return NextResponse.json(
        {
          success: false,
          message: "A blog with this slug already exists",
        },
        { status: 409 },
      );
    }

    if (Boolean(featured)) {
      await Blog.updateMany(
        {
          featured: true,
          _id: { $ne: existingBlog._id },
        },
        { $set: { featured: false } },
      );
    }

    existingBlog.title = title.trim();
    existingBlog.slug = normalizedSlug;
    existingBlog.category = category.trim();

    existingBlog.content = content;

    existingBlog.cardImage = cardImage ?? null;
    existingBlog.contentImage = contentImage ?? null;

    // SEO
    existingBlog.metaTitle = metaTitle?.trim() ?? "";
    existingBlog.metaDescription = metaDescription?.trim() ?? "";

    existingBlog.metaKeywords = Array.isArray(metaKeywords)
      ? metaKeywords.map((keyword: string) => keyword.trim()).filter(Boolean)
      : [];

    existingBlog.focusKeyword = focusKeyword?.trim() ?? "";

    // CTA
    existingBlog.ctaText = ctaText?.trim() ?? "";
    existingBlog.ctaLink = ctaLink?.trim() ?? "";

    existingBlog.status = status;
    existingBlog.featured = Boolean(featured);

    // First time this blog is published.
    if (status === "published" && !existingBlog.publishedAt) {
      existingBlog.publishedAt = new Date();
    }

    // If moved back to draft.
    if (status === "draft") {
      existingBlog.publishedAt = null;
    }

    await existingBlog.save();

    return NextResponse.json({
      success: true,
      message: "Blog updated successfully",
      data: existingBlog,
    });
  } catch (error) {
    console.error("UPDATE BLOG ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update blog",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { response } = await authorizeAdmin();

  if (response) {
    return response;
  }

  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid blog ID",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const blog = await Blog.findById(id);

    if (!blog) {
      return NextResponse.json(
        {
          success: false,
          message: "Blog not found",
        },
        { status: 404 },
      );
    }

    // Collect all Cloudinary assets used by this blog.
    // Set prevents deleting the same image twice when
    // cardImage and contentImage use the same publicId.
    const publicIds = new Set<string>();

    if (blog.cardImage?.publicId) {
      publicIds.add(blog.cardImage.publicId);
    }

    if (blog.contentImage?.publicId) {
      publicIds.add(blog.contentImage.publicId);
    }

    // Delete the blog from MongoDB first.
    await blog.deleteOne();

    // Then clean up its Cloudinary assets.
    const cloudinaryResults = await Promise.allSettled(
      [...publicIds].map((publicId) =>
        cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
        }),
      ),
    );

    // Cloudinary cleanup failing should not turn an already
    // successful database deletion into a failed API response.
    cloudinaryResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `CLOUDINARY DELETE ERROR (${[...publicIds][index]}):`,
          result.reason,
        );
      }
    });

    return NextResponse.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("DELETE BLOG ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete blog",
      },
      { status: 500 },
    );
  }
}
