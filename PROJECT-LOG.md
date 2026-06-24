# Project Log

## 2026-06-24

- Ran full local browser QA (served at http://127.0.0.1:8128). Verified: hero renders complete, side-menu anchor navigation (smooth scroll), Chi Sono "Espandi/Riduci" toggle, IT/EN language toggle (copy swaps, expand state + label preserved, no schwa in EN), Instagram + Google Maps links (hrefs correct), images load, mobile (414 px) and desktop (1440 px) layouts.
- Confirmed schwa (ə) renders and is legible, but via system fallback: self-hosted Fredoka is the *latin* subset only and lacks U+0259. Optional polish: add Fredoka *latin-ext* @font-face with unicode-range.
- Updated `PUBLISHING-CHECKLIST.md` Final QA with pass/pending statuses (domain-dependent items remain pending registration).
- Minor observations logged: hero entrance animation briefly hides lead/CTA on load; desktop side-menu closes on link click (confirm if intended).
- Schwa fix: downloaded Fredoka *latin-ext* woff2 (400/500/600/700) into `fonts/`, added matching `@font-face` blocks with `unicode-range` (covers U+0259), and extended `fonts/download-fonts.sh`. The ə now renders in Fredoka, consistent with body text. Verified in browser.

## 2026-06-23

- Added accessible SVG icon links for Instagram and Google Maps in the side menu and contact section.
- Added a Google Maps link for the current service location: Firenze, Toscana, Italia.
- Added a small hidden schwa rendering check (`ə`) in the contact area so the character is present in live markup and can be verified in browser QA.
- Left the random-word widget unimplemented because it is optional and there is no approved content/behavior for it yet.
- Created `PUBLISHING-CHECKLIST.md` to track image consents, domain registration, DNS, and final QA gates.

## Open Before Publishing

- Obtain signed consent for every identifiable person in published photos, including Serena if present.
- Register the final `.it` domain, currently planned as `enzaebasta.it`, or record the selected alternative.
- Update DNS to the WordPress/static host and verify canonical URLs, sitemap, and robots entries.
- Run final browser QA after the domain and approved media are in place.

