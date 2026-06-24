import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { cn } from "../cn";

export type ButtonVariant = "dark" | "pink";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement> & AnchorHTMLAttributes<HTMLAnchorElement>, "color"> {
  /** Visual style. `dark` = deep-red fill, `pink` = red fill. */
  variant?: ButtonVariant;
  /** Render as an `<a>` instead of a `<button>` when an href is supplied. */
  href?: string;
  children?: ReactNode;
}

/**
 * Primary call-to-action button in the Enza brand: bold Fredoka label,
 * thick deep-red border and a hard offset shadow that tightens on press.
 */
export function Button({ variant = "dark", href, className, children, ...rest }: ButtonProps) {
  const classes = cn("btn", variant === "pink" ? "btn-pink" : "btn-dark", className);
  if (href !== undefined) {
    return (
      <a href={href} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
