#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
languages=(tr en ar de fr es)

check_locales() {
  local locale_root=$1
  node - "$locale_root" <<'NODE'
const fs = require('fs');
const root = process.argv[2];
const languages = ['tr', 'en', 'ar', 'de', 'fr', 'es'];
const flatten = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return child && typeof child === 'object' && !Array.isArray(child) ? flatten(child, path) : [path];
}).sort();
const baseline = flatten(JSON.parse(fs.readFileSync(`${root}/tr.json`, 'utf8')));
for (const language of languages) {
  const path = `${root}/${language}.json`;
  const parsed = JSON.parse(fs.readFileSync(path, 'utf8'));
  const keys = flatten(parsed);
  const missing = baseline.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !baseline.includes(key));
  if (missing.length || extra.length) throw new Error(`${path}: missing=${missing.join(',')} extra=${extra.join(',')}`);
}
NODE
}

check_locales "$repo_root/kuran-kerim-diyor/locales"
check_locales "$repo_root/kuran-ne-diyor-web/locales"

(
  cd "$repo_root/backend"
  export DATABASE_URL=${DATABASE_URL:-postgresql://validation:validation@127.0.0.1:5432/validation}
  npx prisma validate
  npx prisma generate
  node node_modules/typescript/bin/tsc --noEmit
  node node_modules/typescript/bin/tsc --ignoreConfig --noEmit --module commonjs --moduleResolution node --target es2022 --esModuleInterop --skipLibCheck --ignoreDeprecations 6.0 scripts/categorize-full.ts scripts/categorize-verses.ts
  npm test
  npm audit --audit-level=high
)

(
  cd "$repo_root/kuran-kerim-diyor"
  jq empty app.json
  node node_modules/typescript/bin/tsc --noEmit
  npx expo-doctor
  npm audit --audit-level=critical >/dev/null
)

(
  cd "$repo_root/kuran-ne-diyor-web"
  node node_modules/typescript/bin/tsc --noEmit
  node node_modules/eslint/bin/eslint.js . --max-warnings=0
  node node_modules/next/dist/bin/next build
  npm audit --audit-level=high
)

if rg -n "fallback_secret'|fallback_refresh_secret'|JWT_(REFRESH_)?SECRET=.*change_me" "$repo_root/backend/src" "$repo_root/docker-compose.production.yml"; then
  echo "Unsafe production placeholder found" >&2
  exit 1
fi

echo "Release checks passed. External owner/store checks remain in docs/STORE_RELEASE.md."
