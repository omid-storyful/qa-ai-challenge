#!/usr/bin/env node
// Minimal smoke test. Assumes the API is already running on :3333.
// Run `npm run dev:api` in another terminal first, then `npm run smoke`.

const base = process.env.API_BASE ?? 'http://localhost:3333';
const token = process.env.API_TOKEN ?? 'tester-tok-9f3b1a2c';
const authHeaders = { authorization: `Bearer ${token}` };

async function check(label, fn) {
  try {
    const v = await fn();
    console.log(`  ✓ ${label}`);
    return v;
  } catch (e) {
    console.error(`  ✗ ${label}: ${e?.message ?? e}`);
    process.exitCode = 1;
    return null;
  }
}

console.log(`smoke @ ${base}`);

await check('GET /health', async () => {
  const r = await fetch(`${base}/health`);
  if (!r.ok) throw new Error(`status ${r.status}`);
  const j = await r.json();
  if (!j.ok) throw new Error(`unexpected body: ${JSON.stringify(j)}`);
});

await check('POST /api/analyze (benign_true)', async () => {
  const r = await fetch(`${base}/api/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders },
    body: JSON.stringify({ input: 'According to Reuters, officials confirmed the bridge closure.' }),
  });
  if (!r.ok) throw new Error(`status ${r.status}`);
  const j = await r.json();
  if (!j.id || !j.label) throw new Error(`unexpected body: ${JSON.stringify(j)}`);
  console.log(`    id=${j.id} label=${j.label} confidence=${j.confidence}`);
});

await check('GET /api/history', async () => {
  const r = await fetch(`${base}/api/history?limit=5`, { headers: authHeaders });
  if (!r.ok) throw new Error(`status ${r.status}`);
  const arr = await r.json();
  if (!Array.isArray(arr)) throw new Error(`expected array`);
  console.log(`    entries=${arr.length}`);
});
