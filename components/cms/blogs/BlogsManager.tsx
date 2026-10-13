"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import BlogForm from "./BlogForm";
import { Blog } from "@/types/blog";

export default function BlogsManager() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/cms/blogs");

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Failed to fetch blogs");
      }

      setBlogs(result.data);
    } catch (error) {
      console.error("FETCH BLOGS ERROR:", error);

      toast.error("Failed to fetch blogs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

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

    await fetchBlogs();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

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

      await fetchBlogs();
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

      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-950">Blogs</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Manage your existing blogs.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Loading blogs...
            </div>
          ) : blogs.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-zinc-500">
                No blogs have been created yet.
              </p>

              <button
                type="button"
                onClick={handleAddBlog}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                <Plus size={16} />
                Add Your First Blog
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Blog
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Category
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {blogs.map((blog) => (
                  <tr key={blog._id} className="transition hover:bg-zinc-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {blog.cardImage ? (
                          <img
                            src={blog.cardImage.url}
                            alt={blog.title}
                            className="h-12 w-16 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-12 w-16 rounded-md bg-zinc-100" />
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {blog.title}
                          </p>

                          {/* <p className="mt-1 truncate text-xs text-zinc-500">
                            /{blog.slug}
                          </p> */}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-zinc-600">
                      {blog.category}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                          blog.status.toLowerCase() === "published"
                            ? "bg-green-100 text-green-700 border border-green-700"
                            : "bg-amber-100 text-amber-600 border border-amber-600"
                        } capitalize`}
                      >
                        {blog.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-zinc-500">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditBlog(blog)}
                          title="Edit blog"
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError("");
                            setBlogToDelete(blog);
                          }}
                          title="Delete blog"
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* DELETE CONFIRMATION */}
      {blogToDelete && (
        <div
          onClick={() => {
            if (isDeleting) return;

            setBlogToDelete(null);
            setDeleteError("");
          }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-zinc-950">
              Delete blog?
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Are you sure you want to delete{" "}
              <span className="font-medium text-zinc-800">
                "{blogToDelete.title}"
              </span>
              ? This action cannot be undone.
            </p>

            {deleteError && (
              <p className="mt-3 text-sm text-red-600">{deleteError}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setBlogToDelete(null);
                  setDeleteError("");
                }}
                className="cursor-pointer rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteBlog}
                className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
