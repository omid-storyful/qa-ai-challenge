import type { AnalysisResult } from '@qa-ai-challenge/shared';

export function serializeForAnalyze(r: AnalysisResult) {
  return {
    id: r.id,
    input: r.input,
    extractedClaim: r.extractedClaim,
    label: r.label,
    confidence: r.confidence,
    reasoning: r.reasoning,
    sources: r.sources,
    risk_flags: r.riskFlags,
    category: r.category,
    createdAt: r.createdAt,
  };
}

export function serializeForHistory(r: AnalysisResult) {
  return {
    id: r.id,
    input: r.input,
    extractedClaim: r.extractedClaim,
    label: r.label,
    confidence: r.confidence,
    reasoning: r.reasoning,
    sources: r.sources,
    riskFlags: r.riskFlags,
    category: r.category,
    createdAt: r.createdAt,
  };
}
