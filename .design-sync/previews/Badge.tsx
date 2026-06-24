import { Badge } from "@enza/ui";

const leaf = (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M6 3v8a3 3 0 006 0V3M9 3v18M18 3c-1.5 1.5-2 4-2 7s.5 4 2 4v7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function Colori() {
  return (
    <div className="enza-root" style={{ padding: 28, background: "var(--paper)", display: "flex", gap: 18 }}>
      <Badge color="cream">{leaf}</Badge>
      <Badge color="red">{leaf}</Badge>
      <Badge color="taupe">{leaf}</Badge>
    </div>
  );
}

export function ConTesto() {
  return (
    <div className="enza-root" style={{ padding: 28, background: "var(--paper)" }}>
      <Badge color="cream" aria-hidden="true">
        <span style={{ fontFamily: "var(--display)", fontSize: "1.1rem" }}>%</span>
      </Badge>
    </div>
  );
}
