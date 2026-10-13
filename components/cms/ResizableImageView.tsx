"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useRef, useState } from "react";

type ResizeDirection = "left" | "right";

export function ResizableImageView({
  node,
  selected,
  updateAttributes,
}: NodeViewProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);

  const savedWidth = node.attrs.width as string | number | null;
  const imageWidth =
    previewWidth ??
    (typeof savedWidth === "number"
      ? savedWidth
      : savedWidth && savedWidth !== "auto"
        ? Number.parseFloat(savedWidth)
        : undefined);

  const handleResizeStart = (
    event: React.PointerEvent<HTMLButtonElement>,
    direction: ResizeDirection,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!imageRef.current) return;

    const startX = event.clientX;
    const startWidth = imageRef.current.getBoundingClientRect().width;
    const containerWidth =
      imageRef.current.parentElement?.parentElement?.getBoundingClientRect()
        .width ?? startWidth;

    let nextWidth = startWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const adjustedDelta = direction === "right" ? deltaX : -deltaX;

      nextWidth = Math.round(
        Math.min(containerWidth, Math.max(80, startWidth + adjustedDelta)),
      );

      setPreviewWidth(nextWidth);
    };

    const handlePointerUp = () => {
      updateAttributes({ width: `${nextWidth}px` });
      setPreviewWidth(null);

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  return (
    <NodeViewWrapper
      className={`resizable-image-wrapper${selected ? " is-selected" : ""}`}
      style={{
        width: imageWidth ? `${imageWidth}px` : "fit-content",
        maxWidth: "100%",
      }}
    >
      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt ?? ""}
        title={node.attrs.title ?? ""}
        draggable={false}
        className="blog-image-resizable"
        style={{
          width: "100%",
          maxWidth: "100%",
          height: "auto",
          pointerEvents: "auto",
        }}
      />

      {selected && (
        <>
          <button
            type="button"
            aria-label="Resize image from top left"
            className="image-resize-handle handle-top-left"
            onPointerDown={(event) => handleResizeStart(event, "left")}
          />
          <button
            type="button"
            aria-label="Resize image from top right"
            className="image-resize-handle handle-top-right"
            onPointerDown={(event) => handleResizeStart(event, "right")}
          />
          <button
            type="button"
            aria-label="Resize image from bottom left"
            className="image-resize-handle handle-bottom-left"
            onPointerDown={(event) => handleResizeStart(event, "left")}
          />
          <button
            type="button"
            aria-label="Resize image from bottom right"
            className="image-resize-handle handle-bottom-right"
            onPointerDown={(event) => handleResizeStart(event, "right")}
          />
        </>
      )}
    </NodeViewWrapper>
  );
}
