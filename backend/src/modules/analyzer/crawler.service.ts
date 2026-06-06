import axios from 'axios';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

// ─── CrawlResult type ─────────────────────────────────────────────────────────

export interface CrawlResult {
  $: CheerioAPI;
  html: string;
  url: string;
  finalUrl: string;
  statusCode: number;
  isHttps: boolean;
  loadTimeMs: number;
  method: 'axios' | 'puppeteer';
  wordCount: number;
  bodyText: string;
}

// ─── Puppeteer crawler (imported dynamically for fast startup) ────────────────

async function crawlWithPuppeteer(url: string): Promise<CrawlResult> {
  const puppeteer = await import('puppeteer');
  const start     = Date.now();

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page     = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (compatible; SEOCopilot/1.0; +https://seocopilot.app)');
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    const html     = await page.content();
    const finalUrl = page.url();
    const $        = cheerio.load(html);
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

    return {
      $, html, url, finalUrl,
      statusCode: response?.status() ?? 200,
      isHttps: finalUrl.startsWith('https://'),
      loadTimeMs: Date.now() - start,
      method: 'puppeteer',
      wordCount: bodyText.split(/\s+/).filter(Boolean).length,
      bodyText,
    };
  } finally {
    await browser.close();
  }
}

// ─── Axios crawler (lightweight, used first) ──────────────────────────────────

async function crawlWithAxios(url: string): Promise<CrawlResult> {
  const start    = Date.now();
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent':     'Mozilla/5.0 (compatible; SEOCopilot/1.0; +https://seocopilot.app)',
      Accept:           'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    maxRedirects: 5,
  });

  const html     = response.data as string;
  const finalUrl = response.request?.res?.responseUrl ?? url;
  const $        = cheerio.load(html);

  $('script, style, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

  return {
    $, html, url, finalUrl,
    statusCode: response.status,
    isHttps: finalUrl.startsWith('https://'),
    loadTimeMs: Date.now() - start,
    method: 'axios',
    wordCount: bodyText.split(/\s+/).filter(Boolean).length,
    bodyText,
  };
}

function isJsSpa($: CheerioAPI): boolean {
  return $('body').text().replace(/\s+/g, ' ').trim().length < 100;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function crawlUrl(url: string): Promise<CrawlResult> {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const result = await crawlWithAxios(url);
    if (isJsSpa(result.$)) {
      console.log(`[Crawler] JS SPA detected, falling back to Puppeteer: ${url}`);
      return await crawlWithPuppeteer(url);
    }
    return result;
  } catch (axiosError) {
    console.log(`[Crawler] Axios failed, retrying with Puppeteer: ${url}`, axiosError);
    return await crawlWithPuppeteer(url);
  }
}
