import { useState, type HTMLAttributes } from "react";
import { cn } from "../cn";

export interface LangToggleProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Language codes to toggle between. Defaults to ["IT", "EN"]. */
  langs?: [string, string];
  /** Currently active language code (controlled). */
  value?: string;
  /** Initial active language when uncontrolled. */
  defaultValue?: string;
  /** Fired with the newly-selected language code. */
  onChange?: (lang: string) => void;
}

/**
 * Boxed two-state language switcher (IT / EN) in the Anton display face,
 * with the active option filled red. Works controlled or uncontrolled.
 */
export function LangToggle({
  langs = ["IT", "EN"],
  value,
  defaultValue,
  onChange,
  className,
  ...rest
}: LangToggleProps) {
  const [internal, setInternal] = useState(defaultValue ?? langs[0]);
  const active = value ?? internal;

  function select(lang: string) {
    if (value === undefined) setInternal(lang);
    onChange?.(lang);
  }

  return (
    <div className={cn("lang-toggle", className)} role="group" aria-label="Lingua / Language" {...rest}>
      {langs.map((lang) => (
        <button
          key={lang}
          type="button"
          className={cn(active === lang && "is-active")}
          aria-pressed={active === lang}
          onClick={() => select(lang)}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
