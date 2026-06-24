import { Timeline } from "@enza/ui";

const PERCORSO = [
  {
    year: "Le origini",
    title: "Sotto il Vesuvio",
    body: "Nata e cresciuta in provincia di Napoli, alle pendici del Vesuvio. Mi laureo in Relazioni Internazionali e divento vegetariana già in adolescenza.",
  },
  {
    year: "La svolta",
    title: "Imparare sul campo",
    body: "Durante gli studi mi innamoro della cucina. Per imparare davvero il mestiere lascio la mia città: le prime esperienze sono a Roma.",
  },
  {
    year: "Milano",
    title: "Cucina d'autore",
    body: "Anni in cucine importanti, tra ricerca sui vegetali e fermentazioni. Capisco che il mio posto è insegnare e creare.",
  },
  {
    year: "Firenze · 2025",
    title: "Enza e basta",
    body: "Apro il mio progetto in proprio: corsi, eventi e consulenze. Verdure con carattere, carboidrati venerati.",
  },
];

export function IlPercorso() {
  return (
    <div className="enza-root" style={{ maxWidth: 540, padding: 28, background: "var(--paper)" }}>
      <Timeline entries={PERCORSO} />
    </div>
  );
}

export function SuFondoScuro() {
  return (
    <div className="enza-root" style={{ maxWidth: 540, padding: 28, background: "var(--violet)" }}>
      <Timeline onDark entries={PERCORSO.slice(0, 3)} />
    </div>
  );
}
