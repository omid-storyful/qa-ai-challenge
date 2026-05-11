import type { Request, Response } from 'express';
import { history } from '../state';
import { serializeForHistory } from '../lib/serializers';

export function historyHandler(req: Request, res: Response) {
  const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 10)));
  res.json(history.slice(0, limit).map(serializeForHistory));
}
