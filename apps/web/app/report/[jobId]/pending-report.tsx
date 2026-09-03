"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const STEPS_FILE = [
  { id: 'ingest',       label: 'Ingesting Files',              detail: 'Loading your file into the analysis engine...', color: 'from-violet-500 to-blue-500'   },
  { id: 'parse',        label: 'Parsing AST',                  detail: 'Building abstract syntax tree...',              color: 'from-blue-500 to-cyan-500'     },
  { id: 'file',         label: 'File Analysis',                detail: 'Analyzing responsibilities and purpose...',      color: 'from-cyan-500 to-teal-500'     },
  { id: 'architecture', label: 'Architecture Analysis',        detail: 'Detecting design patterns...',                  color: 'from-teal-500 to-emerald-500'  },
  { id: 'dataflow',     label: 'Data Flow Analysis',           detail: 'Tracing state mutations...',                    color: 'from-emerald-500 to-green-500' },
  { id: 'logic',        label: 'Logic Review',                 detail: 'Checking algorithm complexity...',              color: 'from-green-500 to-lime-500'    },
  { id: 'quality',      label: 'Quality Review',               detail: 'Scoring across quality dimensions...',          color: 'from-lime-500 to-yellow-500'   },
  { id: 'bug',          label: 'Bug Hunting',                  detail: 'Finding vulnerabilities and anti-patterns...',  color: 'from-yellow-500 to-amber-500'  },
  { id: 'performance',  label: 'Performance Analysis',         detail: 'Identifying bottlenecks...',                    color: 'from-amber-500 to-orange-500'  },
  { id: 'design',       label: 'Design Analysis',              detail: 'Evaluating SOLID principles...',                color: 'from-orange-500 to-red-500'    },
  { id: 'question-gen', label: 'Generating Interview Q+A',     detail: 'Creating contextual questions...',              color: 'from-red-500 to-rose-500'      },
  { id: 'report',       label: 'Compiling Report Card',        detail: 'Scoring and formatting results...',             color: 'from-rose-500 to-purple-500'   },
];

const STEPS_ZIP = [
  { id: 'ingest',       label: 'Extracting Archive',           detail: 'Unzipping and scanning file tree...',           color: 'from-violet-500 to-purple-500' },
  { id: 'parse',        label: 'Mapping Project Structure',    detail: 'Resolving modules and entry points...',         color: 'from-blue-500 to-cyan-500'     },
  { id: 'file',         label: 'File-by-File Analysis',        detail: 'Analyzing responsibilities per file...',        color: 'from-cyan-500 to-teal-500'     },
  { id: 'architecture', label: 'Architecture Analysis',        detail: 'Detecting architectural patterns...',           color: 'from-teal-500 to-emerald-500'  },
  { id: 'dataflow',     label: 'Data Flow Analysis',           detail: 'Tracing state mutations across files...',       color: 'from-emerald-500 to-green-500' },
  { id: 'logic',        label: 'Logic Review',                 detail: 'Checking algorithm complexity...',              color: 'from-green-500 to-lime-500'    },
  { id: 'quality',      label: 'Quality Review',               detail: 'Scoring across quality dimensions...',          color: 'from-lime-500 to-yellow-500'   },
  { id: 'bug',          label: 'Bug Hunting',                  detail: 'Finding vulnerabilities and anti-patterns...',  color: 'from-yellow-500 to-amber-500'  },
  { id: 'performance',  label: 'Performance Analysis',         detail: 'Identifying bottlenecks...',                    color: 'from-amber-500 to-orange-500'  },
  { id: 'design',       label: 'Design Analysis',              detail: 'Evaluating SOLID principles...',                color: 'from-orange-500 to-red-500'    },
  { id: 'question-gen', label: 'Generating Interview Q+A',     detail: 'Creating contextual questions...',              color: 'from-red-500 to-rose-500'      },
  { id: 'report',       label: 'Compiling Report Card',        detail: 'Scoring and formatting results...',             color: 'from-rose-500 to-purple-500'   },
];

const STEPS_REPO = [
  { id: 'clone',        label: 'Cloning Repository',           detail: 'Fetching source code from remote...',           color: 'from-violet-500 to-purple-500' },
  { id: 'ingest',       label: 'Indexing Files',               detail: 'Walking file tree, filtering relevant code...',  color: 'from-purple-500 to-blue-500'   },
  { id: 'parse',        label: 'Parsing Project Structure',    detail: 'Building module dependency graph...',            color: 'from-blue-500 to-cyan-500'     },
  { id: 'file',         label: 'File-by-File Analysis',        detail: 'Analyzing responsibilities per file...',         color: 'from-cyan-500 to-teal-500'     },
  { id: 'architecture', label: 'Architecture Analysis',        detail: 'Detecting architectural patterns...',            color: 'from-teal-500 to-emerald-500'  },
  { id: 'dataflow',     label: 'Data Flow Analysis',           detail: 'Tracing state mutations across modules...',      color: 'from-emerald-500 to-green-500' },
  { id: 'logic',        label: 'Logic Review',                 detail: 'Checking algorithm complexity...',               color: 'from-green-500 to-lime-500'    },
  { id: 'quality',      label: 'Quality Review',               detail: 'Scoring across quality dimensions...',           color: 'from-lime-500 to-yellow-500'   },
  { id: 'bug',          label: 'Bug Hunting',                  detail: 'Finding vulnerabilities and anti-patterns...',   color: 'from-yellow-500 to-amber-500'  },
  { id: 'performance',  label: 'Performance Analysis',         detail: 'Identifying bottlenecks...',                     color: 'from-amber-500 to-orange-500'  },
  { id: 'design',       label: 'Design Analysis',              detail: 'Evaluating SOLID principles...',                 color: 'from-orange-500 to-red-500'    },
  { id: 'question-gen', label: 'Generating Interview Q+A',     detail: 'Creating contextual questions...',               color: 'from-red-500 to-rose-500'      },
  { id: 'report',       label: 'Compiling Report Card',        detail: 'Scoring and formatting results...',              color: 'from-rose-500 to-purple-500'   },
];

function getSteps(inputType?: string | null) {
  const t = (inputType ?? '').toUpperCase();
  if (t === 'REPO') return STEPS_REPO;
  if (t === 'ZIP')  return STEPS_ZIP;
  return STEPS_FILE;
}

function getInputLabel(inputType?: string | null) {
  const t = (inputType ?? '').toUpperCase();
  if (t === 'REPO') return 'Repository';
  if (t === 'ZIP')  return 'ZIP Archive';
  return 'File';
}

const INTERVIEW_QUESTIONS = [
  {
    id: 'q1', tag: 'Design Decision',
    question: 'What was the most challenging technical decision or trade-off you made in this project?',
    placeholder: "e.g. I chose X over Y because the team needed Z, but it cost us performance in...",
    color: 'from-blue-500 to-cyan-500', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/5',
    tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'q2', tag: 'Self Awareness',
    question: 'If you had 1 more week, what would you refactor or improve first and why?',
    placeholder: "e.g. The auth module has tight coupling I'd extract into a separate service...",
    color: 'from-purple-500 to-pink-500', borderColor: 'border-purple-500/30', bgColor: 'bg-purple-500/5',
    tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'q3', tag: 'Pride + Craft',
    question: 'Which part of this codebase are you most proud of, and what makes it stand out?',
    placeholder: "e.g. The event-driven pipeline in src/pipeline/ handles retries and state cleanly...",
    color: 'from-amber-500 to-orange-500', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/5',
    tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
];

function InterviewPanel({ jobDone, onAllAnswered }: { jobDone: boolean; onAllAnswered: () => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [submitted, setSubmitted] = useState(false);
  const [animatingNext, setAnimatingNext] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (textareaRef.current && !submitted) textareaRef.current.focus(); }, [currentQ, submitted]);

  const advance = () => {
    if (animatingNext) return;
    setAnimatingNext(true);
    setTimeout(() => {
      if (currentQ < INTERVIEW_QUESTIONS.length - 1) { setCurrentQ(q => q + 1); }
      else { setSubmitted(true); onAllAnswered(); }
      setAnimatingNext(false);
    }, 280);
  };

  const q = INTERVIEW_QUESTIONS[currentQ];
  const currentAnswer = answers[currentQ];
  const hasEnoughText = currentAnswer.trim().length >= 10;

  if (submitted) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center px-6 py-10 gap-5">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#e8e8f0' }}>Answers Submitted!</h3>
          <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: '#9090b0' }}>
            {jobDone ? 'Analysis is complete. Loading your report card...' : 'Your answers are saved. The AI analysis is still running in the background.'}
          </p>
        </div>
        {!jobDone && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-mono" style={{ color: '#9090b0' }}>AI analysis still running...</span>
          </div>
        )}
        {jobDone && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono" style={{ color: '#34d399' }}>Report ready - redirecting...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: '#e8e8f0' }}>Developer Pitch</p>
              <p className="text-[10px] font-mono" style={{ color: '#50507a' }}>Explain your code like in an interview</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: '#9090b0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {currentQ + 1} / {INTERVIEW_QUESTIONS.length}
          </span>
        </div>
        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className={`h-full bg-gradient-to-r ${q.color} rounded-full transition-all duration-500 ease-out`} style={{ width: `${((currentQ + 1) / INTERVIEW_QUESTIONS.length) * 100}%` }} />
        </div>
      </div>
      <div className={`flex-1 flex flex-col px-6 py-5 transition-opacity duration-280 ${animatingNext ? 'opacity-0' : 'opacity-100'}`}>
        <span className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-4 ${q.tagColor}`}>{q.tag}</span>
        <p className="text-[15px] font-semibold leading-relaxed mb-5" style={{ color: '#e8e8f0' }}>{q.question}</p>
        <div className={`relative flex-1 rounded-2xl border ${q.borderColor} ${q.bgColor} overflow-hidden`}>
          <textarea
            ref={textareaRef}
            value={currentAnswer}
            onChange={e => { const a = [...answers]; a[currentQ] = e.target.value; setAnswers(a); }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && hasEnoughText) { e.preventDefault(); advance(); } }}
            placeholder={q.placeholder}
            className="w-full h-full min-h-[130px] bg-transparent text-sm resize-none p-4 outline-none leading-relaxed"
            style={{ color: 'rgba(232,232,240,0.8)', caretColor: '#a78bfa' }}
          />
          {currentAnswer.length > 0 && <div className="absolute bottom-2 right-3 text-[10px] font-mono" style={{ color: '#50507a' }}>{currentAnswer.length}</div>}
        </div>
      </div>
      <div className="px-6 pb-5 pt-3 flex items-center justify-between gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <button onClick={advance} className="text-xs font-semibold py-2 transition-colors" style={{ color: '#50507a' }}>Skip</button>
        <button
          onClick={advance} disabled={!hasEnoughText}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 ${hasEnoughText ? 'hover:scale-[1.02]' : 'opacity-30 cursor-not-allowed'}`}
          style={{ background: hasEnoughText ? (currentQ === INTERVIEW_QUESTIONS.length - 1 ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)') : 'rgba(255,255,255,0.06)' }}
        >
          <span>{currentQ === INTERVIEW_QUESTIONS.length - 1 ? 'Submit Answers' : 'Next Question'}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {currentQ === INTERVIEW_QUESTIONS.length - 1 ? <polyline points="20 6 9 17 4 12" /> : <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>}
          </svg>
        </button>
      </div>
      <div className="px-6 pb-4"><p className="text-[10px] font-mono text-center" style={{ color: '#50507a' }}>Ctrl+Enter to advance - Analysis runs in background</p></div>
    </div>
  );
}

export function PendingReport({ jobId, status, currentPhase, inputType }: { jobId: string; status: string; currentPhase?: string | null; inputType?: string | null; }) {
  const router = useRouter();
  const ANALYSIS_STEPS = getSteps(inputType);
  const inputLabel = getInputLabel(inputType);
  const [livePhase, setLivePhase] = useState<string | null>(currentPhase || null);
  const [liveStatus, setLiveStatus] = useState<string>(status);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const jobDoneRef = useRef(false);
  const interviewDoneRef = useRef(false);

  const triggerCompletion = () => { setShowCompletionOverlay(true); setTimeout(() => router.refresh(), 1800); };

  useEffect(() => {
    if (liveStatus === 'COMPLETED' || liveStatus === 'FAILED' || liveStatus === 'CANCELLED') {
      jobDoneRef.current = true;
      if (liveStatus !== 'COMPLETED') { router.refresh(); return; }
      if (interviewDoneRef.current) triggerCompletion();
      return;
    }
    const es = new EventSource(`/api/jobs/${jobId}/stream`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'phase_start' && data.phase) { setLivePhase(data.phase); if (liveStatus === 'PENDING') setLiveStatus('PROCESSING'); }
        else if (data.type === 'phase_complete' && data.phase === 'save-report') { setLiveStatus('COMPLETED'); }
      } catch (_) {}
    };
    return () => es.close();
  }, [jobId, liveStatus, router]);

  const handleInterviewAllAnswered = () => {
    interviewDoneRef.current = true;
    if (jobDoneRef.current) triggerCompletion();
  };

  const activeIndex = livePhase ? ANALYSIS_STEPS.findIndex(s => livePhase.toLowerCase().includes(s.id)) : liveStatus === 'PENDING' ? -1 : 0;
  const safeActiveIndex = activeIndex === -1 ? (liveStatus === 'PENDING' ? -1 : 0) : activeIndex;
  const [displayedIndex, setDisplayedIndex] = useState(Math.max(safeActiveIndex, 0));

  useEffect(() => { setDisplayedIndex(prev => Math.max(prev, safeActiveIndex)); }, [safeActiveIndex]);
  useEffect(() => {
    const t = setInterval(() => { setDisplayedIndex(prev => { const target = Math.max(safeActiveIndex, 0); return prev < target ? prev + 1 : prev; }); }, 9000);
    return () => clearInterval(t);
  }, [safeActiveIndex]);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const t = setInterval(() => setElapsed(s => s + 1), 1000); return () => clearInterval(t); }, []);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  const [isCancelling, setIsCancelling] = useState(false);
  const handleCancel = async () => {
    setIsCancelling(true);
    try { await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' }); router.refresh(); }
    catch (err) { console.error('Failed to cancel job', err); setIsCancelling(false); }
  };

  const progress = Math.min(((displayedIndex + 1) / ANALYSIS_STEPS.length) * 100, 100);
  const jobIsDone = liveStatus === 'COMPLETED';

  return (
    <div className="min-h-screen text-white font-sans relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fade-up-1{animation:fadeUp 0.5s 0.06s cubic-bezier(.16,1,.3,1) both}
        .fade-up-2{animation:fadeUp 0.5s 0.14s cubic-bezier(.16,1,.3,1) both}
        @keyframes overlayIn{from{opacity:0}to{opacity:1}}.overlay-in{animation:overlayIn .5s both}
        @keyframes overlayContentIn{from{opacity:0;transform:scale(.9) translateY(18px)}to{opacity:1;transform:scale(1) translateY(0)}}.overlay-content-in{animation:overlayContentIn .5s .1s both}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      ` }} />

      {/* Ambient bg */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full" style={{ background: 'rgba(124,58,237,0.08)', filter: 'blur(130px)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full" style={{ background: 'rgba(6,182,212,0.06)', filter: 'blur(130px)' }} />
      </div>

      {/* Completion overlay */}
      {showCompletionOverlay && (
        <div className="fixed inset-0 z-50 overlay-in flex items-center justify-center" style={{ background: 'rgba(9,9,15,0.9)', backdropFilter: 'blur(24px)' }}>
          <div className="overlay-content-in flex flex-col items-center gap-6 text-center">
            <div className="relative">
              <div className="absolute inset-[-16px] rounded-full border border-emerald-500/20 animate-ping" />
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black mb-2 tracking-tight" style={{ color: '#e8e8f0' }}>Analysis Complete!</h2>
              <p className="text-sm font-mono" style={{ color: '#9090b0' }}>Loading your report card...</p>
            </div>
            <div className="flex items-center gap-1.5">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-emerald-400" style={{ animation: `blink 1.2s ${i*0.22}s step-end infinite` }} />)}
            </div>
          </div>
        </div>
      )}

      {/* Top navbar */}
      <header className="relative z-20" style={{ background: 'rgba(15,15,28,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <div className="px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow: '0 0 10px rgba(124,58,237,0.4)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: '#e8e8f0' }}>Deebug <span style={{ color: '#7c3aed', fontWeight: 400 }}>-- AI Code Analyzer</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />Live {mins}:{secs}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9090b0' }}>
              {Math.round(progress)}% analyzed
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="relative z-10 flex flex-col lg:flex-row" style={{ minHeight: 'calc(100vh - 57px)' }}>

        {/* LEFT: Pipeline tracker */}
        <div className="flex-1 flex flex-col p-6 lg:p-8 lg:max-w-[600px] fade-up-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold" style={{ color: '#e8e8f0' }}>Live Progress Tracker</h1>
            <a href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Start New Review
            </a>
          </div>

          {/* Active pipeline card */}
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
            <div className="mb-3">
              <p className="text-sm font-bold" style={{ color: '#e8e8f0' }}>Active Review Pipeline: <span style={{ color: '#a78bfa' }}>{inputLabel} Analysis</span></p>
              <p className="text-[11px] font-mono mt-0.5" style={{ color: '#50507a' }}>Timestamp: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>

            {/* Progress bar */}
            <div className="mb-1.5">
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#06b6d4)', boxShadow: '0 0 14px rgba(124,58,237,0.6)' }} />
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono" style={{ color: '#9090b0' }}>
                OVERALL PROGRESS: {Math.round(progress)}% ({jobIsDone ? 'Complete' : liveStatus === 'PENDING' ? 'Queued...' : `Running... ${mins}:${secs}`})
              </span>
              <span className="text-[11px] font-mono font-bold" style={{ color: '#a78bfa' }}>{Math.round(progress)}%</span>
            </div>

            {/* Step rows */}
            <div className="space-y-1">
              {ANALYSIS_STEPS.map((step, idx) => {
                const isDone   = idx < displayedIndex;
                const isActive = idx === displayedIndex;
                return (
                  <div
                    key={step.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300"
                    style={{
                      background: isActive ? 'rgba(124,58,237,0.1)' : 'transparent',
                      border: isActive ? '1px solid rgba(124,58,237,0.22)' : '1px solid transparent',
                      opacity: (!isDone && !isActive) ? 0.4 : 1,
                    }}
                  >
                    <span className="text-[13px]" style={{ color: isActive ? '#e8e8f0' : isDone ? '#a78bfa' : '#9090b0' }}>
                      {idx + 1}. {step.label}{isDone ? '  ✓' : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      {isDone && <span className="text-[11px] font-semibold" style={{ color: '#06b6d4' }}>Completed</span>}
                      {isActive && (
                        <>
                          <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#a78bfa"/>
                          </svg>
                          <span className="text-[11px] font-semibold" style={{ color: '#a78bfa' }}>RUNNING</span>
                          <span className="text-[10px] font-mono" style={{ color: '#7c3aed' }}>{Math.round(progress)}%</span>
                        </>
                      )}
                      {!isDone && !isActive && <span className="text-[11px]" style={{ color: '#50507a' }}>QUEUED</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cancel */}
          <div>
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ border: '1px solid rgba(239,68,68,0.1)', background: 'rgba(239,68,68,0.04)' }}>
              <div className="flex-1">
                <p className="text-xs font-semibold" style={{ color: '#f87171' }}>Abort Analysis</p>
                <p className="text-[10px] font-mono" style={{ color: 'rgba(248,113,113,0.4)' }}>All progress will be lost.</p>
              </div>
              <button onClick={handleCancel} disabled={isCancelling}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-200 disabled:opacity-40"
                style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)' }}>
                {isCancelling ? 'Stopping...' : 'Stop'}
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px" style={{ background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

        {/* RIGHT: Stats + Interview */}
        <div className="flex-1 flex flex-col p-6 lg:p-8 lg:max-w-[580px] fade-up-2">

          {/* Pipeline stats */}
          <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-base font-bold mb-4" style={{ color: '#e8e8f0' }}>Pipeline Stats</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-black" style={{ color: '#a78bfa' }}>1</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#9090b0' }}>Repos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black" style={{ color: '#06b6d4' }}>{displayedIndex * 14}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#9090b0' }}>Files</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black" style={{ color: '#f59e0b' }}>{displayedIndex}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#9090b0' }}>Issues</p>
              </div>
            </div>
            <a href="/" className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
              Start New Review
            </a>
          </div>

          {/* Interview label */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#9090b0' }}>While You Wait</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: '#50507a', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>Optional</span>
          </div>

          {/* Interview card */}
          <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', minHeight: '420px', backdropFilter: 'blur(20px)' }}>
            <InterviewPanel jobDone={jobIsDone} onAllAnswered={handleInterviewAllAnswered} />
          </div>

          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] font-mono" style={{ color: '#50507a' }}>
            <span>Encrypted</span><span>|</span><span>No code stored</span><span>|</span><span>Job: {jobId.slice(0, 10)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
