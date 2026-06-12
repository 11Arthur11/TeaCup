import { readFileSync } from 'node:fs';
const generated = readFileSync('src/api/generated-operations.ts', 'utf8');
const operationIds = [...generated.matchAll(/^\s+"([^"]+)": \{ method:/gm)].map((match) => match[1]);
const applicationSource = ['src/pages/user.ts','src/pages/admin.ts','src/pages/auth.ts','src/ui/layout.ts','src/api/session-profile.ts','src/api/auth-session.ts','src/ui/user-picker.ts','src/core/wallet-action.ts','src/core/user-chrome.ts','src/api/wallet.ts','src/api/dashboard.ts','src/api/admin-dashboard.ts','src/api/public-catalog.ts','src/api/dns.ts','src/ui/dns-assignment.ts','src/ui/resource-picker.ts']
  .map((file) => readFileSync(file, 'utf8')).join('\n');
const intentionallyServerSide = new Set(['aqayePardakhtCallback', 'getIp']);
const uncovered = operationIds.filter((id) => !intentionallyServerSide.has(id) && !applicationSource.includes(`'${id}'`) && !applicationSource.includes(`"${id}"`));
if (uncovered.length) {
  console.error('Uncovered OpenAPI operations:', uncovered.join(', '));
  process.exit(1);
}
console.log(`API coverage OK: ${operationIds.length - intentionallyServerSide.size}/${operationIds.length} client-facing operations referenced; callback/test endpoints intentionally excluded.`);
