import type { Request, Response } from 'express';
import { byId } from '../state';
import { serializeForAnalyze } from '../lib/serializers';

export function resultHandler(req: Request, res: Response) {
  const r = byId.get(req.params.id);
  if (!r) {
    return res.status(404).json({ error: 'not found' });
  }
  res.json(serializeForAnalyze(r));
}
