import { Image } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableImageView } from "@/components/cms/ResizableImageView";

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      width: {
        default: "auto",

        parseHTML: (element) =>
          element.getAttribute("width") || element.style.width || "auto",

        renderHTML: (attributes) => ({
          style: `width: ${
            attributes.width === "auto"
              ? "auto"
              : typeof attributes.width === "number"
                ? `${attributes.width}px`
                : attributes.width
          }; max-width: 100%; height: auto;`,
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
