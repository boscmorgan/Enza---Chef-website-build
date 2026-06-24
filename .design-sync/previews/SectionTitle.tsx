import { SectionTitle, Eyebrow } from "@enza/ui";

export function SuChiaro() {
  return (
    <div className="enza-root" style={{ padding: 32, background: "var(--paper)" }}>
      <Eyebrow>01 — Chi Sono</Eyebrow>
      <SectionTitle>Chi Sono</SectionTitle>
    </div>
  );
}

export function SuScuro() {
  return (
    <div className="enza-root" style={{ padding: 32, background: "var(--violet)" }}>
      <Eyebrow light>Corsi di cucina</Eyebrow>
      <SectionTitle light>Impara con me</SectionTitle>
    </div>
  );
}

export function ComeH1() {
  return (
    <div className="enza-root" style={{ padding: 32, background: "var(--paper)" }}>
      <SectionTitle as="h1">Parliamone</SectionTitle>
    </div>
  );
}
