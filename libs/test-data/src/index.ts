import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface GoldenExample {
  id: string;
  input: string;
  expectedLabel: 'true' | 'false' | 'unverified';
  expectedRiskFlags: string[];
  mustMention: string[];
  shouldNotMention: string[];
  notes: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
}

function loadDataset(): GoldenExample[] {
  // Resolve relative to this file at runtime so the dataset works under
  // tsx/vite/node without needing JSON import assertions.
  const here = typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
  const p = path.join(here, 'golden-dataset.json');
  return JSON.parse(fs.readFileSync(p, 'utf8')) as GoldenExample[];
}

export const goldenDataset: GoldenExample[] = loadDataset();
