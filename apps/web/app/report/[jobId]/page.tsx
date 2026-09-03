import { notFound } from 'next/navigation';
import { prisma } from '@code-analyzer/db';
import { PendingReport } from './pending-report';
import { InteractiveInterview } from '@/components/questions/InteractiveInterview';
import type { ReportCard } from '@code-analyzer/shared';

function gradeColor(grade: string): string {
  const g = grade?.charAt(0)?.toUpperCase() ?? 'F';
  if (g === 'A') return '#22c55e';
  if (g === 'B') return '#3b82f6';
  if (g === 'C') return '#f59e0b';
  if (g === 'D') return '#f97316';
  return '#ef4444';
}

function gradeBgColor(grade: string): string {
  const g = grade?.charAt(0)?.toUpperCase() ?? 'F';
  if (g === 'A') return 'rgba(34,197,94,0.15)';
  if (g === 'B') return 'rgba(59,130,246,0.15)';
  if (g === 'C') return 'rgba(245,158,11,0.15)';
  if (g === 'D') return 'rgba(249,115,22,0.15)';
  return 'rgba(239,68,68,0.15)';
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
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 10px ${color}88)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-black tabular-nums leading-none" style={{ color: '#e8e8f0' }}>{score.toFixed(1)}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color }}>/10</span>
      </div>
    </div>
  );
}

export default async function ReportPage({ params }: { params: { jobId: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    include: { report: { include: { questions: true } } },
  });

  if (!job) notFound();

  if (job.status === 'FAILED') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-white" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-md p-6 rounded-2xl" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#f87171' }}>Analysis Failed</h1>
          <p className="text-sm" style={{ color: '#9090b0' }}>{job.error || 'An unknown error occurred during code analysis.'}</p>
          <a href="/" className="mt-4 inline-flex items-center gap-2 text-sm transition-colors" style={{ color: '#a78bfa' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Try Again
          </a>
        </div>
      </div>
    );
  }

  if (job.status === 'CANCELLED') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-white" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-md p-6 rounded-2xl" style={{ border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#fbbf24' }}>Analysis Stopped</h1>
          <p className="text-sm mb-4" style={{ color: '#9090b0' }}>You manually aborted this analysis job. No report was generated.</p>
          <a href="/" className="inline-flex items-center gap-2 text-sm" style={{ color: '#a78bfa' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Start New Analysis
          </a>
        </div>
      </div>
    );
  }

  if (job.status === 'COMPLETED' && !job.report) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-white" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-md p-6 rounded-2xl" style={{ border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#fbbf24' }}>Report Unavailable</h1>
          <p className="text-sm" style={{ color: '#9090b0' }}>The job completed but no report was generated.</p>
          <a href="/" className="mt-4 inline-flex items-center gap-2 text-sm" style={{ color: '#a78bfa' }}>Back to Home</a>
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
    <div className="min-h-screen text-white font-sans" style={{ background: 'var(--bg-base)' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) both}
        html{scroll-behavior:smooth}
      ` }} />

      {/* Ambient background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full" style={{ background: 'rgba(124,58,237,0.07)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full" style={{ background: 'rgba(6,182,212,0.05)', filter: 'blur(120px)' }} />
      </div>

      {/* Sticky navbar */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(15,15,28,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <div className="px-6 h-14 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow: '0 0 10px rgba(124,58,237,0.4)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <span className="font-bold text-sm hidden sm:block" style={{ color: '#e8e8f0' }}>Deebug</span>
          </a>
          <nav className="hidden md:flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <a href="#score" className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200" style={{ color: '#9090b0' }}>Score</a>
            <a href="#categories" className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200" style={{ color: '#9090b0' }}>Categories</a>
            {hasInterview && <a href="#interview" className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200" style={{ color: '#9090b0' }}>Interview</a>}
            {hasDiagnostic && <a href="#diagnostic" className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200" style={{ color: '#9090b0' }}>Diagnostic</a>}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: gradeBgColor(job.report.grade), border: `1px solid ${color}35`, color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              {job.report.grade} - {job.report.overallScore.toFixed(1)}/10
            </span>
            <a href="/" className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Analysis
            </a>
          </div>
        </div>
      </header>

      <div className="relative z-10 px-6 py-6 max-w-6xl">

        {/* Page header */}
        <div className="mb-6 fade-up">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#e8e8f0' }}>Code Analysis Report</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: '#9090b0' }}>Project:</span>
            <span className="text-sm font-semibold" style={{ color: '#a78bfa' }}>{projectName}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#50507a" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        {/* Overall score card */}
        <div id="score" className="rounded-2xl p-5 mb-5 fade-up relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Scorcard badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Scored
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Score ring */}
            <div className="flex flex-col items-center">
              <p className="text-sm font-bold mb-3" style={{ color: '#e8e8f0' }}>Overall Score</p>
              <ScoreRing score={job.report.overallScore} grade={job.report.grade} />
            </div>
            {/* Summary */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold" style={{ color: '#9090b0' }}>Overall Grade:</span>
                <span className="text-sm font-bold" style={{ color }}>{job.report.grade} - {gradeLabel(job.report.grade)}</span>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: '#9090b0' }}>{job.report.summary}</p>
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-[12px] font-mono" style={{ color: '#22c55e' }}>Analysis Complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two column: Report Card + Detected Bugs */}
        {reportCard.categoryScores && reportCard.categoryScores.length > 0 && (
          <div id="categories" className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 fade-up">

            {/* Report Card */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-base font-bold" style={{ color: '#e8e8f0' }}>Report Card</h2>
              </div>
              <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
                {reportCard.categoryScores.map((cat) => {
                  const catColor = gradeColor(cat.grade);
                  const barPct = Math.min((cat.score / 10) * 100, 100);
                  const iconPath = categoryIcon(cat.category);
                  return (
                    <div key={cat.category} className="px-5 py-3.5 flex items-center gap-3 group hover:bg-white/[0.02] transition-all duration-150" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${catColor}18`, border: `1px solid ${catColor}30` }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={catColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={iconPath}/>
                        </svg>
                      </div>
                      {/* Name + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-semibold" style={{ color: '#e8e8f0' }}>
                            {cat.category}: <span style={{ color: catColor }}>{cat.score.toFixed(1)}/10</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barPct}%`, backgroundColor: catColor, boxShadow: `0 0 6px ${catColor}60` }} />
                        </div>
                        <p className="text-[10px] font-mono" style={{ color: '#50507a' }}>
                          Sub-score | {cat.score.toFixed(1)}/10 | {cat.grade}-score
                        </p>
                      </div>
                      {/* Grade badge */}
                      <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm" style={{ background: catColor, color: '#fff', boxShadow: `0 0 10px ${catColor}60` }}>
                        {cat.grade.length > 2 ? cat.grade.slice(0, 2) : cat.grade}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detected Bugs / Issues */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-base font-bold" style={{ color: '#e8e8f0' }}>Detected Bugs</h2>
                <button className="w-6 h-6 flex items-center justify-center rounded" style={{ color: '#9090b0' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                </button>
              </div>
                            <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
                {(reportCard.improvements || []).slice(0, 6).map((imp, i: number) => {
                    const priority: string = (imp as any).priority || 'low';
                    const issueColor = priority === 'critical' ? '#ef4444' : priority === 'high' ? '#f97316' : priority === 'medium' ? '#f59e0b' : '#22c55e';
                    const tagLabel = priority.charAt(0).toUpperCase() + priority.slice(1) + ' ' + ((imp as any).category || 'Issue');
                    return (
                      <div key={i} className="px-5 py-3.5 flex items-start gap-3 group hover:bg-white/[0.02] transition-all duration-150 cursor-pointer" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={issueColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] leading-snug mb-1.5" style={{ color: '#e8e8f0' }}>{imp.title}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: `${issueColor}18`, color: issueColor }}>
                              {tagLabel}
                            </span>
                            {(imp as any).effort && <span className="text-[10px] font-mono" style={{ color: '#50507a' }}>Effort: {(imp as any).effort}</span>}
                          </div>
                        </div>
                        <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#50507a" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    );
                  })}
                {(!reportCard.improvements || reportCard.improvements.length === 0) && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm" style={{ color: '#9090b0' }}>No specific improvement areas were detected.</p>
                    <p className="text-xs mt-1" style={{ color: '#50507a' }}>Your code looks clean!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Score Reasoning */}
        {reportCard.categoryScores && reportCard.categoryScores.some(c => c.scoreReasoning) && (
          <div className="mb-5 fade-up">
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-base font-bold" style={{ color: '#e8e8f0' }}>Score Reasoning</h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportCard.categoryScores.filter(c => c.scoreReasoning).map(cat => {
                  const catColor = gradeColor(cat.grade);
                  return (
                    <div key={cat.category} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold" style={{ color: catColor }}>{cat.category}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${catColor}15`, color: catColor }}>{cat.grade}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#9090b0' }}>{cat.scoreReasoning}</p>
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
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-base font-bold" style={{ color: '#e8e8f0' }}>Interactive Technical Interview</h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#9090b0' }}>{questions.length} AI-generated questions based on your code</p>
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
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-base font-bold" style={{ color: '#e8e8f0' }}>Diagnostic Questions</h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#9090b0' }}>{diagnosticQuestions.length} diagnostic MCQs</p>
              </div>
              <div className="p-5 space-y-4">
                {diagnosticQuestions.map((q: any, i: number) => (
                  <div key={q.id || i} className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex flex-wrap gap-2 items-center mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>Q{i + 1}</span>
                      {q.phaseSource && <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: '#9090b0', border: '1px solid rgba(255,255,255,0.08)' }}>{q.phaseSource}</span>}
                    </div>
                    <p className="text-sm font-medium leading-relaxed mb-3" style={{ color: '#e8e8f0' }}>{q.stem}</p>
                    {q.codeEvidence && (
                      <div className="p-3 rounded-xl font-mono text-xs mb-3 whitespace-pre-wrap" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', color: '#9090b0' }}>
                        <div className="mb-1" style={{ color: '#50507a' }}>{q.codeEvidence.file} - Lines {q.codeEvidence.lineRange?.[0]}--{q.codeEvidence.lineRange?.[1]}</div>
                        {q.codeEvidence.snippet}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options?.map((opt: any) => (
                        <div key={opt.id} className="p-3 rounded-xl text-sm transition-all duration-200" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: '#9090b0' }}>
                          <span className="font-bold mr-2" style={{ color: '#50507a' }}>{opt.id}.</span>{opt.text}
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
        <div className="text-center py-8 fade-up" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-sm mb-4" style={{ color: '#50507a' }}>Want to analyze another codebase?</p>
          <a href="/" className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm text-white transition-all duration-200" style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow: '0 0 24px rgba(124,58,237,0.35)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Start New Analysis
          </a>
        </div>
      </div>
    </div>
  );
}
