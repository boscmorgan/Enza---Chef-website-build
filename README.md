# Enza e basta — sito web

One-page bilingual (🇮🇹 IT / 🇬🇧 EN) website for the chef brand **"Enza e basta"**.
Punk-editorial poster style, fully responsive, no build step — plain HTML/CSS/JS.

## Struttura

```
.
├── index.html          # tutta la pagina (sezioni + contenuti bilingue)
├── css/style.css       # stile completo (palette, layout, responsive)
├── js/script.js        # menu, scroll, toggle lingua, form mailto
├── js/reviews.js       # carosello recensioni (auto-scorrimento, frecce, drag/swipe)
├── images/             # foto ottimizzate per il web
├── source-photos/      # foto originali ad alta risoluzione (non servite)
└── fonts/README.md     # come passare ai font self-hosted
```

## Sezioni
Hero · Chi Sono · Progetti/Servizi (4 card) · Biografia (timeline) · Recensioni (carosello) · Contatti (form).
Menu laterale con apri/chiudi (X + hamburger) e scroll fluido alle ancore.

## Lingua
Ogni testo ha attributi `data-it` / `data-en` (e `data-it-ph` / `data-en-ph` per i placeholder).
Il toggle **IT / EN** in alto a destra cambia la lingua via JavaScript. Default: italiano.
Per modificare un testo, basta editarlo direttamente in `index.html`.

## Font (self-hosted)
I font (**Anton** per i titoli, **Fredoka** per il testo) sono **locali**: nessuna
chiamata a Google Fonts. Le `@font-face` sono già in `css/style.css`.
Scarica i file `.woff2` una volta sola con:

```bash
bash fonts/download-fonts.sh
```

Poi **committa i `.woff2`** (servono anche online). Dettagli in `fonts/README.md`.
Senza i file parte un fallback di sistema, quindi il sito resta sempre leggibile.

## Form contatti
Il form usa un `mailto:` generato lato client: valida i campi, apre l'app email
dell'utente e precompila destinatario, oggetto e corpo del messaggio. Non richiede
backend, SMTP o servizi esterni. Se il dispositivo non ha un client email configurato,
il sito mostra anche un fallback con destinatario e messaggio già pronti da copiare.

## Social e mappe
I link Instagram e Google Maps sono presenti nel menu laterale e nella sezione Contatti,
con icone SVG inline accessibili. Il link Google Maps punta alla ricerca:
`Firenze, Toscana, Italia`.

## Schwa e caratteri speciali
La pagina usa `<meta charset="UTF-8">` e contiene già schwa visibili nel copy italiano
(`appassionatə`, `professionistə`, `tantə`, `studentə`). C'è anche un controllo
accessibile non visivo nella sezione Contatti per mantenere `ə` nel markup durante la QA.

## Pubblicazione

### Locale
Apri semplicemente `index.html` nel browser (oppure `python3 -m http.server` nella cartella).

### GitHub + Vercel
```bash
git init
git add .
git commit -m "Enza e basta — sito"
# crea un repo su GitHub e fai push, poi importalo su vercel.com
```
Su Vercel: **Framework Preset = Other**, nessun build command, output = root.
Il sito è statico, quindi va online così com'è.

### Deploy: perché passa da GitHub Actions

Il piano Hobby di Vercel pubblica **solo i commit il cui autore Git fa parte
dell'account Vercel**. Sveltia CMS però firma ogni salvataggio con l'account
GitHub di chi è collegato al pannello: i commit di Enza arrivano su `main`, ma
Vercel li ignora e il sito resta fermo, senza errori visibili.

La soluzione è `.github/workflows/deploy.yml`: a ogni push su `main` il workflow
chiama un **deploy hook** di Vercel. L'hook è attribuito all'account che lo
possiede, non all'autore del commit, quindi il controllo non scatta mai e
chiunque abbia accesso al CMS può pubblicare.

`vercel.json` completa il quadro con `git.deploymentEnabled: false`: spegne il
deploy automatico dell'integrazione Git, così l'unica strada verso la
produzione è il workflow e ogni push produce una build sola.

**Setup una tantum — l'ordine conta:**
1. Vercel → progetto → **Settings → Git → Deploy Hooks**: crea un hook sul
   branch `main` (nome consigliato: `github-actions`) e copia l'URL.
2. GitHub → repo → **Settings → Secrets and variables → Actions → New
   repository secret**: nome `VERCEL_DEPLOY_HOOK_URL`, valore l'URL del punto 1.
3. Solo **dopo** i punti 1 e 2, porta `vercel.json` su `main`. Vercel legge
   `deploymentEnabled` dal commit che riceve: se arriva prima che l'hook
   esista, il deploy automatico è già spento e nulla lo sostituisce.

L'URL dell'hook è una credenziale: vive solo nel secret di GitHub, mai nel repo.
Per pubblicare a mano senza aspettare un push: GitHub → **Actions → Deploy to
Vercel → Run workflow**.

**Se il sito smette di aggiornarsi:** guarda prima l'esito del workflow su
GitHub → Actions. Workflow verde ma nessuna build su Vercel significa che
l'hook è stato cancellato o rigenerato — ricrea l'hook e aggiorna il secret.
Per sbloccare subito la produzione: **Redeploy** dalla dashboard Vercel, oppure
togli `git.deploymentEnabled` da `vercel.json` per riaccendere il deploy da Git.

## Admin / CMS (testi, calendario corsi e foto)

Enza può modificare i testi del sito, il calendario dei corsi (carosello) e alcune
foto senza toccare il codice, tramite un piccolo pannello all'indirizzo **`/admin`**
(es. `https://enzaebasta.it/admin`). Ogni salvataggio nel pannello crea un commit su
GitHub e Vercel ripubblica il sito in automatico — nessun database, nessun hosting extra.

**Come funziona:**
- Backend: [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (gratuito, open source), configurato in `admin/config.yml`. Tre raccolte:
  - **Corsi (calendario)** → `content/courses.json`: i corsi del carosello Calendario. La data decide se un corso finisce sotto **Prossimi** o **Passati**, le due linguette sopra al carosello (i passati compaiono solo quando ce n'è almeno uno). I prossimi sono ordinati dal più vicino, con l'etichetta "Il prossimo" sulla prima scheda; i passati dal più recente. Un corso resta fra i prossimi per tutta la sua giornata, non sparisce all'ora di inizio.
    Tre regole sui campi, pensate per non dover più sistemare i dati a mano:
    - **Data e ora**: sempre ora italiana, salvata come `2026-09-05T16:30`. Il sito la interpreta come fuso di Roma, quindi l'orario resta giusto anche per chi apre il sito dall'estero.
    - **Prezzo**: solo il numero (`60`). Il simbolo € lo aggiunge il sito, così tutte le schede sono uguali. Vuoto = prezzo non mostrato.
    - **Foto**: i percorsi sono assoluti (`/images/FOTO/...`); ci pensa il pannello.
  - **Testi del sito** → `content/copy.json`: tutti i testi editabili (IT + EN), raggruppati per sezione (Hero, Corsi, Calendario, Chi Sono, Altri Servizi, Biografia + tappe del percorso, Contatti, Newsletter, piè di pagina).
  - **Recensioni** → `content/reviews.json`: le recensioni del carosello sopra i Contatti. Ogni voce ha citazione (IT/EN), nome, ruolo e foto tonda facoltativa; l'interruttore "Nascondi" toglie una recensione dal sito senza cancellarla. L'ordine della lista è l'ordine del carosello.
  - **Foto del sito** → `content/site.json`: foto hero / chi-sono / corsi.
- Il sito legge i JSON via `js/content.js` (e `js/reviews.js` per le recensioni). Per i testi: ogni elemento editabile in `index.html` ha un attributo `data-copy="sezione.chiave"`; al caricamento gli attributi `data-it`/`data-en` vengono sovrascritti con i valori del JSON, così il toggle IT/EN continua a funzionare. La timeline della Biografia viene generata dal JSON (si possono aggiungere/togliere tappe dal pannello). Il markup statico resta come fallback se il fetch fallisce.
- Per aggiungere un nuovo testo editabile: aggiungi la coppia `*_it`/`*_en` in `content/copy.json`, il campo in `admin/config.yml` e `data-copy="sezione.chiave"` sull'elemento in `index.html`.
- La libreria foto del pannello punta a `images/`: Enza vede e può scegliere tutte le foto già online (comprese quelle nella sottocartella `FOTO/`), e le nuove foto caricate vengono committate nel repo.
- Login: un account GitHub con accesso in scrittura a questo repo. Non serve che
  sia lo stesso account collegato a Vercel — a pubblicare ci pensa il workflow
  descritto sopra.

**Setup una tantum (da fare voi, richiede accesso agli account GitHub/Vercel):**
1. Su GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**:
   - Homepage URL: l'URL del sito (dominio finale o `https://tuo-progetto.vercel.app`)
   - Authorization callback URL: stessa origine + `/api/callback` (es. `https://enzaebasta.it/api/callback`)
   - Copia **Client ID** e genera un **Client Secret**.
2. Su Vercel → progetto → **Settings → Environment Variables**, aggiungi:
   - `OAUTH_CLIENT_ID` = il Client ID
   - `OAUTH_CLIENT_SECRET` = il Client Secret
   Poi rifai il deploy.
3. Apri `admin/config.yml` e aggiorna `base_url` con l'URL reale del sito (deve combaciare con l'Homepage URL sopra).
4. Vai su `/admin`, accedi con l'account GitHub condiviso (deve essere collaboratore del repo) e pubblica.

Nessun costo ricorrente: GitHub, Vercel (piano Hobby) e Sveltia CMS sono gratuiti.

## SEO

Cosa è già impostato:
- `<title>`, meta `description` e `keywords` in italiano
- `<meta name="robots" content="index, follow, max-image-preview:large">`
- Open Graph completo (`og:title/description/url/image/site_name`) + Twitter Card
- Meta geo locali (`geo.region` IT-52, `geo.placename` Firenze)
- Dati strutturati `LocalBusiness` (JSON-LD) con `hasOfferCatalog` dei servizi, indirizzo Firenze/Toscana, lingue IT/EN
- `robots.txt` e `sitemap.xml` nella root
- `<link rel="canonical">`, HTML semantico, immagini con `alt`, favicon

> **Importante:** tutti gli URL assoluti usano `https://enzaebasta.it/`. Quando il
> dominio è attivo (o se parti dall'URL `.vercel.app`), fai un find-and-replace di
> `https://enzaebasta.it` in: `index.html` (canonical, og:url, og:image, twitter:image, JSON-LD),
> `robots.txt` e `sitemap.xml`.

## Registrazione su Google Search Console

1. **Pubblica il sito** (GitHub → Vercel) così l'URL è raggiungibile online.
2. Vai su [search.google.com/search-console](https://search.google.com/search-console) e accedi.
3. **Aggiungi proprietà** → scegli **"Prefisso URL"** e inserisci l'URL esatto
   (es. `https://enzaebasta.it/` o l'URL `.vercel.app`).
4. **Verifica la proprietà** col metodo più semplice, il **tag HTML**:
   - Google ti dà un meta tipo `<meta name="google-site-verification" content="...">`.
   - In `index.html` c'è già un segnaposto commentato nell'`<head>`: incolla lì il tuo
     e togli il commento (`<!-- -->`).
   - Fai commit/push, aspetta il deploy di Vercel, poi premi **Verifica**.
   - *(In alternativa)* puoi caricare il file `googlexxxx.html` che Google fornisce
     nella root del progetto e committarlo.
5. **Invia la sitemap:** in Search Console → menu **Sitemap** → inserisci `sitemap.xml` → Invia.
6. *(Consigliato)* Usa **Controllo URL** sulla home e clicca **Richiedi indicizzazione**.

> Dopo aver collegato il dominio custom su Vercel, ripeti l'aggiunta della proprietà
> con l'URL definitivo (Search Console tratta `vercel.app` e il dominio custom come proprietà separate).

### Bonus
- Per le statistiche di traffico, valuta **Google Analytics 4** (richiede un piccolo
  snippet nell'`<head>`) o un'alternativa privacy-friendly come Plausible.
- Verifica i dati strutturati col [Rich Results Test](https://search.google.com/test/rich-results).

## Da personalizzare
- Dominio: sostituisci `https://enzaebasta.it` ovunque (vedi nota SEO sopra)
- Email / località (in `index.html`: sezione Contatti **e** JSON-LD nell'`<head>`)
- Link social (Instagram e Google Maps sono impostati; aggiungine altri se servono)
- Testi placeholder in Chi Sono e Biografia (li riscriverà Enza)
- Tappe/anni della timeline
- Riattivare "Chef a Domicilio" (card commentata nei `servizi`) quando l'ATECO è pronto
- Checklist pubblicazione: aggiorna `PUBLISHING-CHECKLIST.md` con consensi, dominio e QA finale
