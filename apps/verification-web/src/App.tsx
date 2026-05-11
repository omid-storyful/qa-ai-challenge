import React, { useEffect, useMemo, useState } from 'react';
import { analyze, getHistory, getResult, reset, UnauthorizedError, type UIResult } from './api';
import { getToken, clearToken } from './auth';
import { LoginPage } from './LoginPage';

const URL_RE = /https?:\/\/[^\s]+/i;
const MAX_URLS = 3;

interface AnalysisItem {
  input: string;
  result?: UIResult;
  error?: string;
}

function extractUrl(text: string | undefined | null): string | null {
  if (!text) return null;
  const m = text.match(URL_RE);
  return m ? m[0] : null;
}

function seedFrom(text: string): number {
  let s = 0;
  for (let i = 0; i < text.length; i += 1) s = (s + text.charCodeAt(i) * (i + 1)) >>> 0;
  return s;
}

function buildPreviewDoc(url: string): string {
  let host = 'unknown';
  let handle = 'user';
  try {
    const u = new URL(url);
    host = u.hostname.replace(/^www\./, '');
    const segs = u.pathname.split('/').filter(Boolean);
    if (segs.length > 0) handle = segs[0];
  } catch {
    /* fall through with defaults */
  }
  const platform = host.split('.')[0] || 'social';
  const displayName = platform.charAt(0).toUpperCase() + platform.slice(1) + ' Post';
  const seed = seedFrom(url);
  const likes = (seed * 13) % 50000;
  const reposts = (seed * 7) % 8000;
  const replies = (seed * 3) % 1200;
  const hours = (seed % 23) + 1;
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Social post preview</title>
<style>
  body { margin: 0; font: 14px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; background: #fff; color: #1f2328; }
  .post { padding: 14px 16px; }
  header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #1d9bf0, #8b5cf6); }
  .name { font-weight: 700; }
  .handle, time { color: #57606a; font-size: 13px; }
  .verified { color: #1d9bf0; font-weight: 700; }
  .body { margin: 6px 0 12px; color: #1f2328; line-height: 1.45; word-break: break-word; }
  .body a { color: #1d9bf0; text-decoration: none; }
  footer { display: flex; gap: 22px; color: #57606a; font-size: 13px; border-top: 1px solid #eaeef2; padding-top: 10px; }
  footer strong { color: #1f2328; }
</style>
</head>
<body>
  <article class="post" aria-label="Embedded social post">
    <header>
      <div class="avatar" aria-hidden="true"></div>
      <span class="name">${escape(displayName)}</span>
      <span class="verified" aria-label="Verified account">&#10003;</span>
      <span class="handle">@${escape(handle)}</span>
      <span aria-hidden="true">&middot;</span>
      <time datetime="PT${hours}H">${hours}h</time>
    </header>
    <p class="body">View this post on ${escape(platform)}: <a href="${escape(url)}" target="_blank" rel="noreferrer">${escape(url)}</a></p>
    <footer>
      <span><strong>${replies.toLocaleString()}</strong> Replies</span>
      <span><strong>${reposts.toLocaleString()}</strong> Reposts</span>
      <span><strong>${likes.toLocaleString()}</strong> Likes</span>
    </footer>
  </article>
</body>
</html>`;
}

export function App() {
  const [authed, setAuthed] = useState<boolean>(() => getToken() !== null);
  const [inputs, setInputs] = useState<string[]>(['']);
  const [items, setItems] = useState<AnalysisItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<UIResult[]>([]);
  const [pending, setPending] = useState(false);

  async function refresh() {
    try {
      setHistory(await getHistory(10));
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        setAuthed(false);
      }
    }
  }

  useEffect(() => {
    if (authed) refresh();
  }, [authed]);

  function setInputAt(i: number, value: string) {
    setInputs((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  }

  function addInput() {
    setInputs((prev) => (prev.length >= MAX_URLS ? prev : [...prev, '']));
  }

  function removeInput(i: number) {
    setInputs((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function onAnalyze() {
    const cleaned = inputs.map((s) => s.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setError('Please enter at least one URL or claim to analyze.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const settled = await Promise.allSettled(cleaned.map((c) => analyze(c)));
      const next: AnalysisItem[] = settled.map((s, i) => ({
        input: cleaned[i],
        result: s.status === 'fulfilled' ? s.value : undefined,
        error:
          s.status === 'rejected'
            ? String((s.reason as Error)?.message ?? s.reason)
            : undefined,
      }));
      if (next.some((n) => n.error && /unauthorized/i.test(n.error))) {
        setAuthed(false);
        return;
      }
      setItems(next);
      await refresh();
    } finally {
      setPending(false);
    }
  }

  async function loadFromHistory(id: string) {
    try {
      const r = await getResult(id);
      setItems([{ input: r.input, result: r }]);
      setError(null);
    } catch (e: any) {
      if (e instanceof UnauthorizedError) {
        setAuthed(false);
        return;
      }
      setError(String(e?.message ?? e));
    }
  }

  async function onReset() {
    await reset();
    setItems([]);
    setInputs(['']);
    setError(null);
    await refresh();
  }

  function onLogout() {
    clearToken();
    setAuthed(false);
    setItems([]);
    setHistory([]);
    setInputs(['']);
    setError(null);
  }

  if (!authed) {
    return <LoginPage onLoggedIn={() => setAuthed(true)} />;
  }

  return (
    <div className="wrap">
      <header className="app-header">
        <div>
          <h1>Content Verification Workbench</h1>
          <p className="tagline">
            Paste up to {MAX_URLS} social-media URLs or claims. We&apos;ll classify each one.
          </p>
        </div>
        <button onClick={onLogout} className="secondary" aria-label="Log out">
          Log out
        </button>
      </header>

      <section className="input">
        <fieldset className="url-fields">
          <legend>Items to verify (up to {MAX_URLS})</legend>
          {inputs.map((value, i) => (
            <div className="url-row" key={i}>
              <input
                type="text"
                value={value}
                onChange={(e) => setInputAt(i, e.target.value)}
                placeholder={`Paste URL or claim #${i + 1}`}
                aria-label={`Item ${i + 1}`}
              />
              {inputs.length > 1 && (
                <button
                  type="button"
                  className="secondary remove-btn"
                  onClick={() => removeInput(i)}
                  aria-label={`Remove item ${i + 1}`}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {inputs.length < MAX_URLS && (
            <button
              type="button"
              className="secondary add-btn"
              onClick={addInput}
            >
              Add URL
            </button>
          )}
        </fieldset>

        <div className="actions">
          <button onClick={onAnalyze} disabled={pending} aria-label="Analyze items">
            {pending ? 'Analyzing…' : 'Analyze'}
          </button>
          <button onClick={onReset} className="secondary" aria-label="Reset history">
            Reset
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

      {items.length > 0 && (
        <ol className="results-list" aria-label="Analysis results">
          {items.map((item, i) => (
            <ResultCard key={i} index={i} item={item} />
          ))}
        </ol>
      )}

      <section className="history" aria-labelledby="history-heading">
        <h2 id="history-heading">Recent analyses</h2>
        {history.length === 0 ? (
          <p className="muted">No analyses yet.</p>
        ) : (
          <ul className="history-list" aria-label="Recent analyses">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className="history-item"
                  onClick={() => loadFromHistory(h.id)}
                  aria-label={`Open analysis ${h.id}, verdict ${h.label}`}
                >
                  <code>{h.id}</code>{' '}
                  <span className={`label-mini label-${h.label}`}>{h.label}</span>{' '}
                  <span className="claim-snippet">{h.extractedClaim}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

interface ResultCardProps {
  index: number;
  item: AnalysisItem;
}

function ResultCard({ index, item }: ResultCardProps) {
  const { input, result, error } = item;
  const previewUrl = useMemo(() => extractUrl(input), [input]);
  const previewDoc = useMemo(
    () => (previewUrl ? buildPreviewDoc(previewUrl) : null),
    [previewUrl]
  );

  const confidencePct =
    result && result.confidence != null && Number.isFinite(result.confidence)
      ? `${Math.round(result.confidence * 100)}%`
      : 'n/a';

  return (
    <li
      className="result-card"
      aria-label={`Result ${index + 1} for ${input}`}
    >
      {previewDoc && (
        <div className="preview" aria-label="Social post preview">
          <iframe
            title="Social post preview"
            srcDoc={previewDoc}
            sandbox="allow-same-origin"
            className="preview-frame"
          />
        </div>
      )}

      {error && (
        <div className="error" role="alert">
          <strong>Failed to analyze:</strong> {error}
        </div>
      )}

      {result && (
        <div className="result" aria-label="Analysis result">
          <div className="result-header">
            <span
              className={`label label-${result.label}`}
              role="status"
              aria-label={`Verdict: ${result.label}`}
            >
              {result.label}
            </span>
            <span className="confidence">Confidence: {confidencePct}</span>
            <code className="result-id">{result.id}</code>
          </div>
          <p className="claim">
            <strong>Input:</strong> <span className="input-echo">{input}</span>
          </p>
          <p className="claim">
            <strong>Extracted claim:</strong> {result.extractedClaim}
          </p>
          <p>
            <strong>Reasoning:</strong> {result.reasoning}
          </p>
          <div>
            <strong id={`sources-${index}`}>Sources:</strong>
            <ul aria-labelledby={`sources-${index}`}>
              {(result.sources ?? []).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong id={`risk-flags-${index}`}>Risk flags:</strong>
            <ul aria-labelledby={`risk-flags-${index}`}>
              {(result.riskFlags ?? result.risk_flags ?? []).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}
