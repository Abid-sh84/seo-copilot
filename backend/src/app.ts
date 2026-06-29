import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import { generalLimiter } from './common/middleware/rateLimiter';
import { auditRouter } from './modules/audit';
import { blogRouter }  from './modules/blog';
import { authRouter }  from './modules/auth';

const app = express();

// ── Security & Performance Middleware ──────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── General Rate Limiter ───────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── Module Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',   authRouter);   // POST /api/auth/upsert-user (internal)
app.use('/api/audit',  auditRouter);   // POST /api/audit  (run audit)
app.use('/api/audits', auditRouter);   // GET  /api/audits (history + single)
app.use('/api/blog',   blogRouter);    // POST /api/blog/generate, GET /api/blog

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

export default app;
