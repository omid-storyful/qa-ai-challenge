import { expect, test, type APIResponse } from '@playwright/test';
import { aggregateEvaluations, evaluateCase, type EvaluationOutput } from '@qa-ai-challenge/evaluator';
import goldenDatasetJson from '@qa-ai-challenge/test-data/golden-dataset';

import { API_URL, authHeaders } from '../../helpers/auth';
import { resetState } from '../../helpers/state';
import { attachQualitySignal } from '../../reports/quality-signal';

const goldenDataset = goldenDatasetJson as Array<Parameters<typeof evaluateCase>[0] & { input: string }>;

async function toEvaluationOutput(response: APIResponse): Promise<EvaluationOutput> {
  if (!response.ok()) {
    return { error: `HTTP ${response.status()}` };
  }

  const body = await response.json();
  return {
    label: body.label,
    confidence: body.confidence,
    reasoning: body.reasoning,
    riskFlags: body.risk_flags,
    category: body.category,
  };
}

test.describe('golden evaluation', () => {
  test.beforeEach(async ({ request }) => {
    await resetState(request);
  });

  test.afterEach(async ({ request }) => {
    await resetState(request);
  });

  test('scores the golden set and writes a quality signal for the run', async ({ request }, testInfo) => {
    test.setTimeout(90_000);
    const cases = [];

    for (const example of goldenDataset) {
      const response = await request.post(`${API_URL}/api/analyze`, { headers: authHeaders, data: { input: example.input } });
      const output = await toEvaluationOutput(response);
      cases.push(evaluateCase(example, output));
    }

    const aggregate = aggregateEvaluations(cases);
    await attachQualitySignal(testInfo, aggregate);

    expect(aggregate.evaluated).toBe(goldenDataset.length);
    expect(aggregate.score, 'severity-weighted quality floor').toBeGreaterThanOrEqual(60);
  });
});
