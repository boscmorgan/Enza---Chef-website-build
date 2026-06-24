import { useState, type FormEvent, type ReactNode } from "react";
import { cn } from "../cn";

export interface ContactFormLabels {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  submit: ReactNode;
  /** Message shown after a successful submit. */
  success: ReactNode;
}

const DEFAULT_LABELS: ContactFormLabels = {
  name: "Nome e Cognome",
  email: "Email",
  phone: "Telefono",
  subject: "Oggetto",
  message: "Messaggio",
  submit: "Invia →",
  success: "Grazie! Messaggio ricevuto — ti rispondo prestissimo. 🌶️",
};

export interface ContactFormProps {
  /** Field + button copy. Defaults to the Italian brand labels. */
  labels?: Partial<ContactFormLabels>;
  /** Called with the FormData on submit; return nothing. */
  onSend?: (data: FormData) => void;
  /** Force the post-submit success state (useful for previews). */
  sent?: boolean;
  className?: string;
}

/**
 * Two-column contact card on a white panel with the brand's thick border
 * and hard shadow. Renders Name / Email / Phone / Subject / Message fields
 * and a pink submit Button, plus an inline success confirmation.
 */
export function ContactForm({ labels, onSend, sent = false, className }: ContactFormProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const [done, setDone] = useState(sent);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSend?.(new FormData(e.currentTarget));
    setDone(true);
  }

  return (
    <form className={cn("contact-form", className)} onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="ef-name">{l.name}</label>
        <input type="text" id="ef-name" name="name" autoComplete="name" placeholder="Es. Mario Rossi" />
      </div>
      <div className="field">
        <label htmlFor="ef-email">{l.email}</label>
        <input type="email" id="ef-email" name="email" autoComplete="email" placeholder="tu@email.it" />
      </div>
      <div className="field">
        <label htmlFor="ef-phone">{l.phone}</label>
        <input type="tel" id="ef-phone" name="phone" autoComplete="tel" placeholder="+39 ..." />
      </div>
      <div className="field">
        <label htmlFor="ef-subject">{l.subject}</label>
        <input type="text" id="ef-subject" name="subject" placeholder="Di cosa parliamo?" />
      </div>
      <div className="field field-full">
        <label htmlFor="ef-message">{l.message}</label>
        <textarea id="ef-message" name="message" rows={4} placeholder="Raccontami tutto..." />
      </div>
      <button type="submit" className="btn btn-pink">
        {l.submit}
      </button>
      {done ? (
        <p className="form-success" role="status">
          {l.success}
        </p>
      ) : null}
    </form>
  );
}
