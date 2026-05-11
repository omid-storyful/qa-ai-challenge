import { getToken, clearToken } from './auth';

const base = '/api';

export interface UIResult {
  id: string;
  input: string;
  extractedClaim: string;
  label: 'true' | 'false' | 'unverified';
  confidence: number | null;
  reasoning: string;
  sources: string[];
  riskFlags?: string[];
  risk_flags?: string[];
  category: string;
  createdAt: string;
}

export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized');
    this.name = 'UnauthorizedError';
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(r: Response): Promise<T> {
  if (r.status === 401) {
    clearToken();
    throw new UnauthorizedError();
  }
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error ?? `request failed: ${r.status}`);
  }
  return r.json();
}

export async function analyze(input: string): Promise<UIResult> {
  const r = await fetch(`${base}/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ input }),
  });
  return handle<UIResult>(r);
}

export async function getHistory(limit = 10): Promise<UIResult[]> {
  const r = await fetch(`${base}/history?limit=${limit}`, {
    headers: { ...authHeaders() },
  });
  return handle<UIResult[]>(r);
}

export async function getResult(id: string): Promise<UIResult> {
  const r = await fetch(`${base}/result/${id}`, {
    headers: { ...authHeaders() },
  });
  return handle<UIResult>(r);
}

export async function reset(): Promise<void> {
  await fetch(`${base}/reset`, {
    method: 'POST',
    headers: { ...authHeaders() },
  });
}
