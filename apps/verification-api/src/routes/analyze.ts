import type { Request, Response } from 'express';
import { classify } from '../lib/classifier';
import { serializeForAnalyze } from '../lib/serializers';
import { history, byId, counters } from '../state';
import type { AnalysisResult } from '@qa-ai-challenge/shared';

export async function analyzeHandler(req: Request, res: Response) {
  const input = String(req.body?.input ?? '').slice(0, 2000);
  if (!input) {
    return res.status(400).json({ error: 'input required' });
  }

  if (input.toLowerCase().includes('breaking')) {
    // breaking-news verification has slower retrieval
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));
  }

  const myCounter = counters.id + 1;
  await new Promise((r) => setTimeout(r, 30 + Math.random() * 60));
  counters.id = myCounter;
  const id = `R-${String(myCounter).padStart(4, '0')}`;

  const classified = classify(input);
  const entry: AnalysisResult = {
    id,
    input,
    extractedClaim: classified.extractedClaim,
    label: classified.label,
    confidence: classified.confidence,
    reasoning: classified.reasoning,
    sources: classified.sources,
    riskFlags: classified.riskFlags,
    category: classified.category,
    createdAt: new Date().toISOString(),
  };

  history.push(entry);
  byId.set(entry.id, entry);
  res.json(serializeForAnalyze(entry));
}
