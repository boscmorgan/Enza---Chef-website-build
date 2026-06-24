#!/usr/bin/env bash
# =====================================================================
# Scarica i font self-hosted per "Enza e basta".
# Esegui sul TUO computer (ha internet normale):
#     bash fonts/download-fonts.sh
# oppure dalla cartella fonts/:  bash download-fonts.sh
#
# Scarica Anton (titoli) e Fredoka 400/500/600/700 (testo) in .woff2
# con i nomi che css/style.css si aspetta. Dopo, il sito è 100% locale.
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")"

# nome_file_locale  ->  percorso su fontsource
FILES=(
  "anton-400.woff2|anton@latest/latin-400-normal.woff2"
  "fredoka-400.woff2|fredoka@latest/latin-400-normal.woff2"
  "fredoka-500.woff2|fredoka@latest/latin-500-normal.woff2"
  "fredoka-600.woff2|fredoka@latest/latin-600-normal.woff2"
  "fredoka-700.woff2|fredoka@latest/latin-700-normal.woff2"
  "fredoka-latin-ext-400.woff2|fredoka@latest/latin-ext-400-normal.woff2"
  "fredoka-latin-ext-500.woff2|fredoka@latest/latin-ext-500-normal.woff2"
  "fredoka-latin-ext-600.woff2|fredoka@latest/latin-ext-600-normal.woff2"
  "fredoka-latin-ext-700.woff2|fredoka@latest/latin-ext-700-normal.woff2"
)

PRIMARY="https://cdn.jsdelivr.net/fontsource/fonts"
MIRROR="https://unpkg.com/@fontsource"   # fallback (struttura: /anton/files/anton-latin-400-normal.woff2)

ok=0; fail=0
for row in "${FILES[@]}"; do
  out="${row%%|*}"; path="${row#*|}"
  fam="${path%%@*}"                       # es. anton
  wn="$(echo "$path" | grep -oE 'latin(-ext)?-[0-9]+-normal')"  # es. latin-400-normal / latin-ext-400-normal
  echo "↓  $out"
  if curl -fsSL "$PRIMARY/$path" -o "$out"; then
    ok=$((ok+1))
  elif curl -fsSL "$MIRROR/$fam/files/$fam-$wn.woff2" -o "$out"; then
    ok=$((ok+1))
  else
    echo "   ✗ impossibile scaricare $out"
    fail=$((fail+1))
  fi
done

echo ""
echo "Scaricati: $ok  ·  Falliti: $fail"
if [ "$fail" -eq 0 ]; then
  echo "✅ Font pronti in $(pwd). Il sito ora usa i font locali."
else
  echo "⚠️  Qualcosa non è andato. In alternativa scaricali a mano da"
  echo "    https://fontsource.org (Anton + Fredoka) e rinominali come sopra."
fi
