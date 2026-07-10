export type Verdict = 'true' | 'false' | 'unverified';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface EvaluationExample {
  id: string;
  expectedLabel: Verdict;
  expectedRiskFlags: string[];
  mustMention: string[];
  shouldNotMention: string[];
  severity: Severity;
  category: string;
}

export interface EvaluationOutput {
  label?: Verdict;
  confidence?: number | null;
  reasoning?: string;
  riskFlags?: string[];
  category?: string;
  error?: string;
}

export interface ComponentScores {
  label: number;
  riskFlags: number;
  reasoning: number;
  confidence: number;
  category: number;
}

export interface CaseEvaluation {
  id: string;
  severity: Severity;
  score: number;
  weightedScore: number;
  weight: number;
  components: ComponentScores;
  hardFailures: string[];
  diagnostics: string[];
}

export interface AggregateEvaluation {
  score: number;
  signal: 'excellent' | 'acceptable' | 'concerning' | 'critical';
  evaluated: number;
  hardFailureCount: number;
  bySeverity: Record<Severity, number>;
  cases: CaseEvaluation[];
}

const COMPONENT_WEIGHTS: ComponentScores = {
  label: 0.35,
  riskFlags: 0.2,
  reasoning: 0.2,
  confidence: 0.15,
  category: 0.1,
};

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  low: 1,
  medium: 1.5,
  high: 2,
  critical: 3,
};

const CONFIDENCE_BANDS: Record<Verdict, readonly [number, number]> = {
  true: [0.65, 0.98],
  false: [0.55, 0.98],
  unverified: [0.25, 0.8],
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const normalizeText = (value: string) => value.toLocaleLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
const round = (value: number) => Math.round(value * 100) / 100;

function scoreRiskFlags(expected: string[], actual: string[]): number {
  if (expected.length === 0) {
    return actual.length === 0 ? 1 : 0.8;
  }

  const expectedFlags = new Set(expected.map(normalizeText));
  const actualFlags = new Set(actual.map(normalizeText));
  const matched = [...expectedFlags].filter((flag) => actualFlags.has(flag)).length;
  const extra = [...actualFlags].filter((flag) => !expectedFlags.has(flag)).length;

  const recall = matched / expectedFlags.size;
  const precisionPenalty = extra * 0.05;

  return clamp(recall - precisionPenalty);
}

function scoreReasoning(example: EvaluationExample, reasoning: string, diagnostics: string[]): number {
  const text = normalizeText(reasoning);
  const missing = example.mustMention.filter((term) => !text.includes(normalizeText(term)));
  const forbidden = example.shouldNotMention.filter((term) => text.includes(normalizeText(term)));

  if (missing.length > 0) {
    diagnostics.push(`reasoning missing: ${missing.join(', ')}`);
  }
  if (forbidden.length > 0) {
    diagnostics.push(`reasoning contains forbidden: ${forbidden.join(', ')}`);
  }

  const requiredScore = example.mustMention.length === 0
    ? 1
    : 1 - missing.length / example.mustMention.length;
  const forbiddenScore = example.shouldNotMention.length === 0
    ? 1
    : 1 - forbidden.length / example.shouldNotMention.length;

  return 0.75 * requiredScore + 0.25 * forbiddenScore;
}

function scoreConfidence(label: Verdict | undefined, confidence: number | null | undefined, hardFailures: string[]): number {
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) {
    hardFailures.push('confidence must be a finite number');
    return 0;
  }

  if (confidence < 0 || confidence > 1) {
    hardFailures.push(`confidence ${confidence.toFixed(3)} is outside [0, 1]`);
    return 0;
  }

  if (!label) {
    return 0;
  }

  const [lower, upper] = CONFIDENCE_BANDS[label];
  if (confidence >= lower && confidence <= upper) {
    return 1;
  }

  const distance = confidence < lower ? lower - confidence : confidence - upper;
  return clamp(1 - distance / 0.25);
}

function scoreLabel(expected: Verdict, actual?: Verdict, diagnostics?: string[]): number {
  if (actual === expected) {
    return 1;
  }
  diagnostics?.push(`label expected ${expected}, received ${actual ?? 'none'}`);
  return 0;
}

function scoreCategory(expected: string, actual: string | undefined, diagnostics: string[]): number {
  if (actual === expected) {
    return 1;
  }
  diagnostics.push(`category expected ${expected}, received ${actual ?? 'none'}`);
  return 0;
}

function toSignal(score: number): AggregateEvaluation['signal'] {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'acceptable';
  if (score >= 60) return 'concerning';
  return 'critical';
}

export function evaluateCase(example: EvaluationExample, output: EvaluationOutput): CaseEvaluation {
  const diagnostics: string[] = [];
  const hardFailures: string[] = [];
  if (output.error) {
    diagnostics.push(`request failed: ${output.error}`);
  }

  const label = scoreLabel(example.expectedLabel, output.label, diagnostics);
  const riskFlags = scoreRiskFlags(example.expectedRiskFlags, output.riskFlags ?? []);
  if (riskFlags < 1) {
    diagnostics.push(`risk flags expected [${example.expectedRiskFlags.join(', ')}], received [${(output.riskFlags ?? []).join(', ')}]`);
  }

  const components: ComponentScores = {
    label,
    riskFlags,
    reasoning: scoreReasoning(example, output.reasoning ?? '', diagnostics),
    confidence: scoreConfidence(output.label, output.confidence, hardFailures),
    category: scoreCategory(example.category, output.category, diagnostics),
  };

  const weightedComponents = (Object.keys(COMPONENT_WEIGHTS) as (keyof ComponentScores)[])
    .reduce((total, key) => total + components[key] * COMPONENT_WEIGHTS[key], 0);
  const weight = SEVERITY_WEIGHTS[example.severity];

  return {
    id: example.id,
    severity: example.severity,
    score: round(weightedComponents * 100),
    weightedScore: round(weightedComponents * 100 * weight),
    weight,
    components,
    hardFailures,
    diagnostics,
  };
}

export function aggregateEvaluations(cases: CaseEvaluation[]): AggregateEvaluation {
  const totalWeight = cases.reduce((sum, item) => sum + item.weight, 0);
  const score = totalWeight === 0
    ? 0
    : cases.reduce((sum, item) => sum + item.weightedScore, 0) / totalWeight;
  const roundedScore = round(score);
  const severities: Severity[] = ['low', 'medium', 'high', 'critical'];
  const bySeverity = Object.fromEntries(
    severities.map((severity) => {
      const selected = cases.filter((item) => item.severity === severity);
      const averageScore = selected.length === 0
        ? 0
        : selected.reduce((sum, item) => sum + item.score, 0) / selected.length;
      return [severity, round(averageScore)];
    }),
  ) as Record<Severity, number>;

  return {
    score: roundedScore,
    signal: toSignal(roundedScore),
    evaluated: cases.length,
    hardFailureCount: cases.reduce((sum, item) => sum + item.hardFailures.length, 0),
    bySeverity,
    cases,
  };
}

export function renderEvaluationMarkdown(result: AggregateEvaluation): string {
  const lines = [
    '# Golden dataset quality signal',
    '',
    `**${result.signal.toUpperCase()} — ${result.score.toFixed(2)}/100**`,
    '',
    `Evaluated ${result.evaluated} examples; found ${result.hardFailureCount} invariant violation(s).`,
    '',
    '| Example | Severity | Score | Hard failures | Diagnostics |',
    '| --- | --- | ---: | --- | --- |',
    ...result.cases.map((item) => `| ${item.id} | ${item.severity} | ${item.score.toFixed(2)} | ${item.hardFailures.join('; ') || '—'} | ${item.diagnostics.join('; ') || '—'} |`),
    '',
  ];
  return lines.join('\n');
}
