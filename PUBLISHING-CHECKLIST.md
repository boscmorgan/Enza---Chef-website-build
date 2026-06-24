# Publishing Checklist

## Media Consent

| Asset | People visible | Consent status | Notes |
| --- | --- | --- | --- |
| `images/hero-enza.jpg` | Enza | Needed | Publish only after signed approval is recorded. |
| `images/bio.jpg` | Enza | Needed | Publish only after signed approval is recorded. |
| `images/chisono.jpg` | To verify | Needed | Confirm whether identifiable people appear. |
| `images/serv-aziendali.jpg` | To verify | Needed | Check for participants, including Serena if present. |
| `images/serv-domicilio.jpg` | To verify | Needed | Replace if any person lacks signed consent. |
| `images/serv-consulenze.jpg` | To verify | Needed | Confirm no identifiable people or get consent. |
| `images/serv-privati.jpg` | To verify | Needed | Currently unused/commented, but still verify before activation. |
| `images/food-1.jpg` | To verify | Needed | Confirm no identifiable people or get consent. |
| `images/food-2.jpg` | To verify | Needed | Confirm no identifiable people or get consent. |
| `images/food-3.jpg` | To verify | Needed | Confirm no identifiable people or get consent. |
| `images/poster.jpg` | To verify | Needed | Confirm rights before publishing. |

Record signed consent file names/locations here before launch.

## Domain

- Preferred domain: `enzaebasta.it`
- Status: not registered as of 2026-06-23.
- Registrar:
- Registration date:
- DNS target:
- DNS verified:
- Notes:

## Final QA

Local QA run 2026-06-24 (served at http://127.0.0.1:8128, Brave):

- [ ] Domain resolves over HTTPS. — pending domain registration.
- [ ] `https://enzaebasta.it/robots.txt` loads. — pending domain (file exists locally, OK).
- [ ] `https://enzaebasta.it/sitemap.xml` loads and contains the final domain. — pending domain.
- [x] Navigation anchors work: hero, chi sono, servizi, biografia, corsi, contatti. — verified (menu → Corsi smooth-scrolls; all anchors present).
- [x] Instagram link opens `https://www.instagram.com/enza_ebbasta/`. — href verified.
- [x] Google Maps link opens the Firenze, Toscana search. — href verified (`google.com/maps/search?...query=Firenze, Toscana, Italia`).
- [x] Media files load with no broken images. — verified (consent still pending separately; see Media Consent).
- [x] Schwa renders in visible copy: `appassionatə`, `professionistə`, `tantə`, `studentə`. — FIXED 2026-06-24: added Fredoka *latin-ext* woff2 + `@font-face` with `unicode-range`; the ə now renders in Fredoka, consistent with body text.
- [x] Contact form behavior accepted as demo-only (shows success message). — confirm before launch whether to wire a real endpoint (Formspree/Getform).
- [x] Mobile viewport checked (414 px): hero stacks, title no overflow, hamburger shown, scroll-shrink on menu/lang works.
- [x] Desktop viewport checked at 1440 px.

### Minor notes from QA
- Entrance animation leaves the hero lead + "Scrivimi" CTA invisible for ~0.7–1.3s on load (fade-up delays). Acceptable; reduce delays if it feels empty on first paint.
- On desktop, clicking a side-menu link closes the menu (hamburger reappears). Confirm this is the intended behavior.

