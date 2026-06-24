import type { ReactNode, HTMLAttributes, CSSProperties } from "react";
import { cn } from "../cn";

export type BadgeColor = "cream" | "red" | "taupe";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Fill color of the circular badge. */
  color?: BadgeColor;
  /** Icon or short glyph rendered centered inside the badge. */
  children?: ReactNode;
}

const COLOR_VAR: Record<BadgeColor, string> = {
  cream: "var(--saffron)",
  red: "var(--rose)",
  taupe: "var(--grape)",
};

/**
 * Small circular icon badge with a deep-red border and offset shadow.
 * Often overlapped on the bottom-right corner of a ServiceCard image.
 */
export function Badge({ color = "cream", className, style, children, ...rest }: BadgeProps) {
  const merged: CSSProperties = { ["--badge" as string]: COLOR_VAR[color], ...style };
  return (
    <span className={cn("badge", className)} style={merged} {...rest}>
      {children}
    </span>
  );
}
