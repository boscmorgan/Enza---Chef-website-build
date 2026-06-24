import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "../cn";

export interface TimelineEntry {
  /** Short label shown in Anton (a year, era, or place). */
  year: ReactNode;
  /** Entry heading. */
  title: ReactNode;
  /** Entry body text. */
  body?: ReactNode;
}

export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  /** Ordered list of milestones, oldest first. */
  entries: TimelineEntry[];
  /** Use light text colors for placement on a dark (deep-red) section. */
  onDark?: boolean;
}

/**
 * Vertical connected timeline with alternating cream/red node markers —
 * the brand's biography / career-path device. Each entry has a display
 * `year` label, a title and body copy.
 */
export function Timeline({ entries, onDark = false, className, ...rest }: TimelineProps) {
  return (
    <ol className={cn("timeline", onDark && "on-dark", className)} {...rest}>
      {entries.map((entry, i) => (
        <li key={i}>
          <span className="year">{entry.year}</span>
          <div>
            <h3>{entry.title}</h3>
            {entry.body ? <p>{entry.body}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
