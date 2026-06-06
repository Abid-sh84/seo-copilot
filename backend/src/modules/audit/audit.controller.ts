import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../auth';
import { crawlUrl } from '../analyzer';
import { analyzeSEO, calculateSEOScore } from '../analyzer';
import { analyzeAEO, calculateAEOScore } from '../analyzer';
import { analyzeGEO, calculateGEOScore, getGEOReadiness } from '../analyzer';
import { generateRecommendations } from '../ai';
import { Audit } from '../../models/Audit.model';
import { User } from '../../models/User.model';
import type { Recommendation } from '../../common/types';

// ─── Validation ───────────────────────────────────────────────────────────────

export const auditRequestSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .refine((url) => {
      try {
        new URL(url.startsWith('http') ? url : `https://${url}`);
        return true;
      } catch { return false; }
    }, 'Please enter a valid URL'),
});

// ─── POST /api/audit — Run a full audit ───────────────────────────────────────

export async function runAudit(req: AuthenticatedRequest, res: Response): Promise<void> {
  const start = Date.now();

  const parseResult = auditRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: parseResult.error.errors[0]?.message ?? 'Invalid request' });
    return;
  }

  const { url }         = parseResult.data;
  const normalizedUrl   = url.startsWith('http') ? url : `https://${url}`;
  const userId          = req.userId!;

  // Step 1: Crawl
  let crawlResult;
  try {
    crawlResult = await crawlUrl(normalizedUrl);
  } catch (crawlError) {
    const errorMessage = crawlError instanceof Error ? crawlError.message : 'Failed to crawl URL';
    const failedAudit  = await Audit.create({ userId: new mongoose.Types.ObjectId(userId), url: normalizedUrl, status: 'failed', errorMessage });
    res.status(422).json({ success: false, error: `Unable to crawl ${normalizedUrl}: ${errorMessage}`, auditId: failedAudit._id });
    return;
  }

  // Step 2: Analyze
  const [seoChecks, aeoChecks, geoChecks] = await Promise.all([
    analyzeSEO(crawlResult),
    Promise.resolve(analyzeAEO(crawlResult)),
    Promise.resolve(analyzeGEO(crawlResult)),
  ]);

  // Step 3: Calculate scores
  const seoScore    = calculateSEOScore(seoChecks);
  const aeoScore    = calculateAEOScore(aeoChecks);
  const geoScore    = calculateGEOScore(geoChecks);
  const overallScore = Math.round(seoScore * 0.5 + aeoScore * 0.3 + geoScore * 0.2);
  const geoReadiness = getGEOReadiness(geoScore);

  // Step 4: AI recommendations
  let recommendations: Recommendation[] = [];
  try {
    recommendations = await generateRecommendations(normalizedUrl, seoChecks, aeoChecks, geoChecks);
  } catch (geminiError) {
    console.error('[Gemini] Failed to generate recommendations:', geminiError);
  }

  // Step 5: Extract metadata
  const { $ } = crawlResult;
  const pageTitle       = $('title').first().text().trim();
  const pageDescription = $('meta[name="description"]').attr('content')?.trim() ?? '';

  // Step 6: Persist
  const audit = await Audit.create({
    userId: new mongoose.Types.ObjectId(userId),
    url: normalizedUrl, seoScore, aeoScore, geoScore, overallScore, geoReadiness,
    seoChecks, aeoChecks, geoChecks, recommendations, pageTitle, pageDescription,
    pageWordCount: crawlResult.wordCount,
    crawlMethod: crawlResult.method,
    crawlDurationMs: crawlResult.loadTimeMs,
    status: 'completed',
  });

  await User.findByIdAndUpdate(userId, { $inc: { auditCount: 1 } });

  const totalDuration = Date.now() - start;
  console.log(`[Audit] Completed ${normalizedUrl} in ${totalDuration}ms`);

  res.status(201).json({
    success: true,
    data: {
      auditId: audit._id, url: normalizedUrl,
      seoScore, aeoScore, geoScore, overallScore, geoReadiness,
      seoChecks, aeoChecks, geoChecks, recommendations,
      pageTitle, pageDescription,
      pageWordCount: crawlResult.wordCount,
      crawlMethod: crawlResult.method,
      crawlDurationMs: totalDuration,
      status: 'completed',
      timestamp: audit.timestamp,
    },
  });
}

// ─── GET /api/audits — Paginated audit history ────────────────────────────────

export async function listAudits(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page  = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const skip  = (page - 1) * limit;

  const [audits, total] = await Promise.all([
    Audit.find({ userId: req.userId, status: { $ne: 'failed' } })
      .sort({ timestamp: -1 }).skip(skip).limit(limit)
      .select('url seoScore aeoScore geoScore overallScore timestamp status pageTitle'),
    Audit.countDocuments({ userId: req.userId, status: { $ne: 'failed' } }),
  ]);

  res.json({
    success: true,
    data: {
      audits: audits.map((a) => ({
        auditId: a._id, url: a.url, seoScore: a.seoScore, aeoScore: a.aeoScore,
        geoScore: a.geoScore, overallScore: a.overallScore,
        timestamp: a.timestamp, status: a.status, pageTitle: a.pageTitle,
      })),
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    },
  });
}

// ─── GET /api/audits/:id — Single audit ──────────────────────────────────────

export async function getAudit(req: AuthenticatedRequest, res: Response): Promise<void> {
  const audit = await Audit.findOne({ _id: req.params.id, userId: req.userId });
  if (!audit) { res.status(404).json({ success: false, error: 'Audit not found' }); return; }
  res.json({ success: true, data: audit });
}

// ─── DELETE /api/audits/:id — Delete an audit ────────────────────────────────

export async function deleteAudit(req: AuthenticatedRequest, res: Response): Promise<void> {
  const audit = await Audit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!audit) { res.status(404).json({ success: false, error: 'Audit not found' }); return; }
  res.json({ success: true, message: 'Audit deleted successfully' });
}
