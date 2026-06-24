# Font self-hosted

Il sito usa font **locali** (nessuna chiamata a Google Fonts):
- **Anton** — titoli display → `anton-400.woff2`
- **Fredoka** — testo / sottotitoli (rounded sans) → `fredoka-400/500/600/700.woff2`

Le regole `@font-face` sono già in `css/style.css` e puntano a questi file.
Finché i `.woff2` non sono presenti, parte un fallback di sistema (il sito resta leggibile).

## Scaricare i font (una volta sola)

Dal tuo computer, nella cartella del progetto:

```bash
bash fonts/download-fonts.sh
```

Lo script scarica i 5 file `.woff2` con i nomi giusti, da fontsource
(con mirror unpkg di riserva). Fatto questo, il sito è 100% self-hosted.

## In alternativa, a mano
Scarica Anton e Fredoka da https://fontsource.org (o https://gwfh.mranftl.com),
prendi i `.woff2` latin e rinominali esattamente così, in questa cartella:

```
anton-400.woff2
fredoka-400.woff2
fredoka-500.woff2
fredoka-600.woff2
fredoka-700.woff2
```

Non serve toccare altro: i nomi combaciano con il CSS.

> **Importante:** committa i `.woff2` nel repo. Servono anche online —
> se non sono in Git, Vercel non li ha e il sito userà il fallback di sistema.
> Scaricali con lo script *prima* del primo deploy.
