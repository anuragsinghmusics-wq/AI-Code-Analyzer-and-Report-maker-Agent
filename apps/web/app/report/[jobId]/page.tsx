import { notFound } from 'next/navigation';
import { prisma } from '@code-analyzer/db';
import { PendingReport } from './pending-report';
import { InteractiveInterview } from '@/components/questions/InteractiveInterview';
import type { ReportCard } from '@code-analyzer/shared';

function gradeColor(grade: string): string {
  const g = grade?.charAt(0)?.toUpperCase() ?? 'F';
  if (g === 'A') return '#059669';
  if (g === 'B') return '#10b981';
  if (g === 'C') return '#d97706';
  if (g === 'D') return '#ea580c';
  return '#dc2626';
}

function gradeBgColor(grade: string): string {
  const g = grade?.charAt(0)?.toUpperCase() ?? 'F';
  if (g === 'A') return 'rgba(5, 150, 105, 0.1)';
  if (g === 'B') return 'rgba(16, 185, 129, 0.1)';
  if (g === 'C') return 'rgba(217, 119, 6, 0.1)';
  if (g === 'D') return 'rgba(234, 88, 12, 0.1)';
  return 'rgba(220, 38, 38, 0.1)';
}

function gradeLabel(grade: string): string {
  const g = grade?.charAt(0)?.toUpperCase() ?? 'F';
  if (g === 'A') return 'Excellent';
  if (g === 'B') return 'Good';
  if (g === 'C') return 'Average';
  if (g === 'D') return 'Below Average';
  return 'Poor';
}

function categoryIcon(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('arch')) return 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z';
  if (lower.includes('security') || lower.includes('bug')) return 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
  if (lower.includes('perf')) return 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
  if (lower.includes('maint')) return 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z';
  if (lower.includes('scal')) return 'M18 20V10M12 20V4M6 20v-6';
  if (lower.includes('error') || lower.includes('handling')) return 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z';
  if (lower.includes('quality') || lower.includes('code')) return 'M9 11l3 3L22 4';
  if (lower.includes('read')) return 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z';
  if (lower.includes('test')) return 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2 m-6 9l2 2 4-4';
  if (lower.includes('doc')) return 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8';
  return 'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z';
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(score / 10, 1) * circ;
  const color = gradeColor(grade);
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute text-center flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-900 leading-none">{score.toFixed(1)}</span>
        <span className="text-xs font-mono font-bold text-slate-400 mt-1">/10</span>
      </div>
    </div>
  );
}

export default async function ReportPage({ params }: { params: { jobId: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    include: {
      report: {
        include: {
          questions: true,
          interviewAttempts: true,
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  if (job.status === 'FAILED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-900 font-sans p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Analysis Failed</h2>
          <p className="text-xs text-slate-500 mb-6">{job.error || 'An unexpected error occurred during processing.'}</p>
          <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            Try Again
          </a>
        </div>
      </div>
    );
  }

  if (job.status !== 'COMPLETED' || !job.report) {
    return <PendingReport jobId={job.id} status={job.status} currentPhase={job.currentPhase} inputType={job.inputType} />;
  }

  const reportCard = job.report.reportCard as unknown as ReportCard;
  const questions = job.report.questions || [];
  let diagnosticQuestions: any[] = [];
  try { diagnosticQuestions = JSON.parse(job.report.diagnosticQuestions || '[]'); } catch {}

  const color = gradeColor(job.report.grade);
  const hasInterview = questions.length > 0;
  const hasDiagnostic = diagnosticQuestions.length > 0;

  // Deduce project name from job metadata
  const projectName = (job as any).metadata?.repoName || (job as any).fileName || 'Code Project';

  return (
    <div className="min-h-screen text-slate-900 font-sans bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) both}
        html{scroll-behavior:smooth}
      ` }} />

      {/* Ambient background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Sticky navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="px-6 h-14 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <span className="font-bold text-sm hidden sm:block text-slate-900">Deebug</span>
          </a>
          <nav className="hidden md:flex items-center gap-1 rounded-xl p-1 bg-slate-100 border border-slate-200">
            <a href="#score" className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 text-slate-600 hover:text-slate-900 hover:bg-white">Score</a>
            <a href="#categories" className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 text-slate-600 hover:text-slate-900 hover:bg-white">Categories</a>
            {hasInterview && <a href="#interview" className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 text-slate-600 hover:text-slate-900 hover:bg-white">Interview</a>}
            {hasDiagnostic && <a href="#diagnostic" className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 text-slate-600 hover:text-slate-900 hover:bg-white">Diagnostic</a>}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: gradeBgColor(job.report.grade), border: `1px solid ${color}40`, color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              {job.report.grade} - {job.report.overallScore.toFixed(1)}/10
            </span>
            <a href="/" className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-150 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Analysis
            </a>
          </div>
        </div>
      </header>

      <div className="relative z-10 px-6 py-6 max-w-6xl">

        {/* Page header */}
        <div className="mb-6 fade-up">
          <h1 className="text-2xl font-bold mb-1 text-slate-900">Code Analysis Report</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Project:</span>
            <span className="text-sm font-semibold text-emerald-700 font-mono">{projectName}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        {/* Overall score card */}
        <div id="score" className="rounded-2xl p-5 mb-5 fade-up relative overflow-hidden bg-white border border-slate-200 shadow-sm">
          {/* Scorecard badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Scored
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Score ring */}
            <div className="flex flex-col items-center">
              <p className="text-sm font-bold mb-3 text-slate-800">Overall Score</p>
              <ScoreRing score={job.report.overallScore} grade={job.report.grade} />
            </div>
            {/* Summary */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold text-slate-500">Overall Grade:</span>
                <span className="text-sm font-bold" style={{ color }}>{job.report.grade} - {gradeLabel(job.report.grade)}</span>
              </div>
              <p className="text-sm leading-relaxed mb-3 text-slate-600">{job.report.summary}</p>
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-[12px] font-mono text-emerald-700 font-semibold">Analysis Complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Composite Grade Breakdown (only if pitch was submitted) ─────── */}
        {job.report.pitchScore != null && job.report.compositeScore != null && (
          <div className="rounded-2xl p-5 mb-5 fade-up bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <h2 className="text-base font-bold text-slate-900">Final Grade Breakdown</h2>
              <span className="ml-auto text-[10px] font-mono text-slate-400 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-full">Developer Pitch submitted</span>
            </div>

            {/* Three grade columns */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Code Audit', score: job.report.overallScore, grade: job.report.grade, detail: 'Static analysis', weight: '65%' },
                { label: 'Dev Defense', score: job.report.pitchScore!, grade: job.report.pitchGrade!, detail: 'Verbal defense', weight: '35%' },
                { label: 'Final Composite', score: job.report.compositeScore!, grade: job.report.compositeGrade!, detail: 'Combined score', weight: '100%' },
              ].map(({ label, score, grade, detail, weight }) => {
                const gc = gradeColor(grade);
                const gc_bg = gradeBgColor(grade);
                const isComposite = weight === '100%';
                return (
                  <div
                    key={label}
                    className={`rounded-xl p-4 text-center border ${isComposite ? 'border-emerald-200' : 'border-slate-200'}`}
                    style={{ background: isComposite ? gc_bg : '#fafafa' }}
                  >
                    <p className="text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-widest">{label}</p>
                    <p className="text-3xl font-black mb-1" style={{ color: gc }}>{grade}</p>
                    <p className="text-[13px] font-bold text-slate-700">{score.toFixed(1)}<span className="text-slate-400 text-[11px]">/10</span></p>
                    <div className="mt-2 flex items-center justify-center gap-1.5">
                      <span className="text-[9px] text-slate-400 font-mono">{detail}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[9px] font-bold" style={{ color: gc }}>{weight}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bars */}
            <div className="space-y-2 mb-4">
              {[
                { label: 'Code Audit Score', score: job.report.overallScore, grade: job.report.grade },
                { label: 'Defense Score', score: job.report.pitchScore!, grade: job.report.pitchGrade! },
              ].map(({ label, score, grade }) => {
                const gc = gradeColor(grade);
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-slate-600 w-32 shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(score / 10) * 100}%`, backgroundColor: gc }} />
                    </div>
                    <span className="text-[11px] font-bold w-8 text-right" style={{ color: gc }}>{score.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>

            {/* Evaluator feedback */}
            {job.report.pitchFeedback && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1.5">Developer Defense Feedback</p>
                <p className="text-[13px] text-slate-700 leading-relaxed">{job.report.pitchFeedback}</p>
              </div>
            )}
          </div>
        )}

        {/* Two column: Report Card + Detected Bugs */}

        {reportCard.categoryScores && reportCard.categoryScores.length > 0 && (
          <div id="categories" className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 fade-up">

            {/* Report Card */}
            <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Report Card</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {reportCard.categoryScores.map((cat) => {
                  const catColor = gradeColor(cat.grade);
                  const barPct = Math.min((cat.score / 10) * 100, 100);
                  const iconPath = categoryIcon(cat.category);
                  return (
                    <div key={cat.category} className="px-5 py-3.5 flex items-center gap-3 group hover:bg-slate-50 transition-all duration-150">
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${catColor}15`, border: `1px solid ${catColor}30` }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={catColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={iconPath}/>
                        </svg>
                      </div>
                      {/* Name + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-semibold text-slate-800">
                            {cat.category}: <span style={{ color: catColor }}>{cat.score.toFixed(1)}/10</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden mb-1 bg-slate-100">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barPct}%`, backgroundColor: catColor }} />
                        </div>
                        <p className="text-[10px] font-mono text-slate-400">
                          Sub-score | {cat.score.toFixed(1)}/10 | {cat.grade}-score
                        </p>
                      </div>
                      {/* Grade badge */}
                      <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-white shadow-sm" style={{ background: catColor }}>
                        {cat.grade.length > 2 ? cat.grade.slice(0, 2) : cat.grade}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detected Bugs / Issues */}
            <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
              <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Detected Bugs</h2>
                <button className="w-6 h-6 flex items-center justify-center rounded text-slate-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {(reportCard.improvements || []).slice(0, 6).map((imp, i: number) => {
                    const priority: string = (imp as any).priority || 'low';
                    const issueColor = priority === 'critical' ? '#dc2626' : priority === 'high' ? '#ea580c' : priority === 'medium' ? '#d97706' : '#059669';
                    const tagLabel = priority.charAt(0).toUpperCase() + priority.slice(1) + ' ' + ((imp as any).category || 'Issue');
                    return (
                      <div key={i} className="px-5 py-3.5 flex items-start gap-3 group hover:bg-slate-50 transition-all duration-150 cursor-pointer">
                        <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={issueColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] leading-snug mb-1.5 text-slate-800 font-medium">{imp.title}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: `${issueColor}15`, color: issueColor }}>
                              {tagLabel}
                            </span>
                            {(imp as any).effort && <span className="text-[10px] font-mono text-slate-400">Effort: {(imp as any).effort}</span>}
                          </div>
                        </div>
                        <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    );
                  })}
                {(!reportCard.improvements || reportCard.improvements.length === 0) && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-slate-600">No specific improvement areas were detected.</p>
                    <p className="text-xs mt-1 text-slate-400">Your code looks clean!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Score Reasoning */}
        {reportCard.categoryScores && reportCard.categoryScores.some(c => c.scoreReasoning) && (
          <div className="mb-5 fade-up">
            <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Score Reasoning</h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportCard.categoryScores.filter(c => c.scoreReasoning).map(cat => {
                  const catColor = gradeColor(cat.grade);
                  return (
                    <div key={cat.category} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold" style={{ color: catColor }}>{cat.category}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold" style={{ background: `${catColor}15`, color: catColor }}>{cat.grade}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600">{cat.scoreReasoning}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Interview */}
        {hasInterview && (
          <section id="interview" className="mb-5 fade-up">
            <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Interactive Technical Interview</h2>
                <p className="text-[11px] mt-0.5 text-slate-500">{questions.length} AI-generated questions based on your code</p>
              </div>
              <div className="p-5">
                <InteractiveInterview questions={questions} reportId={job.report.id} />
              </div>
            </div>
          </section>
        )}

        {/* Diagnostic Questions */}
        {hasDiagnostic && (
          <section id="diagnostic" className="mb-5 fade-up">
            <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Diagnostic Questions</h2>
                <p className="text-[11px] mt-0.5 text-slate-500">{diagnosticQuestions.length} diagnostic MCQs</p>
              </div>
              <div className="p-5 space-y-4">
                {diagnosticQuestions.map((q: any, i: number) => (
                  <div key={q.id || i} className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex flex-wrap gap-2 items-center mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">Q{i + 1}</span>
                      {q.phaseSource && <span className="text-xs px-2 py-1 rounded-lg bg-white text-slate-600 border border-slate-200 font-mono">{q.phaseSource}</span>}
                    </div>
                    <p className="text-sm font-medium leading-relaxed mb-3 text-slate-800">{q.stem}</p>
                    {q.codeEvidence && (
                      <div className="p-3 rounded-xl font-mono text-xs mb-3 whitespace-pre-wrap bg-white border border-slate-200 text-slate-700">
                        <div className="mb-1 text-slate-400 font-bold">{q.codeEvidence.file} - Lines {q.codeEvidence.lineRange?.[0]}--{q.codeEvidence.lineRange?.[1]}</div>
                        {q.codeEvidence.snippet}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options?.map((opt: any) => (
                        <div key={opt.id} className="p-3 rounded-xl text-sm transition-all duration-200 border border-slate-200 bg-white text-slate-700">
                          <span className="font-bold mr-2 text-slate-400">{opt.id}.</span>{opt.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <div className="text-center py-8 fade-up border-t border-slate-200">
          <p className="text-sm mb-4 text-slate-500">Want to analyze another codebase?</p>
          <a href="/" className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all duration-150 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Start New Analysis
          </a>
        </div>
      </div>
    </div>
  );
}
