import type { ReactNode } from "react";
import { SideMenu } from "@enza/ui";

const icon = (d: string): ReactNode => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LINKS = [
  { href: "#chi-sono", label: "Chi Sono", iconColor: "cream" as const, icon: icon("M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0") },
  { href: "#servizi", label: "Progetti / Servizi", iconColor: "red" as const, icon: icon("M6 3v8a3 3 0 006 0V3M9 3v18M18 3c-1.5 1.5-2 4-2 7s.5 4 2 4v7") },
  { href: "#biografia", label: "Biografia", iconColor: "taupe" as const, icon: icon("M5 4h11l3 3v13H5zM9 4v16M8 9h7M8 13h7") },
  { href: "#corsi", label: "Corsi", iconColor: "red" as const, icon: icon("M6 13c-1.7 0-3-1.3-3-3 0-1.4 1-2.6 2.3-2.9A3.5 3.5 0 0112 5a3.5 3.5 0 016.7 2.1C20 7.4 21 8.6 21 10c0 1.7-1.3 3-3 3M6 13v6h12v-6") },
  { href: "#contatti", label: "Contatti", iconColor: "deep" as const, icon: icon("M4 6h16v12H4zM4 7l8 6 8-6") },
];

const SOCIALS = [
  { href: "https://www.instagram.com/enza_ebbasta/", label: "@enza_ebbasta", kind: "instagram" as const },
  { href: "#", label: "Firenze", kind: "maps" as const },
];

export function NavCompleta() {
  return (
    <div className="enza-root" style={{ height: 620, display: "flex" }}>
      <SideMenu brand="Enza" brandSub="e basta" links={LINKS} socials={SOCIALS} onClose={() => {}} />
    </div>
  );
}
