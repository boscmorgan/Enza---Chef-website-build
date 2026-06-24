import { TagRow, Tag } from "@enza/ui";

export function Competenze() {
  return (
    <div className="enza-root" style={{ padding: 24, background: "var(--paper)", maxWidth: 480 }}>
      <TagRow>
        <Tag tone="deep">cucina vegetale</Tag>
        <Tag tone="taupe">menu engineering</Tag>
        <Tag tone="red">eventi</Tag>
        <Tag tone="deep">consulenze</Tag>
        <Tag tone="taupe">panificazione</Tag>
      </TagRow>
    </div>
  );
}
