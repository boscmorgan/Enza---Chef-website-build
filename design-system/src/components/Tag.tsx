import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "../cn";

export type TagTone = "deep" | "taupe" | "red";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color tone of the pill. */
  tone?: TagTone;
  children?: ReactNode;
}

/**
 * Small rounded keyword pill, used in clusters to label skills or themes
 * (e.g. "vegetale", "stagionale"). Wrap several in a `TagRow`.
 */
export function Tag({ tone = "deep", className, children, ...rest }: TagProps) {
  const toneClass = tone === "taupe" ? "tag--taupe" : tone === "red" ? "tag--red" : undefined;
  return (
    <span className={cn("tag", toneClass, className)} {...rest}>
      {children}
    </span>
  );
}

export interface TagRowProps extends HTMLAttributes<HTMLUListElement> {
  children?: ReactNode;
}

/** Horizontal wrapping row that lays out a set of `Tag` pills. */
export function TagRow({ className, children, ...rest }: TagRowProps) {
  return (
    <ul className={cn("tag-row", className)} {...rest}>
      {children}
    </ul>
  );
}
