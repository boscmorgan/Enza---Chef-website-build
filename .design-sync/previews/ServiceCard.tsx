import type { ReactNode } from "react";
import { ServiceCard, CardCta } from "@enza/ui";

const Frame = ({ children }: { children: ReactNode }) => (
  <div className="enza-root" style={{ padding: 24, background: "var(--amethyst)" }}>
    {children}
  </div>
);

// Inline SVG data-URI so the card image renders without any network request.
const dish = (label: string, c1: string, c2: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/>
      </linearGradient></defs>
      <rect width='400' height='400' fill='url(#g)'/>
      <circle cx='200' cy='205' r='120' fill='#fbf7ef' opacity='0.92'/>
      <text x='200' y='225' font-family='Georgia,serif' font-size='64' fill='#7f1117'
        text-anchor='middle'>${label}</text>
    </svg>`
  );

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

export function ConCorsi() {
  return (
    <Frame>
      <div style={{ maxWidth: 300, margin: "0 auto" }}>
        <ServiceCard
          image={dish("🌿", "#b51f24", "#7f1117")}
          imageAlt="Pane dolce appena sfornato"
          title="Corsi & Consulenze"
          description="Ti insegno i vegetali: corsi di cucina, menu engineering e consulenze per locali e brand. Imparare facendo, ebbasta."
          badgeIcon={leaf}
          badgeColor="cream"
          ctas={
            <>
              <CardCta href="#contatti">Prenota una consulenza →</CardCta>
              <CardCta href="#" alt>
                Calendario Corsi ↗
              </CardCta>
            </>
          }
        />
      </div>
    </Frame>
  );
}

export function EventiPrivati() {
  return (
    <Frame>
      <div style={{ maxWidth: 300, margin: "0 auto" }}>
        <ServiceCard
          image={dish("✦", "#7f1117", "#b51f24")}
          imageAlt="Tavola imbandita per un evento privato"
          title="Eventi Privati"
          description="Cene a domicilio, compleanni e ricorrenze: porto in tavola una cucina vegetale di carattere, cucita su di te."
          badgeIcon={leaf}
          badgeColor="red"
          ctas={<CardCta href="#contatti">Richiedi un preventivo →</CardCta>}
        />
      </div>
    </Frame>
  );
}

export function InUnaGriglia() {
  return (
    <Frame>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(220px, 1fr))", gap: 24 }}>
        <ServiceCard
          image={dish("🍝", "#b51f24", "#7f1117")}
          title="Eventi Aziendali"
          description="Team building gustosi e menù su misura per il tuo team."
          badgeIcon={leaf}
          badgeColor="taupe"
          ctas={<CardCta href="#">Parliamo del tuo team →</CardCta>}
        />
        <ServiceCard
          image={dish("🏠", "#7f1117", "#b51f24")}
          title="A Domicilio"
          description="La chef a casa tua: spesa, cucina e servizio inclusi."
          badgeIcon={leaf}
          badgeColor="cream"
          ctas={<CardCta href="#">Prenota a casa tua →</CardCta>}
        />
      </div>
    </Frame>
  );
}
