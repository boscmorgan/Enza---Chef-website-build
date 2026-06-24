import type { ReactNode, AnchorHTMLAttributes } from "react";
import { cn } from "../cn";

export interface CardCtaProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Alternate (taupe-tint) styling for a secondary action. */
  alt?: boolean;
  children?: ReactNode;
}

/**
 * Outlined mini call-to-action link used inside ServiceCards and other
 * compact spots, e.g. "Prenota una consulenza →". Use `alt` for the
 * secondary action in a pair.
 */
export function CardCta({ alt = false, className, children, ...rest }: CardCtaProps) {
  return (
    <a className={cn("card-cta", alt && "card-cta--alt", className)} {...rest}>
      {children}
    </a>
  );
}
