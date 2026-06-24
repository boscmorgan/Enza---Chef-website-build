import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "../cn";

export interface StickerProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
}

/**
 * Playful cream "peel sticker" badge with a thick deep-red border, slight
 * rotation and a rounded-corner blob shape. Typically pinned to a photo
 * corner with an absolute-positioned wrapper, e.g. "ciao!".
 */
export function Sticker({ className, children, ...rest }: StickerProps) {
  return (
    <span className={cn("sticker", className)} {...rest}>
      {children}
    </span>
  );
}
