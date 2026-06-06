import mongoose, { Document, Schema } from 'mongoose';
import type {
  SEOCheck,
  AEOCheck,
  GEOCheck,
  Recommendation,
  CrawlMethod,
} from '../common/types';

export interface IAudit extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  timestamp: Date;

  // Scores
  seoScore: number;
  aeoScore: number;
  geoScore: number;
  overallScore: number;
  geoReadiness: 'low' | 'medium' | 'high';

  // Check results
  seoChecks: SEOCheck[];
  aeoChecks: AEOCheck[];
  geoChecks: GEOCheck[];

  // AI recommendations
  recommendations: Recommendation[];

  // Page metadata
  pageTitle: string;
  pageDescription: string;
  pageWordCount: number;

  // Crawl info
  crawlMethod: CrawlMethod;
  crawlDurationMs: number;

  // Status
  status: 'completed' | 'failed' | 'partial';
  errorMessage?: string;

  // TTL - auto-delete after 90 days
  expiresAt: Date;
}

const SEOCheckSchema = new Schema(
  {
    id: String,
    name: String,
    category: { type: String, enum: ['meta', 'structure', 'technical', 'performance'] },
    weight: Number,
    passed: Boolean,
    value: String,
    expected: String,
    message: String,
    severity: { type: String, enum: ['high', 'medium', 'low'] },
  },
  { _id: false }
);

const AEOCheckSchema = new Schema(
  {
    id: String,
    name: String,
    maxPoints: Number,
    earnedPoints: Number,
    passed: Boolean,
    details: String,
  },
  { _id: false }
);

const GEOCheckSchema = new Schema(
  {
    id: String,
    name: String,
    maxPoints: Number,
    earnedPoints: Number,
    passed: Boolean,
    details: String,
  },
  { _id: false }
);

const RecommendationSchema = new Schema(
  {
    checkId: String,
    issueType: String,
    severity: { type: String, enum: ['high', 'medium', 'low'] },
    suggestion: String,
    codeSnippet: String,
    estimatedImpact: { type: String, enum: ['high', 'medium', 'low'] },
  },
  { _id: false }
);

const AuditSchema = new Schema<IAudit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },

    // Scores
    seoScore: { type: Number, min: 0, max: 100, default: 0 },
    aeoScore: { type: Number, min: 0, max: 100, default: 0 },
    geoScore: { type: Number, min: 0, max: 100, default: 0 },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    geoReadiness: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },

    // Check results
    seoChecks: [SEOCheckSchema],
    aeoChecks: [AEOCheckSchema],
    geoChecks: [GEOCheckSchema],

    // AI recommendations
    recommendations: [RecommendationSchema],

    // Page metadata
    pageTitle: { type: String, default: '' },
    pageDescription: { type: String, default: '' },
    pageWordCount: { type: Number, default: 0 },

    // Crawl info
    crawlMethod: { type: String, enum: ['axios', 'puppeteer'], default: 'axios' },
    crawlDurationMs: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      enum: ['completed', 'failed', 'partial'],
      default: 'completed',
    },
    errorMessage: String,

    // TTL index - auto-delete after 90 days
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      index: { expires: 0 }, // MongoDB TTL index
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user audit history queries
AuditSchema.index({ userId: 1, timestamp: -1 });
AuditSchema.index({ userId: 1, url: 1 });

export const Audit = mongoose.model<IAudit>('Audit', AuditSchema);
