import rateLimit from 'express-rate-limit';

/** General API rate limiter — applied to all /api/* routes */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

/** Strict limiter for the audit endpoint (expensive AI + crawl operation) */
export const auditLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Audit rate limit exceeded. You can run up to 20 audits per hour.' },
});
