import { Eyebrow } from "@enza/ui";

export function Rosso() {
  return (
    <div className="enza-root" style={{ padding: 24, background: "var(--paper)" }}>
      <Eyebrow>01 — Chi Sono</Eyebrow>
    </div>
  );
}

export function Chiaro() {
  return (
    <div className="enza-root" style={{ padding: 24, background: "var(--violet)" }}>
      <Eyebrow light>04 — Contatti</Eyebrow>
    </div>
  );
}
