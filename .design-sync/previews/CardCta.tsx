import { CardCta } from "@enza/ui";

export function Primaria() {
  return (
    <div className="enza-root" style={{ padding: 24, background: "var(--paper)" }}>
      <CardCta href="#contatti">Prenota una consulenza →</CardCta>
    </div>
  );
}

export function Coppia() {
  return (
    <div className="enza-root" style={{ padding: 24, background: "var(--paper)", display: "flex", gap: 12, flexWrap: "wrap" }}>
      <CardCta href="#">Richiedi un preventivo →</CardCta>
      <CardCta href="#" alt>
        Calendario Corsi ↗
      </CardCta>
    </div>
  );
}
