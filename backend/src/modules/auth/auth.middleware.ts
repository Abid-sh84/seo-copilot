import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ─── Augmented Request Type ────────────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────

interface JWTPayload {
  sub: string;    // User's MongoDB ObjectId
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization token required' });
    return;
  }

  const token  = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('[Auth] JWT_SECRET is not defined');
    res.status(500).json({ success: false, error: 'Server configuration error' });
    return;
  }

  try {
    const decoded   = jwt.verify(token, secret) as JWTPayload;
    req.userId      = decoded.sub;
    req.userEmail   = decoded.email;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};
