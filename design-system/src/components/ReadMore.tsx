import { useId, useState, type ReactNode } from "react";
import { cn } from "../cn";

export interface ReadMoreProps {
  /** Label for the toggle in its collapsed state. Defaults to "Espandi". */
  label?: ReactNode;
  /** Label when expanded. Defaults to the collapsed label. */
  collapseLabel?: ReactNode;
  /** Start expanded. */
  defaultOpen?: boolean;
  /** Optional extra class on the toggle button. */
  className?: string;
  /** The collapsible content. */
  children?: ReactNode;
}

/**
 * Inline "Espandi" disclosure: an underlined toggle that reveals extra
 * paragraphs below it. Self-managed open state, accessible via
 * aria-expanded / aria-controls.
 */
export function ReadMore({
  label = "Espandi ↓",
  collapseLabel,
  defaultOpen = false,
  className,
  children,
}: ReadMoreProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <>
      <button
        type="button"
        className={cn("read-more", className)}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? collapseLabel ?? label : label}
      </button>
      <div className="more-content" id={id} hidden={!open}>
        {children}
      </div>
    </>
  );
}
