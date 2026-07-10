import { expect, test } from '@playwright/test';
import { aggregateEvaluations, evaluateCase, type EvaluationExample } from '@qa-ai-challenge/evaluator';

const example: EvaluationExample = {
  id: 'unit',
  expectedLabel: 'unverified',
  expectedRiskFlags: ['unsourced_claim'],
  mustMention: ['unsourced'],
  shouldNotMention: ['confirmed'],
  severity: 'high',
  category: 'unverifiable',
};

test('rewards semantically aligned output without requiring exact confidence', () => {
  const result = evaluateCase(example, {
    label: 'unverified',
    confidence: 0.47,
    reasoning: 'This is an unsourced anecdote.',
    riskFlags: ['unsourced_claim'],
    category: 'unverifiable',
  });
  expect(result.score).toBe(100);
  expect(result.hardFailures).toEqual([]);
});

test('returns component diagnostics and rejects invalid confidence', () => {
  const result = evaluateCase(example, {
    label: 'false',
    confidence: 1.04,
    reasoning: 'Officials confirmed it.',
    riskFlags: [],
    category: 'unknown',
  });
  expect(result.score).toBeLessThan(25);
  expect(result.hardFailures).toContain('confidence 1.040 is outside [0, 1]');
  expect(result.diagnostics).toContain('reasoning contains forbidden: confirmed');
});

test('weights critical examples more heavily in the aggregate signal', () => {
  const passing = evaluateCase({ ...example, id: 'low', severity: 'low' }, {
    label: 'unverified',
    confidence: 0.5,
    reasoning: 'unsourced',
    riskFlags: ['unsourced_claim'],
    category: 'unverifiable',
  });
  const failing = evaluateCase({ ...example, id: 'critical', severity: 'critical' }, { error: 'HTTP 500' });
  const aggregate = aggregateEvaluations([passing, failing]);
  expect(aggregate.score).toBeLessThan(40);
  expect(aggregate.signal).toBe('critical');
});
