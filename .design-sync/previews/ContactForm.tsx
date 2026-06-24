import { ContactForm } from "@enza/ui";

export function Vuoto() {
  return (
    <div className="enza-root" style={{ padding: 28, background: "var(--saffron-tint)", maxWidth: 560 }}>
      <ContactForm />
    </div>
  );
}

export function Inviato() {
  return (
    <div className="enza-root" style={{ padding: 28, background: "var(--saffron-tint)", maxWidth: 560 }}>
      <ContactForm sent />
    </div>
  );
}
