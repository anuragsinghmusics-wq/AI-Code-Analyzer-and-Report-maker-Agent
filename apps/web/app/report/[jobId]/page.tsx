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

function gradeLabel(grade: string): string {
  const g = grade?.charAt(0)?.toUpperCase() ?? 'F';
  if (g === 'A') return 'Excellent';
  if (g === 'B') return 'Good';
  if (g === 'C') return 'Average';
  if (g === 'D') return 'Below Average';
  return 'Poor';
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
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-black tabular-nums text-white leading-none">{score.toFixed(1)}</span>
        <span className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color }}>{grade}</span>
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505] text-white">
        <div className="max-w-md p-6 border border-red-900/60 bg-red-900/10 rounded-2xl backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h1 className="text-xl font-bold text-red-400 mb-2">Analysis Failed</h1>
          <p className="text-sm text-white/50">{job.error || 'An unknown error occurred during code analysis.'}</p>
          <a href="/" className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Try Again
          </a>
        </div>
      </div>
    );
  }

  if (job.status === 'CANCELLED') {
    const elapsed = job.completedAt && job.createdAt
      ? Math.round((new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()) / 1000)
      : null;
    const elapsedStr = elapsed !== null
      ? `${String(Math.floor(elapsed / 60)).padStart(2,'0')}:${String(elapsed % 60).padStart(2,'0')}`
      : null;

    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">

        {/* Animated background */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes blob { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-50px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.9)} 100%{transform:translate(0,0) scale(1)} }
          .blob { animation: blob 9s infinite; }
          .blob-d3 { animation-delay: 3s; }
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .fu { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
          .fu-1 { animation-delay: 0.1s; }
          .fu-2 { animation-delay: 0.2s; }
          .fu-3 { animation-delay: 0.3s; }
          @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.08);opacity:0.15} }
          .pulse-ring { animation: pulse-ring 3s ease-in-out infinite; }
        ` }} />

        {/* Background blobs */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="blob absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[130px] rounded-full" />
          <div className="blob blob-d3 absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-orange-900/10 blur-[130px] rounded-full" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_50%,transparent_100%)] opacity-30" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-lg text-center">

          {/* Icon */}
          <div className="fu flex justify-center mb-8">
            <div className="relative">
              {/* Pulse rings */}
              <div className="pulse-ring absolute inset-[-12px] rounded-full border border-red-500/20" />
              <div className="pulse-ring absolute inset-[-24px] rounded-full border border-red-500/10" style={{ animationDelay: '0.5s' }} />
              {/* Icon container */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-900/60 to-red-950/80 border border-red-800/40 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.12)]">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="fu fu-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/8 border border-red-500/15 text-red-400/80 text-[11px] font-semibold tracking-widest uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
              Analysis Terminated
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-3 leading-tight">
              Analysis Stopped
            </h1>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm mx-auto">
              You manually aborted this analysis job. No report was generated. Your code was never stored — it was discarded immediately.
            </p>
          </div>

          {/* Stats row */}
          {elapsedStr && (
            <div className="fu fu-2 mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4">
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Time Elapsed</p>
                <p className="text-xl font-bold text-white font-mono">{elapsedStr}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4">
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Status</p>
                <p className="text-xl font-bold text-red-400">Cancelled</p>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="fu fu-3 mt-8 flex flex-col sm:flex-row items-center gap-3">
            <a
              href="/"
              className="flex-1 w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_32px_rgba(59,130,246,0.25)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Start New Analysis
            </a>
            <a
              href="/"
              className="flex-1 w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.07] hover:border-white/[0.12] hover:-translate-y-0.5 transition-all duration-300"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Back to Home
            </a>
          </div>

          {/* Footer note */}
          <p className="fu fu-3 mt-8 text-[11px] text-white/20 font-mono">
            Job ID: {job.id.slice(0, 16)}... · Cancelled at {job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : '—'}
          </p>
        </div>
      </div>
    );
  }

  if (job.status === 'COMPLETED' && !job.report) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505] text-white">
        <div className="max-w-md p-6 border border-amber-900/60 bg-amber-900/10 rounded-2xl backdrop-blur-xl">
          <h1 className="text-xl font-bold text-amber-400 mb-2">Report Unavailable</h1>
          <p className="text-sm text-white/50">The job completed but no report was generated due to internal pipeline errors.</p>
          <a href="/" className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Home
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

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes blob { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-50px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.9)} 100%{transform:translate(0,0) scale(1)} }
        .animate-blob { animation: blob 9s infinite; }
        .delay-3 { animation-delay: 3s; }
        .delay-6 { animation-delay: 6s; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
      ` }} />

      {/* ── Fixed background ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-blob" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-purple-600/10 blur-[120px] rounded-full animate-blob delay-3" />
        <div className="absolute top-[50%] left-[40%] w-[30%] h-[30%] bg-cyan-500/7 blur-[100px] rounded-full animate-blob delay-6" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.014)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_50%,transparent_100%)] opacity-40" />
      </div>

      {/* ── STICKY TOP NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <a href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <span className="font-bold text-sm text-white/80 group-hover:text-white transition-colors hidden sm:block">Deebug</span>
          </a>

          {/* Section nav pills */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
            <a href="#score" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-200">Score</a>
            <a href="#categories" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-200">Categories</a>
            {hasInterview && <a href="#interview" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-200">Interview</a>}
            {hasDiagnostic && <a href="#diagnostic" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-200">Diagnostic</a>}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Grade pill */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border" style={{ backgroundColor: `${color}15`, borderColor: `${color}35`, color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              {job.report.grade} · {job.report.overallScore.toFixed(1)}/10
            </span>
            {/* New Analysis button */}
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_28px_rgba(59,130,246,0.4)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Analysis
            </a>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 space-y-10">

        {/* ── HERO HEADER ── */}
        <div className="fade-up text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Analysis Complete
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Code Analysis Report</h1>
          <p className="text-white/25 text-xs font-mono">Job ID: {job.id.slice(0, 16)}…</p>
        </div>

        {/* ── SCORE HERO ── */}
        <div id="score" className="fade-up rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl overflow-hidden shadow-2xl" style={{ animationDelay: '0.1s' }}>
          <div className="grid md:grid-cols-2 items-center divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
            {/* Ring */}
            <div className="flex flex-col items-center justify-center p-10 gap-4">
              <ScoreRing score={job.report.overallScore} grade={job.report.grade} />
              <div className="text-center space-y-0.5">
                <div className="text-sm font-bold" style={{ color }}>{gradeLabel(job.report.grade)}</div>
                <div className="text-xs text-white/30 font-mono">{job.report.overallScore.toFixed(1)} / 10.0</div>
              </div>
            </div>
            {/* Summary */}
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Executive Rationale</span>
              </div>
              <p className="text-sm text-white/65 leading-relaxed">{job.report.summary}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ backgroundColor: `${color}18`, borderColor: `${color}40`, color }}>
                  Grade: {job.report.grade}
                </span>
                <span className="px-3 py-1.5 rounded-xl text-xs font-mono text-white/35 bg-white/5 border border-white/8">
                  {job.id.slice(0, 12)}…
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CATEGORY BREAKDOWN ── */}
        {reportCard.categoryScores && reportCard.categoryScores.length > 0 && (
          <section id="categories" className="fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-px h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Category Breakdown</h2>
              <span className="text-xs text-white/30 font-mono">{reportCard.categoryScores.length} categories</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportCard.categoryScores.map((cat, idx) => {
                const catColor = gradeColor(cat.grade);
                const barPct = Math.min((cat.score / 10) * 100, 100);
                return (
                  <div
                    key={cat.category}
                    className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-xl p-5 flex flex-col gap-3 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-sm text-white leading-tight">{cat.category}</span>
                      <span className="shrink-0 font-mono text-xs font-bold px-2.5 py-1 rounded-lg border" style={{ backgroundColor: `${catColor}15`, borderColor: `${catColor}35`, color: catColor }}>
                        {cat.score.toFixed(1)} · {cat.grade}
                      </span>
                    </div>
                    {/* Bar */}
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barPct}%`, backgroundColor: catColor, boxShadow: `0 0 8px ${catColor}55` }} />
                    </div>
                    {cat.scoreReasoning && (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-200/75 leading-relaxed">
                        <span className="font-bold text-amber-400/90 block mb-1 flex items-center gap-1.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          Scoring Rationale
                        </span>
                        {cat.scoreReasoning}
                      </div>
                    )}
                    {cat.analysis && <p className="text-xs text-white/45 leading-relaxed">{cat.analysis}</p>}
                    {cat.improvement && (
                      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-xs text-blue-200/75 leading-relaxed">
                        <span className="font-bold text-blue-400/90 block mb-1 flex items-center gap-1.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                          Improvement Required
                        </span>
                        {cat.improvement}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── INTERACTIVE INTERVIEW ── */}
        {hasInterview && (
          <section id="interview" className="fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-px h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Interactive Technical Interview</h2>
              <span className="text-xs text-white/30 font-mono">{questions.length} questions</span>
            </div>
            <InteractiveInterview questions={questions} reportId={job.report.id} />
          </section>
        )}

        {/* ── DIAGNOSTIC QUESTIONS ── */}
        {hasDiagnostic && (
          <section id="diagnostic" className="fade-up" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-px h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Diagnostic Questions</h2>
              <span className="text-xs text-white/30 font-mono">{diagnosticQuestions.length} questions</span>
            </div>
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl overflow-hidden shadow-xl">
              <div className="p-6 space-y-5">
                {diagnosticQuestions.map((q: any, i: number) => (
                  <div key={q.id || i} className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] space-y-3 hover:border-white/[0.12] transition-all duration-200">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">Q{i + 1}</span>
                      {q.phaseSource && <span className="text-xs px-2 py-1 rounded-lg bg-white/5 text-white/35 border border-white/8">{q.phaseSource}</span>}
                    </div>
                    <p className="text-sm font-medium text-white/80 leading-relaxed">{q.stem}</p>
                    {q.codeEvidence && (
                      <div className="p-3 bg-black/50 rounded-xl border border-white/8 font-mono text-xs text-white/40 whitespace-pre-wrap">
                        <div className="text-white/25 mb-1">{q.codeEvidence.file} · Lines {q.codeEvidence.lineRange?.[0]}–{q.codeEvidence.lineRange?.[1]}</div>
                        {q.codeEvidence.snippet}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {q.options?.map((opt: any) => (
                        <div key={opt.id} className="p-3 rounded-xl border border-white/8 bg-white/[0.02] text-sm text-white/55 hover:border-white/18 hover:text-white/75 transition-all duration-200">
                          <span className="font-bold text-white/30 mr-2">{opt.id}.</span>{opt.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER CTA ── */}
        <div className="fade-up text-center py-8 border-t border-white/[0.05]" style={{ animationDelay: '0.4s' }}>
          <p className="text-white/25 text-sm mb-4">Want to analyze another codebase?</p>
          <a
            href="/"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_32px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.45)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Start New Analysis
          </a>
        </div>
      </div>
    </div>
  );
}
