import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export function requireAuth(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}
