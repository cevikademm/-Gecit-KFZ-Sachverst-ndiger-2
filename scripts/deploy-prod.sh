#!/usr/bin/env bash
# Prod deploy + tüm alias'ları yeni deploy'a bağla.
# Kullanım: bash scripts/deploy-prod.sh
set -e

cd "$(dirname "$0")/.."

ALIASES=(
  "www.kfzgutachter.ac"
  "kfzgutachter.ac"
  "gecit-kfz.vercel.app"
  "gecit-kfz-sachverst-ndiger-2.vercel.app"
)

echo "==> Build (production)"
rm -rf .vercel/output
vercel build --prod 2>&1 | grep -E "built|Error|✓" | tail -3

echo "==> Deploy (prebuilt)"
DEPLOY_OUT=$(vercel deploy --prebuilt --prod 2>&1)
DEPLOY_URL=$(echo "$DEPLOY_OUT" | grep -oE "https://gecit-[a-z0-9]+-cevikademms-projects\.vercel\.app" | head -1)

if [ -z "$DEPLOY_URL" ]; then
  echo "HATA: Deploy URL alinamadi"
  echo "$DEPLOY_OUT"
  exit 1
fi

echo "Deploy: $DEPLOY_URL"

echo "==> Alias'lari yeni deploy'a bagla"
for ALIAS in "${ALIASES[@]}"; do
  vercel alias "$DEPLOY_URL" "$ALIAS" 2>&1 | tail -1
done

echo "==> Health kontrol"
sleep 3
curl -s https://www.kfzgutachter.ac/api/health
echo ""
echo "TAMAM."
