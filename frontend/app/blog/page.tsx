'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateBlog, getBlogs, deleteBlog } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Loader2,
  Sparkles,
  Copy,
  Check,
  FileText,
  Code,
  Globe,
  MessageCircleQuestion,
  LayoutList,
  Trash2,
  ChevronDown,
  Clock,
  BookOpen,
  Target,
  Lightbulb,
  Link2,
  BarChart3,
  Quote,
} from 'lucide-react';
import type { BlogResult, BlogListItem } from '@/types/audit';

// ── Copy Button ───────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 text-xs h-7"
      id={`copy-btn-${label?.toLowerCase().replace(/\s/g, '-') ?? 'text'}`}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-400" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          {label ?? 'Copy'}
        </>
      )}
    </Button>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  children,
  copyText,
  className = '',
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  copyText?: string;
  className?: string;
}) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/10">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {copyText && <CopyButton text={copyText} label={title} />}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Blog History Item ─────────────────────────────────────────────────────────

function BlogHistoryItem({
  blog,
  onSelect,
  onDelete,
  isDeleting,
}: {
  blog: BlogListItem;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div
      className="glass-card p-4 cursor-pointer hover:border-primary/30 transition-all group"
      onClick={() => onSelect(blog.blogId)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{blog.title || blog.keyword}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{blog.metaDescription}</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="text-xs">
              {blog.keyword}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(blog.createdAt).toLocaleDateString()}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {(blog.generationDurationMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(blog.blogId);
          }}
          disabled={isDeleting}
          id={`delete-blog-${blog.blogId}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function BlogGeneratorPage() {
  const [keyword, setKeyword] = useState('');
  const [tone, setTone] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState<BlogResult | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch blog history
  const { data: blogsData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => getBlogs(1, 20),
  });

  const blogs: BlogListItem[] = blogsData?.data?.blogs ?? [];

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: () => generateBlog(keyword.trim(), tone || undefined, targetAudience || undefined),
    onSuccess: (data) => {
      setGeneratedBlog(data?.data ?? null);
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      setDeletingId(null);
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    generateMutation.mutate();
  };

  const handleSelectBlog = async (blogId: string) => {
    // Load the full blog from the API
    try {
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.get(`/api/blog/${blogId}`);
      if (response.data?.success) {
        setGeneratedBlog({
          ...response.data.data,
          blogId: response.data.data._id,
        });
      }
    } catch (err) {
      console.error('Failed to load blog:', err);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
    if (generatedBlog?.blogId === id) {
      setGeneratedBlog(null);
    }
  };

  const blog = generatedBlog;

  // Build full copy text for "Copy All"
  const fullCopyText = blog
    ? `# ${blog.title}\n\nMeta Description: ${blog.metaDescription}\nSlug: /${blog.slug}\n\n## Outline\n${blog.outline.map((s) => `${'  '.repeat(s.level === 'h1' ? 0 : s.level === 'h2' ? 1 : 2)}- ${s.text}`).join('\n')}\n\n## Introduction\n${blog.introduction}\n\n## FAQ\n${blog.faqSection.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}\n\n## FAQ Schema (JSON-LD)\n${blog.faqSchema}`
    : '';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Blog Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate SEO + AEO + GEO optimized blog content with Gemini AI
        </p>
      </div>

      {/* Generator Form */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Generate Blog Content</h2>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4" id="blog-form">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="blog-keyword-input"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter a keyword or topic (e.g. 'what is AEO optimization')"
                disabled={generateMutation.isPending}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
              />
            </div>
            <Button
              type="submit"
              id="blog-generate-btn"
              disabled={generateMutation.isPending || !keyword.trim()}
              className="gradient-brand text-white border-0 glow-blue px-6 font-semibold min-w-[150px]"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {/* Optional Settings */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
            Advanced Options
          </button>

          {showOptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-lg bg-muted/10 border border-border">
              <div>
                <label htmlFor="blog-tone" className="text-xs font-medium text-muted-foreground mb-1 block">
                  Tone
                </label>
                <select
                  id="blog-tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Professional & Informative (default)</option>
                  <option value="conversational and friendly">Conversational & Friendly</option>
                  <option value="technical and in-depth">Technical & In-Depth</option>
                  <option value="beginner-friendly and educational">Beginner-Friendly & Educational</option>
                  <option value="persuasive and marketing-focused">Persuasive & Marketing-Focused</option>
                </select>
              </div>
              <div>
                <label htmlFor="blog-audience" className="text-xs font-medium text-muted-foreground mb-1 block">
                  Target Audience
                </label>
                <input
                  id="blog-audience"
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. SaaS founders, SEO agencies"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          {/* Loading State */}
          {generateMutation.isPending && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Gemini AI is crafting your SEO+AEO+GEO optimized blog content...
            </p>
          )}

          {/* Error */}
          {generateMutation.error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {generateMutation.error instanceof Error
                ? generateMutation.error.message
                : 'An error occurred during generation'}
            </div>
          )}
        </form>
      </div>

      {/* Results */}
      {blog && (
        <div className="space-y-4">
          {/* Header with stats */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Generated Content</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Keyword: <span className="font-mono text-primary">{blog.keyword}</span>
                {blog.generationDurationMs && (
                  <> · Generated in <span className="font-mono">{(blog.generationDurationMs / 1000).toFixed(1)}s</span></>
                )}
              </p>
            </div>
            <CopyButton text={fullCopyText} label="Copy All" />
          </div>

          {/* Meta Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SectionCard icon={FileText} title="SEO Title" copyText={blog.title}>
              <p className="text-sm font-medium">{blog.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {blog.title.length} characters
                <span className={blog.title.length >= 50 && blog.title.length <= 60 ? ' text-green-400' : ' text-yellow-400'}>
                  {' '}({blog.title.length >= 50 && blog.title.length <= 60 ? '✓ optimal' : 'review length'})
                </span>
              </p>
            </SectionCard>

            <SectionCard icon={Target} title="Meta Description" copyText={blog.metaDescription}>
              <p className="text-sm">{blog.metaDescription}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {blog.metaDescription.length} characters
                <span className={blog.metaDescription.length >= 150 && blog.metaDescription.length <= 160 ? ' text-green-400' : ' text-yellow-400'}>
                  {' '}({blog.metaDescription.length >= 150 && blog.metaDescription.length <= 160 ? '✓ optimal' : 'review length'})
                </span>
              </p>
            </SectionCard>

            <SectionCard icon={Link2} title="URL Slug" copyText={`/${blog.slug}`}>
              <p className="text-sm font-mono text-primary">/{blog.slug}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">{blog.contentDepthTarget}</Badge>
                <span className="text-xs text-muted-foreground">{blog.recommendedWordCount.toLocaleString()} words</span>
              </div>
            </SectionCard>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="outline" className="space-y-4">
            <TabsList className="glass border border-border">
              <TabsTrigger value="outline" id="tab-outline">
                <LayoutList className="w-3.5 h-3.5 mr-1.5" />
                Outline
              </TabsTrigger>
              <TabsTrigger value="intro" id="tab-intro">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                Introduction
              </TabsTrigger>
              <TabsTrigger value="faq" id="tab-faq">
                <MessageCircleQuestion className="w-3.5 h-3.5 mr-1.5" />
                FAQ ({blog.faqSection.length})
              </TabsTrigger>
              <TabsTrigger value="schema" id="tab-schema">
                <Code className="w-3.5 h-3.5 mr-1.5" />
                Schema
              </TabsTrigger>
              <TabsTrigger value="geo" id="tab-geo-enhancements">
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                GEO Tips
              </TabsTrigger>
            </TabsList>

            {/* Outline Tab */}
            <TabsContent value="outline">
              <SectionCard
                icon={LayoutList}
                title="Blog Outline"
                copyText={blog.outline.map((s) => `${'  '.repeat(s.level === 'h1' ? 0 : s.level === 'h2' ? 1 : 2)}<${s.level}>${s.text}</${s.level}>`).join('\n')}
              >
                <div className="space-y-2">
                  {blog.outline.map((section, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        section.level === 'h1'
                          ? 'bg-primary/5 border border-primary/20'
                          : section.level === 'h2'
                          ? 'bg-muted/20 border border-border ml-4'
                          : 'bg-muted/10 border border-border/50 ml-8'
                      }`}
                    >
                      <Badge
                        variant="outline"
                        className={`text-xs font-mono flex-shrink-0 ${
                          section.level === 'h1'
                            ? 'border-primary/40 text-primary'
                            : section.level === 'h2'
                            ? 'border-blue-400/40 text-blue-400'
                            : 'border-muted-foreground/40 text-muted-foreground'
                        }`}
                      >
                        {section.level.toUpperCase()}
                      </Badge>
                      <div>
                        <p className={`text-sm ${section.level === 'h1' ? 'font-bold' : 'font-medium'}`}>
                          {section.text}
                        </p>
                        {section.description && (
                          <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </TabsContent>

            {/* Introduction Tab */}
            <TabsContent value="intro">
              <SectionCard icon={BookOpen} title="AEO-Optimized Introduction" copyText={blog.introduction}>
                <p className="text-sm leading-relaxed">{blog.introduction}</p>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-muted-foreground">Definition-first format for AEO</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs text-muted-foreground">Optimized for featured snippets</span>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq">
              <SectionCard
                icon={MessageCircleQuestion}
                title={`FAQ Section (${blog.faqSection.length} Questions)`}
                copyText={blog.faqSection.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}
              >
                <Accordion type="single" collapsible className="space-y-2">
                  {blog.faqSection.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:bg-muted/20 hover:no-underline text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-primary flex-shrink-0">Q{i + 1}</span>
                          <span className="text-sm font-medium">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </SectionCard>
            </TabsContent>

            {/* Schema Tab */}
            <TabsContent value="schema">
              <SectionCard icon={Code} title="FAQPage JSON-LD Schema" copyText={blog.faqSchema}>
                <div className="relative">
                  <pre className="bg-muted/30 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    {blog.faqSchema}
                  </pre>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-muted-foreground">Ready to paste into your HTML &lt;head&gt; or &lt;body&gt;</span>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* GEO Enhancements Tab */}
            <TabsContent value="geo">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SectionCard icon={Globe} title="Entity Suggestions">
                  <ul className="space-y-2">
                    {blog.geoEnhancements.entitySuggestions.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Globe className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard icon={Quote} title="Citation Placeholders">
                  <ul className="space-y-2">
                    {blog.geoEnhancements.citationPlaceholders.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Quote className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard icon={BarChart3} title="Statistic Hooks">
                  <ul className="space-y-2">
                    {blog.geoEnhancements.statisticHooks.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <BarChart3 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard icon={Lightbulb} title="Internal Link Suggestions">
                  <ul className="space-y-2">
                    {blog.geoEnhancements.internalLinkSuggestions.map((l, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        {l}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Blog History */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Generations</h2>
        {isLoadingHistory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No blog content generated yet. Enter a keyword above to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blogs.map((blog) => (
              <BlogHistoryItem
                key={blog.blogId}
                blog={blog}
                onSelect={handleSelectBlog}
                onDelete={handleDelete}
                isDeleting={deletingId === blog.blogId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
