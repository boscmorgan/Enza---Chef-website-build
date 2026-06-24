import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "../cn";
import { InstagramIcon, MapPinIcon } from "../icons";

export interface SocialLink {
  /** Destination URL. */
  href: string;
  /** Visible label. */
  label: ReactNode;
  /** Icon to show before the label. Defaults by `kind` when omitted. */
  icon?: ReactNode;
  /** Built-in icon shortcut. */
  kind?: "instagram" | "maps";
  /** Accessible label override. */
  ariaLabel?: string;
}

export interface SocialLinksProps extends HTMLAttributes<HTMLDivElement> {
  /** The links to render as deep-red pill buttons. */
  links: SocialLink[];
}

function iconFor(link: SocialLink): ReactNode {
  if (link.icon) return link.icon;
  if (link.kind === "maps") return <MapPinIcon />;
  return <InstagramIcon />;
}

/**
 * Row of deep-red social pill buttons (Instagram, Google Maps, …) with
 * inline brand icons. Used in the contact section footer.
 */
export function SocialLinks({ links, className, ...rest }: SocialLinksProps) {
  return (
    <div className={cn("socials", className)} {...rest}>
      {links.map((link, i) => (
        <a
          key={i}
          href={link.href}
          target="_blank"
          rel="noopener"
          aria-label={link.ariaLabel}
        >
          {iconFor(link)}
          <span>{link.label}</span>
        </a>
      ))}
    </div>
  );
}
