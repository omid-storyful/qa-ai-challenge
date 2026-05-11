import type { Request, Response, NextFunction } from 'express';

export const VALID_TOKENS = new Set<string>([
  'tester-tok-9f3b1a2c',
  'admin-tok-7e5d4c8a',
]);

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  let token: string | undefined;

  if (header && header.startsWith('Bearer ')) {
    token = header.slice('Bearer '.length).trim();
  }

  if (!token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token || !VALID_TOKENS.has(token)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  next();
}
