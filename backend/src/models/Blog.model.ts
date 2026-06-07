import mongoose, { Document, Schema } from 'mongoose';

// ─── Blog Document Interface ─────────────────────────────────────────────────

export interface IBlog extends Document {
  userId: mongoose.Types.ObjectId;
  keyword: string;
  title: string;
  metaDescription: string;
  slug: string;
  outline: BlogOutlineSection[];
  introduction: string;
  faqSection: FAQItem[];
  faqSchema: string;             // Ready-to-paste JSON-LD
  geoEnhancements: GEOEnhancement;
  recommendedWordCount: number;
  contentDepthTarget: string;
  status: 'completed' | 'failed';
  errorMessage?: string;
  generationDurationMs: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogOutlineSection {
  level: 'h1' | 'h2' | 'h3';
  text: string;
  description?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface GEOEnhancement {
  entitySuggestions: string[];
  citationPlaceholders: string[];
  statisticHooks: string[];
  internalLinkSuggestions: string[];
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const blogOutlineSchema = new Schema<BlogOutlineSection>(
  {
    level:       { type: String, enum: ['h1', 'h2', 'h3'], required: true },
    text:        { type: String, required: true },
    description: { type: String },
  },
  { _id: false }
);

const faqItemSchema = new Schema<FAQItem>(
  {
    question: { type: String, required: true },
    answer:   { type: String, required: true },
  },
  { _id: false }
);

const geoEnhancementSchema = new Schema<GEOEnhancement>(
  {
    entitySuggestions:       [{ type: String }],
    citationPlaceholders:    [{ type: String }],
    statisticHooks:          [{ type: String }],
    internalLinkSuggestions: [{ type: String }],
  },
  { _id: false }
);

const blogSchema = new Schema<IBlog>(
  {
    userId:              { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    keyword:             { type: String, required: true },
    title:               { type: String, required: true },
    metaDescription:     { type: String, required: true },
    slug:                { type: String, required: true },
    outline:             { type: [blogOutlineSchema], required: true },
    introduction:        { type: String, required: true },
    faqSection:          { type: [faqItemSchema], required: true },
    faqSchema:           { type: String, required: true },
    geoEnhancements:     { type: geoEnhancementSchema, required: true },
    recommendedWordCount:{ type: Number, required: true },
    contentDepthTarget:  { type: String, required: true },
    status:              { type: String, enum: ['completed', 'failed'], default: 'completed' },
    errorMessage:        { type: String },
    generationDurationMs:{ type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL index — auto-delete after 90 days
blogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Blog = mongoose.model<IBlog>('Blog', blogSchema);
