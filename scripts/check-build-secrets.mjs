// Fails when the client build contains anything that looks like a server secret (D-037).
// VITE_* variables are inlined into dist at build time, so a misplaced key ends up here.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BUILD_DIR = process.argv[2] ?? 'dist';

const PATTERNS = [
  { name: 'Supabase service_role marker', re: /service_role/ },
  // "service_role" inside a base64url-encoded JWT payload
  { name: 'service_role JWT payload', re: /c2VydmljZV9yb2xl/ },
  { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'Server env var name', re: /SUPABASE_SERVICE_ROLE_KEY|GEMINI_API_KEY/ }
];

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

let files;
try {
  files = listFiles(BUILD_DIR);
} catch {
  console.error(`check-build-secrets: "${BUILD_DIR}" not found. Run the build first.`);
  process.exit(1);
}

const hits = [];
for (const file of files) {
  if (!/\.(js|mjs|css|html|json|map|webmanifest|txt)$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  for (const { name, re } of PATTERNS) {
    if (re.test(text)) hits.push(`${file}: ${name}`);
  }
}

if (hits.length > 0) {
  console.error('check-build-secrets: possible secrets in the client build:');
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log(`check-build-secrets: ${files.length} files scanned, no secrets found.`);
