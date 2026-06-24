import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "../cn";

export interface KickerProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

/**
 * Inline deep-red pill used as a hero overline — a compact tagline chip,
 * e.g. "Chef vegetale · Corsi · Consulenze · Eventi".
 */
export function Kicker({ className, children, ...rest }: KickerProps) {
  return (
    <p className={cn("kicker", className)} {...rest}>
      {children}
    </p>
  );
}
