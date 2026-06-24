import type { ReactNode, HTMLAttributes, CSSProperties } from "react";
import { cn } from "../cn";
import { CloseIcon, InstagramIcon, MapPinIcon } from "../icons";

export type IconColor = "cream" | "red" | "taupe" | "deep";

const ICON_VAR: Record<IconColor, string> = {
  cream: "var(--saffron)",
  red: "var(--rose)",
  taupe: "var(--grape)",
  deep: "var(--violet)",
};

export interface SideMenuLink {
  href: string;
  label: ReactNode;
  /** Icon rendered in the colored tile. */
  icon?: ReactNode;
  /** Tile fill color. */
  iconColor?: IconColor;
}

export interface SideMenuSocial {
  href: string;
  label: ReactNode;
  kind?: "instagram" | "maps";
  icon?: ReactNode;
  ariaLabel?: string;
}

export interface SideMenuProps extends HTMLAttributes<HTMLElement> {
  /** Brand wordmark, top line. */
  brand?: ReactNode;
  /** Brand wordmark, second line (smaller). */
  brandSub?: ReactNode;
  /** Brand link target. */
  brandHref?: string;
  /** Navigation links. */
  links: SideMenuLink[];
  /** Footer social links. */
  socials?: SideMenuSocial[];
  /** Show the close button and fire this when clicked. */
  onClose?: () => void;
}

function socialIcon(s: SideMenuSocial): ReactNode {
  if (s.icon) return s.icon;
  if (s.kind === "maps") return <MapPinIcon />;
  return <InstagramIcon />;
}

/**
 * Deep-red fixed-width sidebar navigation: brand wordmark, a list of links
 * each with a colored icon tile, and a footer with social links. The site's
 * primary navigation surface.
 */
export function SideMenu({
  brand = "Enza",
  brandSub = "e basta",
  brandHref = "#",
  links,
  socials,
  onClose,
  className,
  ...rest
}: SideMenuProps) {
  return (
    <nav className={cn("side-menu", className)} aria-label="Menu principale" {...rest}>
      {onClose ? (
        <button className="menu-close" aria-label="Chiudi il menu" onClick={onClose}>
          <CloseIcon />
        </button>
      ) : null}

      <a href={brandHref} className="side-brand">
        {brand}
        {brandSub ? <span>{brandSub}</span> : null}
      </a>

      <ul className="side-links">
        {links.map((link, i) => (
          <li key={i}>
            <a href={link.href}>
              {link.icon ? (
                <span
                  className="ico"
                  style={
                    {
                      ["--ico" as string]: ICON_VAR[link.iconColor ?? "cream"],
                      // a deep-red tile on the deep-red menu needs a cream glyph + border to read
                      ...(link.iconColor === "deep"
                        ? { color: "var(--saffron)", borderColor: "var(--saffron)" }
                        : null),
                    } as CSSProperties
                  }
                  aria-hidden="true"
                >
                  {link.icon}
                </span>
              ) : null}
              <span>{link.label}</span>
            </a>
          </li>
        ))}
      </ul>

      {socials && socials.length > 0 ? (
        <div className="side-foot">
          <div className="side-socials" aria-label="Link social">
            {socials.map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener" aria-label={s.ariaLabel}>
                {socialIcon(s)}
                <span>{s.label}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
