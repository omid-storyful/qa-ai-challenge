import express from 'express';
import cors from 'cors';
import { analyzeHandler } from './routes/analyze';
import { historyHandler } from './routes/history';
import { resultHandler } from './routes/result';
import { resetHandler } from './routes/reset';
import { requireAuth } from './lib/auth';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/analyze', requireAuth, analyzeHandler);
app.get('/api/history', requireAuth, historyHandler);
app.get('/api/result/:id', requireAuth, resultHandler);
app.post('/api/reset', resetHandler);

const port = Number(process.env.PORT ?? 3333);
app.listen(port, () => {
  console.log(`verification-api listening on :${port}`);
});
