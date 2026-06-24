import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "../cn";

export interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Heading level to render. Defaults to `h2`. */
  as?: "h1" | "h2" | "h3";
  /** Use the light (cream-on-dark) treatment for placement over dark sections. */
  light?: boolean;
  children?: ReactNode;
}

/**
 * Large uppercase Anton display heading with the brand's signature
 * stroked outline and hard drop shadow. Use to title page sections.
 */
export function SectionTitle({ as = "h2", light = false, className, children, ...rest }: SectionTitleProps) {
  const Tag = as;
  return (
    <Tag className={cn("section-title", light && "light", className)} {...rest}>
      {children}
    </Tag>
  );
}
