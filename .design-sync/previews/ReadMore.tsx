import { ReadMore } from "@enza/ui";

export function Chiuso() {
  return (
    <div className="enza-root" style={{ maxWidth: 460, padding: 24, background: "var(--paper)" }}>
      <p style={{ margin: "0 0 8px" }}>
        Sono Enza, chef vegetale dall'anima vesuviana. Cucino verdure con carattere e venero i
        carboidrati.
      </p>
      <ReadMore label="Espandi ↓" collapseLabel="Comprimi ↑">
        <p>
          Ho iniziato per passione e ho continuato per mestiere: oggi insegno, creo menù e porto la
          mia cucina negli eventi. Imparare facendo, ebbasta.
        </p>
      </ReadMore>
    </div>
  );
}

export function Aperto() {
  return (
    <div className="enza-root" style={{ maxWidth: 460, padding: 24, background: "var(--paper)" }}>
      <p style={{ margin: "0 0 8px" }}>I miei corsi partono dalle basi e arrivano lontano.</p>
      <ReadMore defaultOpen label="Espandi ↓" collapseLabel="Comprimi ↑">
        <p>
          Tecniche di base, fermentazioni, panificazione vegetale e menu engineering per locali e
          brand. Piccoli gruppi, tanta pratica.
        </p>
      </ReadMore>
    </div>
  );
}
