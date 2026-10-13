import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { authorizeAdmin } from "@/lib/api-auth";
import Blog from "@/models/Blog";

export async function POST(request: NextRequest) {
  const { response } = await authorizeAdmin();

  if (response) {
    return response;
  }

  try {
    const body = await request.json();

    const {
      title,
      slug,
      category,
      content,
      cardImage,
      contentImage,
      metaTitle,
      metaDescription,
      metaKeywords,
      focusKeyword,
      ctaText,
      ctaLink,
      status,
      featured,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, message: "Blog title is required" },
        { status: 400 },
      );
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, message: "Blog slug is required" },
        { status: 400 },
      );
    }

    if (!category?.trim()) {
      return NextResponse.json(
        { success: false, message: "Blog category is required" },
        { status: 400 },
      );
    }

    if (!content || content.type !== "doc") {
      return NextResponse.json(
        { success: false, message: "Invalid blog content" },
        { status: 400 },
      );
    }

    if (!["draft", "published"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid blog status" },
        { status: 400 },
      );
    }

    await connectDB();

    const normalizedSlug = slug.trim().toLowerCase();

    const existingBlog = await Blog.findOne({
      slug: normalizedSlug,
    });

    if (existingBlog) {
      return NextResponse.json(
        {
          success: false,
          message: "A blog with this slug already exists",
        },
        { status: 409 },
      );
    }

    const blog = await Blog.create({
      title: title.trim(),
      slug: normalizedSlug,
      category: category.trim(),
      content,
      cardImage: cardImage ?? null,
      contentImage: contentImage ?? null,
      metaTitle: metaTitle?.trim() ?? "",
      metaDescription: metaDescription?.trim() ?? "",
      metaKeywords: Array.isArray(metaKeywords)
        ? metaKeywords
            .filter(
              (keyword: unknown): keyword is string =>
                typeof keyword === "string",
            )
            .map((keyword: string) => keyword.trim())
            .filter(Boolean)
        : [],
      focusKeyword: focusKeyword?.trim() ?? "",
      ctaText: ctaText?.trim() ?? "",
      ctaLink: ctaLink?.trim() ?? "",
      status,
      featured: Boolean(featured),
      publishedAt: status === "published" ? new Date() : null,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Blog created successfully",
        data: blog,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE BLOG ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create blog" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    // Public visitors should only see published blogs.
    // Authenticated admins can see drafts as well.
    const { admin } = await authorizeAdmin();

    const filter = admin ? {} : { status: "published" };

    const blogs = await Blog.find(filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error("GET BLOGS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch blogs" },
      { status: 500 },
    );
  }
}
