import { LangToggle } from "@enza/ui";

export function ItalianoAttivo() {
  return (
    <div className="enza-root" style={{ padding: 28, background: "var(--paper)" }}>
      <LangToggle defaultValue="IT" />
    </div>
  );
}

export function IngleseAttivo() {
  return (
    <div className="enza-root" style={{ padding: 28, background: "var(--paper)" }}>
      <LangToggle defaultValue="EN" />
    </div>
  );
}
