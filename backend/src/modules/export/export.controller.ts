import { Response } from 'express';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import { AuthenticatedRequest } from '../auth';
import { Audit } from '../../models/Audit.model';

// ── helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 75) return '#16a34a'; // green
  if (score >= 50) return '#d97706'; // amber
  return '#dc2626'; // red
}

function severityEmoji(s: string): string {
  return s === 'high' ? '🔴' : s === 'medium' ? '🟡' : '🟢';
}

// ─── POST /api/export/excel/:id ───────────────────────────────────────────────

export async function exportExcel(req: AuthenticatedRequest, res: Response): Promise<void> {
  const audit = await Audit.findOne({ _id: req.params.id, userId: req.userId });
  if (!audit) {
    res.status(404).json({ success: false, error: 'Audit not found' });
    return;
  }

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ─────────────────────────────────────────────────────
  const summaryData = [
    ['SEO Copilot — Audit Report'],
    [''],
    ['URL',          audit.url],
    ['Page Title',   audit.pageTitle],
    ['Date',         new Date(audit.timestamp).toLocaleString()],
    ['Crawl Method', audit.crawlMethod],
    ['Word Count',   audit.pageWordCount],
    [''],
    ['Score',        'Value', 'Status'],
    ['SEO Score',    audit.seoScore,     audit.seoScore >= 75 ? 'Good' : audit.seoScore >= 50 ? 'Needs Work' : 'Poor'],
    ['AEO Score',    audit.aeoScore,     audit.aeoScore >= 75 ? 'Good' : audit.aeoScore >= 50 ? 'Needs Work' : 'Poor'],
    ['GEO Score',    audit.geoScore,     audit.geoScore >= 75 ? 'Good' : audit.geoScore >= 50 ? 'Needs Work' : 'Poor'],
    ['Overall Score',audit.overallScore, audit.overallScore >= 75 ? 'Good' : audit.overallScore >= 50 ? 'Needs Work' : 'Poor'],
    ['GEO Readiness', audit.geoReadiness.toUpperCase(), ''],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 18 }, { wch: 60 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // ── Sheet 2: SEO Checks ───────────────────────────────────────────────────
  const seoRows: (string | number | boolean)[][] = [['Check', 'Weight (%)', 'Status', 'Severity', 'Message', 'Found Value']];
  for (const c of audit.seoChecks) {
    seoRows.push([c.name, c.weight, c.passed ? '✅ Pass' : '❌ Fail', c.severity, c.message, c.value ?? '']);
  }
  const wsSEO = XLSX.utils.aoa_to_sheet(seoRows);
  wsSEO['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 60 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSEO, 'SEO Checks');

  // ── Sheet 3: AEO Checks ───────────────────────────────────────────────────
  const aeoRows: (string | number | boolean)[][] = [['Check', 'Max Points', 'Earned Points', 'Status', 'Details']];
  for (const c of audit.aeoChecks) {
    aeoRows.push([c.name, c.maxPoints, c.earnedPoints, c.passed ? '✅ Pass' : '❌ Fail', c.details]);
  }
  const wsAEO = XLSX.utils.aoa_to_sheet(aeoRows);
  wsAEO['!cols'] = [{ wch: 32 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsAEO, 'AEO Checks');

  // ── Sheet 4: GEO Checks ───────────────────────────────────────────────────
  const geoRows: (string | number | boolean)[][] = [['Check', 'Max Points', 'Earned Points', 'Status', 'Details']];
  for (const c of audit.geoChecks) {
    geoRows.push([c.name, c.maxPoints, c.earnedPoints, c.passed ? '✅ Pass' : '❌ Fail', c.details]);
  }
  const wsGEO = XLSX.utils.aoa_to_sheet(geoRows);
  wsGEO['!cols'] = [{ wch: 32 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsGEO, 'GEO Checks');

  // ── Sheet 5: AI Recommendations ───────────────────────────────────────────
  const recRows = [['Issue Type', 'Severity', 'Check ID', 'AI Suggestion', 'Code Snippet']];
  for (const r of audit.recommendations) {
    recRows.push([
      r.issueType,
      `${severityEmoji(r.severity)} ${r.severity}`,
      r.checkId,
      r.suggestion,
      r.codeSnippet ?? '',
    ]);
  }
  const wsRec = XLSX.utils.aoa_to_sheet(recRows);
  wsRec['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 20 }, { wch: 80 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsRec, 'AI Recommendations');

  // ── Send ──────────────────────────────────────────────────────────────────
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `seo-copilot-audit-${audit._id}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}

// ─── POST /api/export/pdf/:id ─────────────────────────────────────────────────

export async function exportPDF(req: AuthenticatedRequest, res: Response): Promise<void> {
  const audit = await Audit.findOne({ _id: req.params.id, userId: req.userId });
  if (!audit) {
    res.status(404).json({ success: false, error: 'Audit not found' });
    return;
  }

  const seoPassCount = audit.seoChecks.filter((c) => c.passed).length;
  const aeoPassCount = audit.aeoChecks.filter((c) => c.passed).length;
  const geoPassCount = audit.geoChecks.filter((c) => c.passed).length;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #0f172a; background: #fff; font-size: 12px; line-height: 1.5; }
    .page { padding: 40px 48px; max-width: 900px; margin: 0 auto; }

    /* Header */
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { width: 36px; height: 36px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 16px; }
    .logo-text { font-size: 18px; font-weight: 800; color: #0f172a; }
    .logo-text span { color: #2563eb; }
    .header-meta { text-align: right; color: #64748b; font-size: 11px; }
    .header-meta strong { display: block; color: #0f172a; font-size: 13px; font-weight: 600; }

    /* Score cards */
    .scores { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
    .score-card { border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
    .score-value { font-size: 32px; font-weight: 800; }
    .score-label { font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .geo-badge { display: inline-block; margin-top: 6px; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; }

    /* Section */
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
    .section-subtitle { font-size: 11px; color: #64748b; margin-bottom: 8px; }

    /* Check items */
    .check-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border-radius: 8px; margin-bottom: 4px; }
    .check-pass { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .check-fail-high { background: #fef2f2; border: 1px solid #fecaca; }
    .check-fail-med  { background: #fffbeb; border: 1px solid #fde68a; }
    .check-fail-low  { background: #f8fafc; border: 1px solid #e2e8f0; }
    .check-icon { font-size: 12px; margin-top: 1px; flex-shrink: 0; }
    .check-name { font-weight: 600; color: #1e293b; font-size: 11px; }
    .check-msg  { color: #64748b; font-size: 10px; margin-top: 1px; }
    .check-weight { margin-left: auto; font-size: 10px; color: #94a3b8; flex-shrink: 0; }

    /* AEO/GEO check */
    .analyzer-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border-radius: 8px; margin-bottom: 4px; }
    .bar-wrap { width: 60px; height: 6px; background: #e2e8f0; border-radius: 3px; margin-top: 5px; flex-shrink: 0; }
    .bar-fill { height: 6px; background: #3b82f6; border-radius: 3px; }

    /* Recommendations */
    .rec-item { padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 6px; }
    .rec-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
    .rec-badge { padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .badge-high { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-med  { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .badge-low  { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
    .rec-type { font-weight: 600; font-size: 11px; color: #1e293b; }
    .rec-text { color: #475569; font-size: 11px; }
    .rec-code { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; font-family: monospace; font-size: 9.5px; color: #334155; margin-top: 6px; white-space: pre-wrap; word-break: break-all; }

    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px; }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="logo">
      <div class="logo-icon">S</div>
      <div class="logo-text">SEO <span>Copilot</span></div>
    </div>
    <div class="header-meta">
      <strong>${audit.pageTitle || 'Audit Report'}</strong>
      <a href="${audit.url}" style="color:#2563eb">${audit.url}</a><br/>
      ${new Date(audit.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      &nbsp;·&nbsp; ${audit.pageWordCount.toLocaleString()} words &nbsp;·&nbsp; crawled via ${audit.crawlMethod}
    </div>
  </div>

  <!-- Score Cards -->
  <div class="scores">
    <div class="score-card">
      <div class="score-value" style="color:${scoreColor(audit.seoScore)}">${audit.seoScore}</div>
      <div class="score-label">SEO Score</div>
    </div>
    <div class="score-card">
      <div class="score-value" style="color:${scoreColor(audit.aeoScore)}">${audit.aeoScore}</div>
      <div class="score-label">AEO Score</div>
    </div>
    <div class="score-card">
      <div class="score-value" style="color:${scoreColor(audit.geoScore)}">${audit.geoScore}</div>
      <div class="score-label">GEO Score</div>
    </div>
    <div class="score-card">
      <div class="score-value" style="color:${scoreColor(audit.overallScore)}">${audit.overallScore}</div>
      <div class="score-label">Overall</div>
      <div class="geo-badge" style="background:${scoreColor(audit.geoScore)}22;color:${scoreColor(audit.geoScore)};border:1px solid ${scoreColor(audit.geoScore)}44">
        GEO: ${audit.geoReadiness.toUpperCase()}
      </div>
    </div>
  </div>

  <!-- SEO Checks -->
  <div class="section">
    <div class="section-title">SEO Checks <span style="font-weight:400;color:#64748b">(${seoPassCount}/${audit.seoChecks.length} passed)</span></div>
    ${[...audit.seoChecks]
      .sort((a, b) => (a.passed === b.passed ? 0 : a.passed ? 1 : -1))
      .map((c) => `
      <div class="check-item ${c.passed ? 'check-pass' : c.severity === 'high' ? 'check-fail-high' : c.severity === 'medium' ? 'check-fail-med' : 'check-fail-low'}">
        <span class="check-icon">${c.passed ? '✅' : c.severity === 'high' ? '❌' : '⚠️'}</span>
        <div style="flex:1">
          <div class="check-name">${c.name}</div>
          <div class="check-msg">${c.message}${c.value ? ` — <em>${c.value.substring(0, 80)}</em>` : ''}</div>
        </div>
        <span class="check-weight">${c.weight}%</span>
      </div>
    `).join('')}
  </div>

  <!-- AEO Checks -->
  <div class="section">
    <div class="section-title">AEO Checks <span style="font-weight:400;color:#64748b">(${aeoPassCount}/${audit.aeoChecks.length} passed)</span></div>
    ${[...audit.aeoChecks]
      .sort((a, b) => (a.passed === b.passed ? 0 : a.passed ? 1 : -1))
      .map((c) => {
        const pct = c.maxPoints > 0 ? Math.round((c.earnedPoints / c.maxPoints) * 100) : 0;
        return `
      <div class="analyzer-item" style="background:${c.passed ? '#f0fdf4' : '#f8fafc'};border:1px solid ${c.passed ? '#bbf7d0' : '#e2e8f0'};border-radius:8px;margin-bottom:4px">
        <span class="check-icon">${c.passed ? '✅' : '❌'}</span>
        <div style="flex:1">
          <div class="check-name">${c.name} <span style="font-weight:400;color:#94a3b8">${c.earnedPoints}/${c.maxPoints} pts</span></div>
          <div class="bar-wrap"><div class="bar-fill" style="width:${pct}%"></div></div>
          <div class="check-msg">${c.details}</div>
        </div>
      </div>`;
      }).join('')}
  </div>

  <!-- GEO Checks -->
  <div class="section">
    <div class="section-title">GEO Checks <span style="font-weight:400;color:#64748b">(${geoPassCount}/${audit.geoChecks.length} passed)</span></div>
    ${[...audit.geoChecks]
      .sort((a, b) => (a.passed === b.passed ? 0 : a.passed ? 1 : -1))
      .map((c) => {
        const pct = c.maxPoints > 0 ? Math.round((c.earnedPoints / c.maxPoints) * 100) : 0;
        return `
      <div class="analyzer-item" style="background:${c.passed ? '#f0fdf4' : '#f8fafc'};border:1px solid ${c.passed ? '#bbf7d0' : '#e2e8f0'};border-radius:8px;margin-bottom:4px">
        <span class="check-icon">${c.passed ? '✅' : '❌'}</span>
        <div style="flex:1">
          <div class="check-name">${c.name} <span style="font-weight:400;color:#94a3b8">${c.earnedPoints}/${c.maxPoints} pts</span></div>
          <div class="bar-wrap"><div class="bar-fill" style="width:${pct}%;background:#059669"></div></div>
          <div class="check-msg">${c.details}</div>
        </div>
      </div>`;
      }).join('')}
  </div>

  <!-- AI Recommendations -->
  ${audit.recommendations.length > 0 ? `
  <div class="section">
    <div class="section-title">AI Recommendations <span style="font-weight:400;color:#64748b">(${audit.recommendations.length} suggestions)</span></div>
    ${[...audit.recommendations]
      .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]))
      .map((r) => `
      <div class="rec-item">
        <div class="rec-header">
          <span class="rec-badge ${r.severity === 'high' ? 'badge-high' : r.severity === 'medium' ? 'badge-med' : 'badge-low'}">${r.severity}</span>
          <span class="rec-type">${r.issueType}</span>
        </div>
        <div class="rec-text">${r.suggestion}</div>
        ${r.codeSnippet ? `<pre class="rec-code">${r.codeSnippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    Generated by SEO Copilot &nbsp;·&nbsp; ${new Date().toISOString()} &nbsp;·&nbsp; seo-copilot.com
  </div>
</div>
</body>
</html>`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    const filename = `seo-copilot-audit-${audit._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBuffer));
  } finally {
    await browser?.close();
  }
}
