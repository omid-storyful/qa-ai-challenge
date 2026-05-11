export type Label = 'true' | 'false' | 'unverified';

export type Category =
  | 'breaking_news'
  | 'reused_media'
  | 'manipulated_image'
  | 'satire'
  | 'unverifiable'
  | 'high_risk_misinfo'
  | 'benign_true'
  | 'missing_source'
  | 'location_mismatch'
  | 'date_mismatch'
  | 'unknown';

export interface AnalysisResult {
  id: string;
  input: string;
  extractedClaim: string;
  label: Label;
  confidence: number;
  reasoning: string;
  sources: string[];
  riskFlags: string[];
  category: string;
  createdAt: string;
}

export interface AnalyzeRequest {
  input: string;
}
