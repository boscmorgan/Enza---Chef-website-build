import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "../cn";
import { Badge, type BadgeColor } from "./Badge";

export interface ServiceCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Image source for the card's square top media. */
  image: string;
  /** Alt text for the image. */
  imageAlt?: string;
  /** Card title (rendered in uppercase Anton). */
  title: ReactNode;
  /** Supporting description paragraph. */
  description?: ReactNode;
  /** Icon shown in the corner Badge overlapping the image. Omit to hide it. */
  badgeIcon?: ReactNode;
  /** Fill color of the corner badge. */
  badgeColor?: BadgeColor;
  /** Call-to-action links (typically one or two `CardCta`s). */
  ctas?: ReactNode;
}

/**
 * Bordered service/offering card: square photo with an overlapping corner
 * Badge, an Anton title, a short description, and a row of CTAs pinned to
 * the bottom. The brand's primary "what I offer" tile.
 */
export function ServiceCard({
  image,
  imageAlt = "",
  title,
  description,
  badgeIcon,
  badgeColor = "cream",
  ctas,
  className,
  ...rest
}: ServiceCardProps) {
  return (
    <article className={cn("card", className)} {...rest}>
      <div className="card-img">
        <img src={image} alt={imageAlt} loading="lazy" />
        {badgeIcon ? (
          <Badge color={badgeColor} aria-hidden="true">
            {badgeIcon}
          </Badge>
        ) : null}
      </div>
      <div className="card-body">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
        {ctas ? <div className="card-ctas">{ctas}</div> : null}
      </div>
    </article>
  );
}
