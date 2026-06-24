import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "../cn";

export interface EyebrowProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Cream variant for use on dark backgrounds. */
  light?: boolean;
  children?: ReactNode;
}

/**
 * Small uppercase letter-spaced label that sits above a SectionTitle,
 * e.g. "01 — Chi Sono". Red by default, cream when `light`.
 */
export function Eyebrow({ light = false, className, children, ...rest }: EyebrowProps) {
  return (
    <p className={cn("eyebrow", light && "light", className)} {...rest}>
      {children}
    </p>
  );
}
