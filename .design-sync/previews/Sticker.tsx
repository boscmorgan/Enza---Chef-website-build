import { Sticker } from "@enza/ui";

export function Ciao() {
  return (
    <div className="enza-root" style={{ padding: 32, background: "var(--paper)" }}>
      <Sticker>ciao!</Sticker>
    </div>
  );
}

export function SuFoto() {
  return (
    <div
      className="enza-root"
      style={{ padding: 40, background: "var(--amethyst)", position: "relative", width: 220, height: 160 }}
    >
      <div style={{ position: "absolute", inset: 16, border: "5px solid var(--violet)", background: "#fff" }} />
      <span style={{ position: "absolute", top: -2, right: -2 }}>
        <Sticker>novità</Sticker>
      </span>
    </div>
  );
}
