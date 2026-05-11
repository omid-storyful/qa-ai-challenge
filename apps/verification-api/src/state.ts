import type { AnalysisResult } from '@qa-ai-challenge/shared';

export const history: AnalysisResult[] = [];
export const byId: Map<string, AnalysisResult> = new Map();
export const counters = { id: 0 };
