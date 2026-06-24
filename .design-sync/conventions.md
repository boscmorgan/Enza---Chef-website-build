# Enza e basta — design system

A playful **sticker / neo-brutalist** brand for an Italian plant-based chef. The look:
deep-red ink on a warm cream ground, **thick deep-red borders**, **hard offset shadows**
(never soft/blurred), bold uppercase **Anton** display type over friendly rounded **Fredoka**
body text, plus sticker badges and rounded "blob" accents. Copy is Italian.

## Setup — wrap content in `.enza-root`
Components pull the brand font (`--sans`) and ink (`--violet`) from an ancestor. Wrap every
screen (or the app root) in `className="enza-root"` so body/decorative text renders in Fredoka
on the cream ground. Without it, headings and buttons still look right (they set their own
font), but plain paragraphs fall back to the browser serif.

```jsx
import { SectionTitle, Eyebrow, Button, ServiceCard, CardCta } from "@enza/ui";

function Servizi() {
  return (
    <section className="enza-root" style={{ background: "var(--amethyst)", padding: "6vw" }}>
      <Eyebrow light>Cosa offro</Eyebrow>
      <SectionTitle light>I miei servizi</SectionTitle>
      <ServiceCard
        image="/img/corsi.jpg"
        title="Corsi & Consulenze"
        description="Ti insegno i vegetali: corsi, menu engineering e consulenze."
        ctas={<CardCta href="/contatti">Prenota una consulenza →</CardCta>}
      />
      <Button variant="pink" href="/contatti">Contattami →</Button>
    </section>
  );
}
```

## Styling idiom — design tokens, not utility classes
This is a **CSS-custom-property token** system. There is no Tailwind/utility vocabulary. Style
your own layout glue with `var(--token)`; style components via their **props**, not by adding
classes. Read `styles.css` (shipped with the bundle) before introducing any color or font.

| Token | Value | Use |
|---|---|---|
| `--violet` | `#7f1117` | primary ink, borders (deep red) |
| `--amethyst` / `--rose` | `#b51f24` | red accent / fills |
| `--saffron` / `--paper` | `#fbf7ef` | cream — page ground, light ink on dark |
| `--grape` | `#d8cfc3` | warm taupe |
| `--rose-tint` `--grape-tint` `--saffron-tint` | warm off-whites | section backgrounds, input fills |
| `--display` | Anton stack | uppercase display headings |
| `--sans` | Fredoka stack | all body / UI text |
| `--shadow-hard` / `--shadow-hard-sm` | `3px 3px 0` / `2px 2px 0` deep-red | the signature hard offset shadow |
| `--radius-ui` `--radius-panel` `--radius-photo` | `6/8/10px` | controls / panels / photos |

Common component props (see each `<Name>.d.ts` for the full contract):
- `Button` — `variant="dark"` (deep-red) \| `"pink"` (red); pass `href` to render an `<a>`.
- `SectionTitle`, `Eyebrow` — `light` for placement on dark sections; `SectionTitle as="h1"`.
- `Tag` — `tone="deep" | "taupe" | "red"`; `Badge` — `color="cream" | "red" | "taupe"`.
- `OrganicFrame` — `variant`, `ring`, `square`, `ratio`; wrap an `<img>`.
- `Timeline` — `entries={[{year,title,body}]}`, `onDark`; `ServiceCard` — `image/title/description/ctas/badgeIcon`.

## Where the truth lives
- `styles.css` — every token, font-face and component class (read it before styling).
- `components/<group>/<Name>/<Name>.d.ts` — the prop contract; `<Name>.prompt.md` — usage notes.
