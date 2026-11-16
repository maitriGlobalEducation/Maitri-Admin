"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import BlogForm from "./BlogForm";
import { Blog } from "@/types/blog";
import StatusSwitch, {
  StatusType,
} from "@/components/Common Components/StatusSwitch";
import DataTable from "@/components/Common Components/DataTable";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import { DataTableColumn } from "@/types/dataTable";

export default function BlogsManager() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const PAGE_SIZE = 10;

  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Inside your component

  type BlogPageData = {
    blogs: typeof blogs;
    totalPages: number;
    totalBlogs: number;
  };

  const pageCache = useRef(new Map<string, BlogPageData>());

  const pendingRequests = useRef(new Map<string, Promise<BlogPageData>>());

  // Generate a unique key for each page and search combination.
  const getCacheKey = (page: number, search: string) =>
    `${search.trim().toLowerCase()}-${page}`;

  // Shared API request handler (prevents duplicate requests).
  const getBlogsPage = useCallback(
    async (page: number, search: string): Promise<BlogPageData> => {
      const key = getCacheKey(page, search);

      const existingRequest = pendingRequests.current.get(key);

      if (existingRequest) {
        return existingRequest;
      }

      const request = (async () => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        if (search) {
          params.set("search", search);
        }

        const response = await fetch(`/api/cms/blogs?${params.toString()}`);

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch blogs.");
        }

        return {
          blogs: result.data,
          totalPages: result.pagination.totalPages,
          totalBlogs: result.pagination.total,
        };
      })();

      pendingRequests.current.set(key, request);

      try {
        return await request;
      } finally {
        pendingRequests.current.delete(key);
      }
    },
    [],
  );

  // Prefetch a page without updating the UI.
  const prefetchPage = useCallback(
    async (page: number, search: string) => {
      if (page < 1) return;

      const key = getCacheKey(page, search);

      if (pageCache.current.has(key) || pendingRequests.current.has(key)) {
        return;
      }

      try {
        const result = await getBlogsPage(page, search);

        pageCache.current.set(key, result);
      } catch (error) {
        console.error("Blog prefetch failed:", error);
      }
    },
    [getBlogsPage],
  );

  // Prepare both neighboring pages.
  const prefetchAdjacentPages = useCallback(
    (page: number, search: string, totalPages: number) => {
      if (page > 1) {
        void prefetchPage(page - 1, search);
      }

      if (page < totalPages) {
        void prefetchPage(page + 1, search);
      }
    },
    [prefetchPage],
  );

  // Main pagination function.
  const fetchBlogs = useCallback(
    async (page: number, search = debouncedSearch) => {
      const key = getCacheKey(page, search);

      // 1. Serve cached data immediately.
      const cached = pageCache.current.get(key);

      if (cached) {
        setBlogs(cached.blogs);
        setTotalPages(cached.totalPages);
        setTotalBlogs(cached.totalBlogs);
        setCurrentPage(page);
        setPageLoading(false);

        prefetchAdjacentPages(page, search, cached.totalPages);

        return;
      }

      // 2. Fetch from API if not cached.
      try {
        setPageLoading(true);

        const result = await getBlogsPage(page, search);

        pageCache.current.set(key, result);

        setBlogs(result.blogs);
        setTotalPages(result.totalPages);
        setTotalBlogs(result.totalBlogs);
        setCurrentPage(page);

        // 3. Prepare previous and next pages.
        prefetchAdjacentPages(page, search, result.totalPages);
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      } finally {
        setPageLoading(false);
      }
    },
    [debouncedSearch, getBlogsPage, prefetchAdjacentPages],
  );

  // Handle search changes and pagination.
  const previousSearch = useRef(debouncedSearch);

  useEffect(() => {
    if (previousSearch.current !== debouncedSearch) {
      previousSearch.current = debouncedSearch;

      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }

    void fetchBlogs(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchBlogs]);

  const handleEditBlog = (blog: Blog) => {
    setSelectedBlog(blog);

    window.scrollTo({
      top: 200,
      behavior: "smooth",
    });
  };

  const handleAddBlog = () => {
    setSelectedBlog(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleFormSuccess = async () => {
    setSelectedBlog(null);

    await fetchBlogs(1);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  async function handleBlogStatusChange(blogId: string, newStatus: StatusType) {
    try {
      const response = await fetch(`/api/cms/blogs/${blogId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update blog status.");
      }

      const updatedBlog = result.data;

      if (!updatedBlog?._id) {
        throw new Error("Invalid blog data returned.");
      }

      setBlogs((previous) =>
        previous.map((item) =>
          item._id === updatedBlog._id ? updatedBlog : item,
        ),
      );

      toast.success(
        `Blog ${newStatus === "published" ? "published" : "moved to draft"} successfully.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update blog status.";

      toast.error(message);
    }
  }

  const handleDeleteBlog = async () => {
    if (!blogToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError("");

      const response = await fetch(`/api/cms/blogs/${blogToDelete._id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to delete blog");
      }

      toast.success("Blog deleted successfully");

      setBlogToDelete(null);

      await fetchBlogs(1);
    } catch (error) {
      console.error("DELETE BLOG ERROR:", error);

      const message =
        error instanceof Error ? error.message : "Failed to delete blog";

      setDeleteError(message);

      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const blogColumns: DataTableColumn<Blog>[] = [
    {
      key: "blog",
      header: "Blog",
      cellClassName: "min-w-65",
      render: (blog) => (
        <div className="flex items-center gap-3">
          {blog.cardImage ? (
            <img
              src={blog.cardImage.url}
              alt={blog.title}
              className="h-10 w-14 rounded-md object-cover"
            />
          ) : (
            <div className="h-10 w-14 rounded-md bg-zinc-100" />
          )}

          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900">{blog.title}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cellClassName: "text-zinc-600",
      render: (blog) => blog.category,
    },
    {
      key: "date",
      header: "Date",
      cellClassName: "whitespace-nowrap text-zinc-500",
      render: (blog) => new Date(blog.createdAt).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Status",
      render: (blog) => (
        <StatusSwitch
          status={blog.status}
          size="sm"
          onChange={(newStatus) => handleBlogStatusChange(blog._id, newStatus)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-10">
      {/* BLOG LIST */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-950">
            {selectedBlog ? "Edit Blog" : "Add Blog"}
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            {selectedBlog
              ? "Update the blog details and save your changes."
              : "Add a student blog to the website."}
          </p>
        </div>
        <BlogForm
          blog={selectedBlog}
          onCancel={handleAddBlog}
          onSuccess={handleFormSuccess}
        />
      </div>

      <DataTable
        columns={blogColumns}
        data={blogs}
        getRowKey={(blog) => blog._id}
        loading={pageLoading}
        minWidth="850px"
        emptyState={
          <p className="text-xs text-zinc-500">
            {debouncedSearch
              ? `No blogs found matching "${debouncedSearch}".`
              : "No blogs available."}
          </p>
        }
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
        toolbar={{
          title: `Blogs (${totalBlogs})`,
          description: "Manage your blog posts",
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Search blogs...",
          refreshing: pageLoading,
          onRefresh: () => fetchBlogs(currentPage, debouncedSearch),
        }}
        actions={{
          onEdit: handleEditBlog,
          onDelete: (blog) => {
            setDeleteError("");
            setBlogToDelete(blog);
          },
          editTitle: "Edit blog",
          deleteTitle: "Delete blog",
        }}
      />

      {/* DELETE CONFIRMATION */}
      {blogToDelete && (
        <ConfirmDeleteModal
          open={!!blogToDelete}
          title="Delete blog?"
          itemName={blogToDelete?.title}
          isDeleting={isDeleting}
          error={deleteError}
          onClose={() => {
            if (isDeleting) return;

            setBlogToDelete(null);
            setDeleteError("");
          }}
          onConfirm={handleDeleteBlog}
        />
      )}
    </div>
  );
}
