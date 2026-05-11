import type { Request, Response } from 'express';
import { history } from '../state';

export function resetHandler(_req: Request, res: Response) {
  history.length = 0;
  res.json({ ok: true });
}
