import { Kicker } from "@enza/ui";

export function Default() {
  return (
    <div className="enza-root" style={{ padding: 28, background: "var(--paper)" }}>
      <Kicker>Chef vegetale · Corsi · Consulenze · Eventi</Kicker>
    </div>
  );
}

export function Corto() {
  return (
    <div className="enza-root" style={{ padding: 28, background: "var(--paper)" }}>
      <Kicker>Novità 2025</Kicker>
    </div>
  );
}
