import { writeFile } from 'node:fs/promises';
import type { TestInfo } from '@playwright/test';

import { renderEvaluationMarkdown, type AggregateEvaluation } from '@qa-ai-challenge/evaluator';

export async function attachQualitySignal(testInfo: TestInfo, aggregate: AggregateEvaluation): Promise<void> {
  const markdown = renderEvaluationMarkdown(aggregate);
  const jsonPath = testInfo.outputPath('quality-signal.json');
  const markdownPath = testInfo.outputPath('quality-signal.md');

  await writeFile(jsonPath, JSON.stringify(aggregate, null, 2));
  await writeFile(markdownPath, markdown);
  await testInfo.attach('quality-signal.json', { path: jsonPath, contentType: 'application/json' });
  await testInfo.attach('quality-signal.md', { path: markdownPath, contentType: 'text/markdown' });

  console.log(`\n${markdown}`);
}
