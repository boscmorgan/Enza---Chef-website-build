import { OrganicFrame } from "@enza/ui";

const photo = (c1: string, c2: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='400'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/>
      </linearGradient></defs>
      <rect width='360' height='400' fill='url(#g)'/>
      <circle cx='180' cy='150' r='70' fill='#fbf7ef' opacity='0.9'/>
      <rect x='70' y='250' width='220' height='90' rx='14' fill='#fbf7ef' opacity='0.85'/>
    </svg>`
  );

export function ConAnello() {
  return (
    <div className="enza-root" style={{ padding: 40, background: "var(--paper)" }}>
      <OrganicFrame ring square width={260} ratio="4 / 4.4">
        <img src={photo("#b51f24", "#7f1117")} alt="Ritratto della chef" />
      </OrganicFrame>
    </div>
  );
}

export function Varianti() {
  return (
    <div
      className="enza-root"
      style={{ padding: 32, background: "var(--paper)", display: "flex", gap: 24, alignItems: "flex-start" }}
    >
      <OrganicFrame variant="deep" width={150} ratio="1 / 1">
        <img src={photo("#7f1117", "#b51f24")} alt="Piatto vegetale" />
      </OrganicFrame>
      <OrganicFrame variant="red" width={150} ratio="1 / 1">
        <img src={photo("#b51f24", "#d8cfc3")} alt="Pane appena sfornato" />
      </OrganicFrame>
      <OrganicFrame variant="cream" width={150} ratio="1 / 1">
        <img src={photo("#d8cfc3", "#7f1117")} alt="Dettaglio di un dolce" />
      </OrganicFrame>
    </div>
  );
}
