'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateBlog, getBlogs, deleteBlog } from '@/lib/api';
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
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
      id={`copy-btn-${label?.toLowerCase().replace(/\s/g, '-') ?? 'text'}`}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          {label ?? 'Copy'}
        </>
      )}
    </button>
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
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm ${className}`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
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
      className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
      onClick={() => onSelect(blog.blogId)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
            {blog.title || blog.keyword}
          </p>
          <p className="text-xs text-slate-400 mt-1 truncate">{blog.metaDescription}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
              {blog.keyword}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(blog.createdAt).toLocaleDateString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {(blog.generationDurationMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(blog.blogId);
          }}
          disabled={isDeleting}
          id={`delete-blog-${blog.blogId}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
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

  const { data: blogsData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => getBlogs(1, 20),
  });

  const blogs: BlogListItem[] = blogsData?.data?.blogs ?? [];

  const generateMutation = useMutation({
    mutationFn: () => generateBlog(keyword.trim(), tone || undefined, targetAudience || undefined),
    onSuccess: (data) => {
      setGeneratedBlog(data?.data ?? null);
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });

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
    try {
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.get(`/api/blog/${blogId}`);
      if (response.data?.success) {
        setGeneratedBlog({ ...response.data.data, blogId: response.data.data._id });
      }
    } catch (err) {
      console.error('Failed to load blog:', err);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
    if (generatedBlog?.blogId === id) setGeneratedBlog(null);
  };

  const blog = generatedBlog;

  const fullCopyText = blog
    ? `# ${blog.title}\n\nMeta Description: ${blog.metaDescription}\nSlug: /${blog.slug}\n\n## Outline\n${blog.outline.map((s) => `${'  '.repeat(s.level === 'h1' ? 0 : s.level === 'h2' ? 1 : 2)}- ${s.text}`).join('\n')}\n\n## Introduction\n${blog.introduction}\n\n## FAQ\n${blog.faqSection.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}\n\n## FAQ Schema (JSON-LD)\n${blog.faqSchema}`
    : '';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Blog Generator</h1>
        <p className="text-slate-500 text-sm mt-1">
          Generate SEO + AEO + GEO optimized blog content with Gemini AI
        </p>
      </div>

      {/* Generator Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-800">Generate Blog Content</h2>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4" id="blog-form">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="blog-keyword-input"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter a keyword or topic (e.g. 'what is AEO optimization')"
                disabled={generateMutation.isPending}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              id="blog-generate-btn"
              disabled={generateMutation.isPending || !keyword.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-500/20 min-w-[150px] flex items-center justify-center gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
            Advanced Options
          </button>

          {showOptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label htmlFor="blog-tone" className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">
                  Tone
                </label>
                <select
                  id="blog-tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  <option value="">Professional &amp; Informative (default)</option>
                  <option value="conversational and friendly">Conversational &amp; Friendly</option>
                  <option value="technical and in-depth">Technical &amp; In-Depth</option>
                  <option value="beginner-friendly and educational">Beginner-Friendly &amp; Educational</option>
                  <option value="persuasive and marketing-focused">Persuasive &amp; Marketing-Focused</option>
                </select>
              </div>
              <div>
                <label htmlFor="blog-audience" className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">
                  Target Audience
                </label>
                <input
                  id="blog-audience"
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. SaaS founders, SEO agencies"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {generateMutation.isPending && (
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Gemini AI is crafting your SEO+AEO+GEO optimized blog content...
            </p>
          )}

          {generateMutation.error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Generated Content</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Keyword: <span className="font-mono text-blue-600">{blog.keyword}</span>
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
              <p className="text-sm font-semibold text-slate-800">{blog.title}</p>
              <p className="text-xs text-slate-400 mt-1">
                {blog.title.length} characters
                <span className={blog.title.length >= 50 && blog.title.length <= 60 ? ' text-green-600' : ' text-yellow-600'}>
                  {' '}({blog.title.length >= 50 && blog.title.length <= 60 ? '✓ optimal' : 'review length'})
                </span>
              </p>
            </SectionCard>

            <SectionCard icon={Target} title="Meta Description" copyText={blog.metaDescription}>
              <p className="text-sm text-slate-700">{blog.metaDescription}</p>
              <p className="text-xs text-slate-400 mt-1">
                {blog.metaDescription.length} characters
                <span className={blog.metaDescription.length >= 150 && blog.metaDescription.length <= 160 ? ' text-green-600' : ' text-yellow-600'}>
                  {' '}({blog.metaDescription.length >= 150 && blog.metaDescription.length <= 160 ? '✓ optimal' : 'review length'})
                </span>
              </p>
            </SectionCard>

            <SectionCard icon={Link2} title="URL Slug" copyText={`/${blog.slug}`}>
              <p className="text-sm font-mono text-blue-600">/{blog.slug}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-medium">
                  {blog.contentDepthTarget}
                </span>
                <span className="text-xs text-slate-400">{blog.recommendedWordCount.toLocaleString()} words</span>
              </div>
            </SectionCard>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="outline" className="space-y-4">
            <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-xl">
              <TabsTrigger value="outline" id="tab-outline" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 data-[state=active]:text-slate-900">
                <LayoutList className="w-3.5 h-3.5 mr-1.5" />
                Outline
              </TabsTrigger>
              <TabsTrigger value="intro" id="tab-intro" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 data-[state=active]:text-slate-900">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                Introduction
              </TabsTrigger>
              <TabsTrigger value="faq" id="tab-faq" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 data-[state=active]:text-slate-900">
                <MessageCircleQuestion className="w-3.5 h-3.5 mr-1.5" />
                FAQ ({blog.faqSection.length})
              </TabsTrigger>
              <TabsTrigger value="schema" id="tab-schema" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 data-[state=active]:text-slate-900">
                <Code className="w-3.5 h-3.5 mr-1.5" />
                Schema
              </TabsTrigger>
              <TabsTrigger value="geo" id="tab-geo-enhancements" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-600 data-[state=active]:text-slate-900">
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                GEO Tips
              </TabsTrigger>
            </TabsList>

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
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                        section.level === 'h1'
                          ? 'bg-blue-50 border-blue-100'
                          : section.level === 'h2'
                          ? 'bg-slate-50 border-slate-200 ml-4'
                          : 'bg-white border-slate-100 ml-8'
                      }`}
                    >
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                          section.level === 'h1'
                            ? 'bg-blue-100 text-blue-700'
                            : section.level === 'h2'
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {section.level.toUpperCase()}
                      </span>
                      <div>
                        <p className={`text-sm text-slate-800 ${section.level === 'h1' ? 'font-bold' : 'font-medium'}`}>
                          {section.text}
                        </p>
                        {section.description && (
                          <p className="text-xs text-slate-400 mt-1">{section.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="intro">
              <SectionCard icon={BookOpen} title="AEO-Optimized Introduction" copyText={blog.introduction}>
                <p className="text-sm leading-relaxed text-slate-700">{blog.introduction}</p>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-slate-500">Definition-first format for AEO</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs text-slate-500">Optimized for featured snippets</span>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

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
                      className="border border-slate-200 rounded-xl overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 hover:no-underline text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex-shrink-0">Q{i + 1}</span>
                          <span className="text-sm font-medium text-slate-800">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 border-t border-slate-100">
                        <p className="text-sm text-slate-600 mt-3">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </SectionCard>
            </TabsContent>

            <TabsContent value="schema">
              <SectionCard icon={Code} title="FAQPage JSON-LD Schema" copyText={blog.faqSchema}>
                <div className="relative">
                  <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto text-slate-700">
                    {blog.faqSchema}
                  </pre>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-slate-500">Ready to paste into your HTML &lt;head&gt; or &lt;body&gt;</span>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="geo">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SectionCard icon={Globe} title="Entity Suggestions">
                  <ul className="space-y-2">
                    {blog.geoEnhancements.entitySuggestions.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <Globe className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard icon={Quote} title="Citation Placeholders">
                  <ul className="space-y-2">
                    {blog.geoEnhancements.citationPlaceholders.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <Quote className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard icon={BarChart3} title="Statistic Hooks">
                  <ul className="space-y-2">
                    {blog.geoEnhancements.statisticHooks.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard icon={Lightbulb} title="Internal Link Suggestions">
                  <ul className="space-y-2">
                    {blog.geoEnhancements.internalLinkSuggestions.map((l, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />
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
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Recent Generations</h2>
        {isLoadingHistory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
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
