import { expect, test } from '@playwright/test';

import { API_URL, authHeaders } from '../../helpers/auth';
import { resetState } from '../../helpers/state';

function expectAnalysisResponse(body: unknown): asserts body is {
  id: string;
  label: string;
  confidence: number;
  reasoning: string;
  risk_flags: string[];
  category: string;
} {
  expect(body).toEqual(expect.objectContaining({
    id: expect.any(String),
    label: expect.any(String),
    confidence: expect.any(Number),
    reasoning: expect.any(String),
    risk_flags: expect.any(Array),
    category: expect.any(String),
  }));

  const analysis = body as Record<string, unknown>;
  expect(analysis['id']).toMatch(/^R-\d{4}$/);
  expect(['true', 'false', 'unverified']).toContain(analysis['label']);
  expect(Array.isArray(analysis['risk_flags'])).toBeTruthy();
  expect((analysis['risk_flags'] as unknown[]).every((flag) => typeof flag === 'string')).toBeTruthy();
}

function expectHistoryEntry(entry: unknown): asserts entry is {
  id: string;
  input: string;
  label: string;
  confidence: number;
  reasoning: string;
  riskFlags: string[];
  category: string;
} {
  expect(entry).toEqual(expect.objectContaining({
    id: expect.any(String),
    input: expect.any(String),
    label: expect.any(String),
    confidence: expect.any(Number),
    reasoning: expect.any(String),
    riskFlags: expect.any(Array),
    category: expect.any(String),
  }));

  const historyItem = entry as Record<string, unknown>;
  expect(historyItem['id']).toMatch(/^R-\d{4}$/);
  expect(Array.isArray(historyItem['riskFlags'])).toBeTruthy();
  expect((historyItem['riskFlags'] as unknown[]).every((flag) => typeof flag === 'string')).toBeTruthy();
}

test.describe('API contracts', () => {
  test.beforeEach(async ({ request }) => resetState(request));

  test.afterEach(async ({ request }) => {
    await resetState(request);
  });

  test('keeps health public but requires auth for analysis', async ({ request }) => {
    const health = await request.get(`${API_URL}/health`);
    expect(health.status()).toBe(200);
    await expect(health.json()).resolves.toEqual({ ok: true });

    const missing = await request.post(`${API_URL}/api/analyze`, { data: { input: 'According to Reuters, the bridge is closed.' } });
    const invalid = await request.post(`${API_URL}/api/analyze`, {
      headers: { Authorization: 'Bearer invalid' },
      data: { input: 'According to Reuters, the bridge is closed.' },
    });

    expect(missing.status()).toBe(401);
    expect(invalid.status()).toBe(401);
  });

  test('stores a result, returns it by id, shows it in history, and clears history on reset', async ({ request }) => {
    const analyzed = await request.post(`${API_URL}/api/analyze`, {
      headers: authHeaders,
      data: { input: 'According to Reuters, officials confirmed the bridge closure.' },
    });
    expect(analyzed.ok()).toBeTruthy();

    const body = await analyzed.json();
    expectAnalysisResponse(body);
    expect(body).toMatchObject({ label: 'true', category: 'benign_true', risk_flags: [] });

    const result = await request.get(`${API_URL}/api/result/${body.id}`, { headers: authHeaders });
    expect(result.ok()).toBeTruthy();
    const resultBody = await result.json();
    expectAnalysisResponse(resultBody);
    expect(resultBody.id).toBe(body.id);

    const history = await request.get(`${API_URL}/api/history?limit=1`, { headers: authHeaders });
    expect(history.ok()).toBeTruthy();
    const historyBody = await history.json();
    expect(historyBody).toHaveLength(1);
    expectHistoryEntry(historyBody[0]);
    expect(historyBody[0]).toEqual(expect.objectContaining({ id: body.id, riskFlags: [] }));

    await resetState(request);
    const cleared = await request.get(`${API_URL}/api/history`, { headers: authHeaders });
    expect(await cleared.json()).toEqual([]);
  });

  test('rejects a missing input payload and 404s unknown ids', async ({ request }) => {
    const missing = await request.post(`${API_URL}/api/analyze`, { headers: authHeaders, data: {} });
    expect(missing.status()).toBe(400);
    await expect(missing.json()).resolves.toEqual({ error: 'input required' });

    const unknown = await request.get(`${API_URL}/api/result/R-9999`, { headers: authHeaders });
    expect(unknown.status()).toBe(404);
  });

  test('clamps history limits to the supported range', async ({ request }) => {
    const inputs = [
      'First history item.',
      'Second history item.',
      'Third history item.',
    ];

    for (const input of inputs) {
      const response = await request.post(`${API_URL}/api/analyze`, {
        headers: authHeaders,
        data: { input },
      });
      expect(response.ok()).toBeTruthy();
    }

    const minClamped = await request.get(`${API_URL}/api/history?limit=0`, { headers: authHeaders });
    const maxClamped = await request.get(`${API_URL}/api/history?limit=999`, { headers: authHeaders });
    const limited = await request.get(`${API_URL}/api/history?limit=2`, { headers: authHeaders });

    await expect(minClamped.json()).resolves.toHaveLength(1);
    await expect(maxClamped.json()).resolves.toHaveLength(inputs.length);
    await expect(limited.json()).resolves.toHaveLength(2);
  });
});
