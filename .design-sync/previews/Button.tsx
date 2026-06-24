import type { ReactNode } from "react";
import { Button } from "@enza/ui";

// Brand context: components inherit Fredoka + deep-red ink and a cream ground.
const Frame = ({ children }: { children: ReactNode }) => (
  <div className="enza-root" style={{ padding: 24, background: "var(--paper)" }}>
    {children}
  </div>
);

export function Dark() {
  return (
    <Frame>
      <Button variant="dark">Prenota una consulenza →</Button>
    </Frame>
  );
}

export function Pink() {
  return (
    <Frame>
      <Button variant="pink">Invia →</Button>
    </Frame>
  );
}

export function AsLink() {
  return (
    <Frame>
      <Button variant="dark" href="#contatti">
        Scrivimi ↗
      </Button>
    </Frame>
  );
}

export function Together() {
  return (
    <Frame>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <Button variant="dark">Scopri i corsi</Button>
        <Button variant="pink">Contattami →</Button>
      </div>
    </Frame>
  );
}
