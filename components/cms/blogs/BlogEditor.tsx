"use client";

import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Link } from "@tiptap/extension-link";
import { ResizableImage } from "@/components/cms/ResizableImage";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo2,
  Redo2,
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { uploadImage } from "@/services/media.service";
import { NodeSelection } from "@tiptap/pm/state";

interface BlogEditorProps {
  content?: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export default function BlogEditor({ content, onChange }: BlogEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,

      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
          class: "blog-link",
        },
      }),

      ResizableImage.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "blog-image",
        },
      }),

      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "blog-table",
        },
      }),

      TableRow,
      TableHeader,
      TableCell,
    ],

    content: content ?? {
      type: "doc",
      content: [{ type: "paragraph" }],
    },

    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },

    editorProps: {
      attributes: {
        class:
          "blog-editor ProseMirror min-h-80 px-5 py-4 text-sm leading-7 text-zinc-800 outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor || !content) return;

    const currentContent = editor.getJSON();

    if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
      const timeoutId = window.setTimeout(() => {
        editor.commands.setContent(content, {
          emitUpdate: false,
        });
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [editor, content]);

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor?.isActive("bold") ?? false,
      isItalic: editor?.isActive("italic") ?? false,

      isImageSelected:
        editor?.state.selection instanceof NodeSelection &&
        editor.state.selection.node.type.name === "image",

      isH2: editor?.isActive("heading", { level: 2 }) ?? false,
      isH3: editor?.isActive("heading", { level: 3 }) ?? false,

      isBulletList: editor?.isActive("bulletList") ?? false,
      isOrderedList: editor?.isActive("orderedList") ?? false,
      isBlockquote: editor?.isActive("blockquote") ?? false,

      canUndo: editor?.can().chain().focus().undo().run() ?? false,
      canRedo: editor?.can().chain().focus().redo().run() ?? false,
    }),
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  if (!editor) return null;

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // Allow selecting the same image again later.
    event.target.value = "";

    if (!file || !editor) return;

    // Save the cursor position before uploading.
    const position = editor.state.selection.from;

    try {
      setUploadingImage(true);
      setImageUploadError("");

      const uploadedImage = await uploadImage(file, "blogs");

      // Insert the uploaded image at the original cursor position.
      editor
        .chain()
        .focus()
        .insertContentAt(position, {
          type: "image",
          attrs: {
            src: uploadedImage.url,
            alt: file.name,
            title: file.name,
          },
        })
        .run();
    } catch (error) {
      console.error("BLOG CONTENT IMAGE UPLOAD ERROR:", error);

      setImageUploadError(
        error instanceof Error ? error.message : "Failed to upload image.",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="relative overflow-visible rounded-xl border border-zinc-200 bg-white">
      {/* Toolbar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-1 rounded-t-xl border-b border-zinc-200 bg-white/95 p-2 shadow-sm backdrop-blur">
        <ToolbarButton
          active={editorState?.isH2}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading 2"
        >
          <Heading2 size={17} />
        </ToolbarButton>

        <ToolbarButton
          active={editorState?.isH3}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Heading 3"
        >
          <Heading3 size={17} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editorState?.isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold size={17} />
        </ToolbarButton>

        <ToolbarButton
          active={editorState?.isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic size={17} />
        </ToolbarButton>

        <Divider />

        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={uploadingImage}
          onChange={handleImageUpload}
        />

        <ToolbarButton
          disabled={uploadingImage}
          onClick={() => imageInputRef.current?.click()}
          title="Upload image"
        >
          {uploadingImage ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <ImagePlus size={17} />
          )}
        </ToolbarButton>

        <ToolbarButton
          disabled={!editorState?.isImageSelected}
          onClick={() => editor.chain().focus().deleteSelection().run()}
          title="Remove selected image"
        >
          <Trash2 size={17} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editorState?.isBulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List size={17} />
        </ToolbarButton>

        <ToolbarButton
          active={editorState?.isOrderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered size={17} />
        </ToolbarButton>

        <ToolbarButton
          active={editorState?.isBlockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <Quote size={17} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          disabled={!editorState?.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo2 size={17} />
        </ToolbarButton>

        <ToolbarButton
          disabled={!editorState?.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo2 size={17} />
        </ToolbarButton>
      </div>

      {imageUploadError && (
        <div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2">
          <p className="text-sm text-red-700">{imageUploadError}</p>

          <button
            type="button"
            onClick={() => setImageUploadError("")}
            className="cursor-pointer text-sm font-medium text-red-700 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active = false,
  disabled = false,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition ${
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950"
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-zinc-300" />;
}
