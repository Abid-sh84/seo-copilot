import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../auth';
import { generateBlogContent } from './blog.service';
import { Blog } from '../../models/Blog.model';

// ─── Validation ───────────────────────────────────────────────────────────────

const blogRequestSchema = z.object({
  keyword: z
    .string()
    .min(2, 'Keyword must be at least 2 characters')
    .max(100, 'Keyword must be under 100 characters')
    .trim(),
  tone: z.string().optional(),
  targetAudience: z.string().optional(),
});

// ─── POST /api/blog/generate — Generate blog content ─────────────────────────

export async function generateBlog(req: AuthenticatedRequest, res: Response): Promise<void> {
  const start = Date.now();

  const parseResult = blogRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: parseResult.error.errors[0]?.message ?? 'Invalid request',
    });
    return;
  }

  const { keyword, tone, targetAudience } = parseResult.data;
  const userId = req.userId!;

  try {
    const blogContent = await generateBlogContent(keyword, tone, targetAudience);

    const generationDurationMs = Date.now() - start;

    // Persist to database
    const blog = await Blog.create({
      userId: new mongoose.Types.ObjectId(userId),
      keyword,
      ...blogContent,
      status: 'completed',
      generationDurationMs,
    });

    console.log(`[Blog] Generated for "${keyword}" in ${generationDurationMs}ms`);

    res.status(201).json({
      success: true,
      data: {
        blogId: blog._id,
        keyword,
        ...blogContent,
        generationDurationMs,
        status: 'completed',
        createdAt: blog.createdAt,
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Blog generation failed';
    console.error('[Blog] Generation failed:', errorMessage);

    // Save failed attempt
    await Blog.create({
      userId: new mongoose.Types.ObjectId(userId),
      keyword,
      title: '',
      metaDescription: '',
      slug: '',
      outline: [],
      introduction: '',
      faqSection: [],
      faqSchema: '',
      geoEnhancements: {
        entitySuggestions: [],
        citationPlaceholders: [],
        statisticHooks: [],
        internalLinkSuggestions: [],
      },
      recommendedWordCount: 0,
      contentDepthTarget: '',
      status: 'failed',
      errorMessage,
      generationDurationMs: Date.now() - start,
    });

    res.status(500).json({
      success: false,
      error: `Failed to generate blog for "${keyword}": ${errorMessage}`,
    });
  }
}

// ─── GET /api/blog — List all generated blogs ────────────────────────────────

export async function listBlogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page  = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const skip  = (page - 1) * limit;

  const [blogs, total] = await Promise.all([
    Blog.find({ userId: req.userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('keyword title slug metaDescription createdAt generationDurationMs'),
    Blog.countDocuments({ userId: req.userId, status: 'completed' }),
  ]);

  res.json({
    success: true,
    data: {
      blogs: blogs.map((b) => ({
        blogId: b._id,
        keyword: b.keyword,
        title: b.title,
        slug: b.slug,
        metaDescription: b.metaDescription,
        createdAt: b.createdAt,
        generationDurationMs: b.generationDurationMs,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    },
  });
}

// ─── GET /api/blog/:id — Get single blog ────────────────────────────────────

export async function getBlog(req: AuthenticatedRequest, res: Response): Promise<void> {
  const blog = await Blog.findOne({ _id: req.params.id, userId: req.userId });

  if (!blog) {
    res.status(404).json({ success: false, error: 'Blog not found' });
    return;
  }

  res.json({ success: true, data: blog });
}

// ─── DELETE /api/blog/:id — Delete a blog ────────────────────────────────────

export async function deleteBlog(req: AuthenticatedRequest, res: Response): Promise<void> {
  const blog = await Blog.findOneAndDelete({ _id: req.params.id, userId: req.userId });

  if (!blog) {
    res.status(404).json({ success: false, error: 'Blog not found' });
    return;
  }

  res.json({ success: true, message: 'Blog deleted successfully' });
}
