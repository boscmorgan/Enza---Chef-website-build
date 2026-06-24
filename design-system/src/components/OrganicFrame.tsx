import type { ReactNode, HTMLAttributes, CSSProperties } from "react";
import { cn } from "../cn";

export type FrameVariant = "deep" | "red" | "cream";

export interface OrganicFrameProps extends HTMLAttributes<HTMLDivElement> {
  /** Border color variant. */
  variant?: FrameVariant;
  /** Square the corners instead of the default soft radius. */
  square?: boolean;
  /** Show the offset deep-red backing "ring" behind the frame. */
  ring?: boolean;
  /** Constrains the frame width. */
  width?: number | string;
  /** CSS aspect-ratio for the framed media, e.g. "4 / 4.4". */
  ratio?: string;
  /** The image (or any media) to frame. */
  children?: ReactNode;
}

/**
 * Thick-bordered photo frame with an optional offset backing ring — the
 * brand's way of presenting portraits and dish photography. Pass an `<img>`
 * (or `<picture>`) as the child.
 */
export function OrganicFrame({
  variant = "deep",
  square = false,
  ring = false,
  width,
  ratio,
  className,
  style,
  children,
  ...rest
}: OrganicFrameProps) {
  const variantClass = variant === "red" ? "frame-alt" : variant === "cream" ? "frame-blob" : undefined;
  const frameStyle: CSSProperties = {
    width,
    ...(ratio ? { aspectRatio: ratio } : null),
    ...style,
  };
  const frame = (
    <div className={cn("organic-frame", variantClass, square && "frame-square", className)} style={frameStyle} {...rest}>
      {children}
    </div>
  );
  if (!ring) return frame;
  return (
    <span className="photo-wrap" style={{ width }}>
      <span className="photo-ring" aria-hidden="true" />
      {frame}
    </span>
  );
}
