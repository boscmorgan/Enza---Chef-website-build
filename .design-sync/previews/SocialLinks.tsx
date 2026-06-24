import { SocialLinks } from "@enza/ui";

export function InstagramEMaps() {
  return (
    <div className="enza-root" style={{ padding: 28, background: "var(--paper)" }}>
      <SocialLinks
        links={[
          { href: "https://www.instagram.com/enza_ebbasta/", label: "Instagram", kind: "instagram", ariaLabel: "Instagram @enza_ebbasta" },
          { href: "#", label: "Google Maps", kind: "maps", ariaLabel: "Google Maps: Firenze" },
        ]}
      />
    </div>
  );
}
