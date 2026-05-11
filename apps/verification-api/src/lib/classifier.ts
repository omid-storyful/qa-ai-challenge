import type { Label } from '@qa-ai-challenge/shared';

type CategoryRule = { pattern: RegExp; category: string };

const RULES: CategoryRule[] = [
  { pattern: /\b(breaking|just in)\b/i, category: 'breaking_news' },
  { pattern: /\b(yesterday|old footage|from 201\d)\b/i, category: 'reused_media' },
  { pattern: /\b(doctored|edited|photoshopped)\b/i, category: 'manipulated_image' },
  { pattern: /\b(parody|satire|the onion|humor)\b/i, category: 'satire' },
  { pattern: /\b(i heard|people say|rumored)\b/i, category: 'unverifiable' },
  { pattern: /\b(earthquake|explosion|shooting)\b/i, category: 'high_risk_misinfo' },
  { pattern: /\b(according to reuters|ap reports|officials confirmed|associated press)\b/i, category: 'benign_true' },
];

function categorize(input: string): string {
  for (const { pattern, category } of RULES) {
    if (pattern.test(input)) return category;
  }
  return 'unknown';
}

interface Mapping {
  label: Label;
  baseConfidence: number;
  sources: string[];
  riskFlags: string[];
  reasoning: string;
}

function mapping(category: string, matchedKeywords: number, tokenCount: number): Mapping {
  const base: Mapping = {
    label: 'false',
    baseConfidence: 0.5,
    sources: [],
    riskFlags: [],
    reasoning: '',
  };
  switch (category) {
    case 'breaking_news':
      return {
        ...base,
        label: 'unverified',
        baseConfidence: 0.55,
        sources: ['reuters.com/breaking-feed'],
        riskFlags: ['developing_story', 'high_volatility'],
        reasoning: 'Breaking news claim — sources are still emerging and details may change.',
      };
    case 'reused_media':
      return {
        ...base,
        label: 'false',
        baseConfidence: 0.78,
        sources: ['tineye.com', 'reverse-image-search'],
        riskFlags: ['old_footage'],
        reasoning: 'Visual or contextual cues suggest the media is reused from an earlier event.',
      };
    case 'manipulated_image':
      return {
        ...base,
        label: 'false',
        baseConfidence: 0.82,
        sources: ['forensically.com'],
        riskFlags: ['manipulated_media'],
        reasoning: 'Image shows signs of digital manipulation inconsistent with original.',
      };
    case 'satire':
      return {
        ...base,
        baseConfidence: 0.7,
        sources: ['theonion.com'],
        riskFlags: ['parody_account'],
        reasoning: 'This appears to be parody or satire and should be treated as humor, not misinformation.',
      };
    case 'unverifiable':
      return {
        ...base,
        label: 'unverified',
        baseConfidence: 0.4,
        sources: [],
        riskFlags: ['unsourced_claim'],
        reasoning: 'Claim is anecdotal and lacks attributable sources.',
      };
    case 'high_risk_misinfo':
      return {
        ...base,
        label: 'false',
        baseConfidence: 0.8,
        sources: [],
        riskFlags: ['high_risk_misinfo', 'potential_harm'],
        reasoning: 'High-risk claim with no corroborating sources — likely misinformation.',
      };
    case 'benign_true':
      return {
        ...base,
        label: 'true',
        baseConfidence: 0.85,
        sources: ['reuters.com', 'apnews.com'],
        riskFlags: [],
        reasoning: 'Claim is attributed to a credible wire service and matches reporting from multiple outlets.',
      };
    default:
      return {
        ...base,
        label: 'unverified',
        baseConfidence: matchedKeywords / tokenCount,
        sources: [],
        riskFlags: [],
        reasoning: 'Unable to classify with confidence; insufficient signal to ground a verdict.',
      };
  }
}

export interface ClassifyResult {
  extractedClaim: string;
  label: Label;
  confidence: number;
  reasoning: string;
  sources: string[];
  riskFlags: string[];
  category: string;
}

export function classify(input: string): ClassifyResult {
  const lower = input.toLowerCase();
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const category = categorize(lower);

  let matchedKeywords = 0;
  for (const { pattern } of RULES) {
    if (pattern.test(lower)) matchedKeywords += 1;
  }

  const m = mapping(category, matchedKeywords, tokens.length);
  const signalBoost = 0.05 * matchedKeywords + 0.05 * m.sources.length;
  const jitter = (Math.random() - 0.5) * 0.1; // jitter: models retrieval/scoring variability
  const confidence = m.baseConfidence + jitter + signalBoost;

  const firstSentence = input.split(/[.!?]/)[0] ?? input;
  const extractedClaim = firstSentence.trim().slice(0, 140);

  return {
    extractedClaim,
    label: m.label,
    confidence,
    reasoning: m.reasoning,
    sources: m.sources,
    riskFlags: m.riskFlags,
    category,
  };
}
