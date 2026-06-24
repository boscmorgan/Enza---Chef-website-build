import { Tag } from "@enza/ui";

export function Toni() {
  return (
    <div className="enza-root" style={{ padding: 24, background: "var(--paper)", display: "flex", gap: 10 }}>
      <Tag tone="deep">vegetale</Tag>
      <Tag tone="taupe">stagionale</Tag>
      <Tag tone="red">fermentazioni</Tag>
    </div>
  );
}

export function Singola() {
  return (
    <div className="enza-root" style={{ padding: 24, background: "var(--paper)" }}>
      <Tag>panificazione</Tag>
    </div>
  );
}
