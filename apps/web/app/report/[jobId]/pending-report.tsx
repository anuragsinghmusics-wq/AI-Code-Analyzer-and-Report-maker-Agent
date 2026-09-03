"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

// -- Step definitions per input type -------------------------------

const STEPS_FILE = [
  { id: 'ingest',      label: 'Reading File',              detail: 'Loading your file into the analysis engine...', color: 'from-violet-500 to-blue-500'   },
  { id: 'parse',       label: 'Parsing Code Structure',    detail: 'Building abstract syntax tree...',              color: 'from-blue-500 to-cyan-500'     },
  { id: 'file',        label: 'File Analysis',             detail: 'Analyzing responsibilities & purpose...',       color: 'from-cyan-500 to-teal-500'     },
  { id: 'architecture',label: 'Architecture Analysis',     detail: 'Detecting design patterns...',                  color: 'from-teal-500 to-emerald-500'  },
  { id: 'dataflow',    label: 'Data Flow Analysis',        detail: 'Tracing state mutations...',                    color: 'from-emerald-500 to-green-500' },
  { id: 'logic',       label: 'Logic Review',              detail: 'Checking algorithm complexity...',              color: 'from-green-500 to-lime-500'    },
  { id: 'quality',     label: 'Quality Review',            detail: 'Scoring across quality dimensions...',          color: 'from-lime-500 to-yellow-500'   },
  { id: 'bug',         label: 'Bug Hunting',               detail: 'Finding vulnerabilities & anti-patterns...',    color: 'from-yellow-500 to-amber-500'  },
  { id: 'performance', label: 'Performance Analysis',      detail: 'Identifying bottlenecks...',                    color: 'from-amber-500 to-orange-500'  },
  { id: 'design',      label: 'Design Analysis',           detail: 'Evaluating SOLID principles...',                color: 'from-orange-500 to-red-500'    },
  { id: 'question-gen',label: 'Generating Interview Q&A',  detail: 'Creating contextual questions...',              color: 'from-red-500 to-rose-500'      },
  { id: 'report',      label: 'Compiling Report Card',     detail: 'Scoring & formatting results...',               color: 'from-rose-500 to-purple-500'   },
];

const STEPS_ZIP = [
  { id: 'ingest',      label: 'Extracting Archive',        detail: 'Unzipping & scanning file tree...',            color: 'from-violet-500 to-purple-500' },
  { id: 'parse',       label: 'Mapping Project Structure', detail: 'Resolving modules & entry points...',          color: 'from-blue-500 to-cyan-500'     },
  { id: 'file',        label: 'File-by-File Analysis',     detail: 'Analyzing responsibilities per file...',        color: 'from-cyan-500 to-teal-500'     },
  { id: 'architecture',label: 'Architecture Analysis',     detail: 'Detecting architectural patterns...',           color: 'from-teal-500 to-emerald-500'  },
  { id: 'dataflow',    label: 'Data Flow Analysis',        detail: 'Tracing state mutations across files...',       color: 'from-emerald-500 to-green-500' },
  { id: 'logic',       label: 'Logic Review',              detail: 'Checking algorithm complexity...',              color: 'from-green-500 to-lime-500'    },
  { id: 'quality',     label: 'Quality Review',            detail: 'Scoring across quality dimensions...',          color: 'from-lime-500 to-yellow-500'   },
  { id: 'bug',         label: 'Bug Hunting',               detail: 'Finding vulnerabilities & anti-patterns...',    color: 'from-yellow-500 to-amber-500'  },
  { id: 'performance', label: 'Performance Analysis',      detail: 'Identifying bottlenecks...',                    color: 'from-amber-500 to-orange-500'  },
  { id: 'design',      label: 'Design Analysis',           detail: 'Evaluating SOLID principles...',                color: 'from-orange-500 to-red-500'    },
  { id: 'question-gen',label: 'Generating Interview Q&A',  detail: 'Creating contextual questions...',              color: 'from-red-500 to-rose-500'      },
  { id: 'report',      label: 'Compiling Report Card',     detail: 'Scoring & formatting results...',               color: 'from-rose-500 to-purple-500'   },
];

const STEPS_REPO = [
  { id: 'clone',       label: 'Cloning Repository',        detail: 'Fetching source code from remote...',          color: 'from-violet-500 to-purple-500' },
  { id: 'ingest',      label: 'Indexing Files',            detail: 'Walking file tree, filtering relevant code...', color: 'from-purple-500 to-blue-500'   },
  { id: 'parse',       label: 'Parsing Project Structure', detail: 'Building module dependency graph...',           color: 'from-blue-500 to-cyan-500'     },
  { id: 'file',        label: 'File-by-File Analysis',     detail: 'Analyzing responsibilities per file...',        color: 'from-cyan-500 to-teal-500'     },
  { id: 'architecture',label: 'Architecture Analysis',     detail: 'Detecting architectural patterns...',           color: 'from-teal-500 to-emerald-500'  },
  { id: 'dataflow',    label: 'Data Flow Analysis',        detail: 'Tracing state mutations across modules...',     color: 'from-emerald-500 to-green-500' },
  { id: 'logic',       label: 'Logic Review',              detail: 'Checking algorithm complexity...',              color: 'from-green-500 to-lime-500'    },
  { id: 'quality',     label: 'Quality Review',            detail: 'Scoring across quality dimensions...',          color: 'from-lime-500 to-yellow-500'   },
  { id: 'bug',         label: 'Bug Hunting',               detail: 'Finding vulnerabilities & anti-patterns...',    color: 'from-yellow-500 to-amber-500'  },
  { id: 'performance', label: 'Performance Analysis',      detail: 'Identifying bottlenecks...',                    color: 'from-amber-500 to-orange-500'  },
  { id: 'design',      label: 'Design Analysis',           detail: 'Evaluating SOLID principles...',                color: 'from-orange-500 to-red-500'    },
  { id: 'question-gen',label: 'Generating Interview Q&A',  detail: 'Creating contextual questions...',              color: 'from-red-500 to-rose-500'      },
  { id: 'report',      label: 'Compiling Report Card',     detail: 'Scoring & formatting results...',               color: 'from-rose-500 to-purple-500'   },
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

// -- Interview questions shown while analysis runs in background --------
const INTERVIEW_QUESTIONS = [
  {
    id: 'q1',
    tag: 'Design Decision',
    emoji: '🏗️',
    question: 'What was the most challenging technical decision or trade-off you made in this project?',
    placeholder: "e.g. I chose X over Y because the team needed Z, but it cost us performance in...",
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/5',
    tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'q2',
    tag: 'Self Awareness',
    emoji: '🔍',
    question: 'If you had 1 more week, what would you refactor or improve first — and why?',
    placeholder: "e.g. The auth module has tight coupling I'd extract into a separate service...",
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/5',
    tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'q3',
    tag: 'Pride & Craft',
    emoji: '⭐',
    question: 'Which part of this codebase are you most proud of, and what makes it stand out?',
    placeholder: "e.g. The event-driven pipeline in src/pipeline/ handles retries and state cleanly without...",
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/5',
    tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
];

// -- Sub-component: InterviewPanel ------------------------------------
function InterviewPanel({
  jobDone,
  onAllAnswered,
}: {
  jobDone: boolean;
  onAllAnswered: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [submitted, setSubmitted] = useState(false);
  const [animatingNext, setAnimatingNext] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && !submitted) {
      textareaRef.current.focus();
    }
  }, [currentQ, submitted]);

  const advance = () => {
    if (animatingNext) return;
    setAnimatingNext(true);
    setTimeout(() => {
      if (currentQ < INTERVIEW_QUESTIONS.length - 1) {
        setCurrentQ(q => q + 1);
      } else {
        setSubmitted(true);
        onAllAnswered();
      }
      setAnimatingNext(false);
    }, 280);
  };

  const q = INTERVIEW_QUESTIONS[currentQ];
  const currentAnswer = answers[currentQ];
  const hasEnoughText = currentAnswer.trim().length >= 10;

  if (submitted) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center px-6 py-10 gap-5">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.12)]">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2">Answers Submitted!</h3>
          <p className="text-sm text-white/40 leading-relaxed max-w-xs mx-auto">
            {jobDone
              ? 'Analysis is complete. Loading your report card...'
              : 'Your answers are saved. The AI analysis is still running in the background.'}
          </p>
        </div>
        {!jobDone && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-mono text-white/40">AI analysis still running...</span>
          </div>
        )}
        {jobDone && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono text-emerald-400">Report ready — redirecting...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-6 pt-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-white/70">Developer Pitch</p>
              <p className="text-[10px] text-white/30 font-mono">Explain your code like in an interview</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-white/25 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            {currentQ + 1} / {INTERVIEW_QUESTIONS.length}
          </span>
        </div>
        {/* Question progress bar */}
        <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${q.color} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${((currentQ + 1) / INTERVIEW_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question body */}
      <div className={`flex-1 flex flex-col px-6 py-5 transition-opacity duration-280 ${animatingNext ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'}`}
        style={{ transition: 'opacity 0.28s ease, transform 0.28s ease' }}>
        {/* Tag */}
        <span className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-4 ${q.tagColor}`}>
          {q.emoji} {q.tag}
        </span>

        {/* Question text */}
        <p className="text-[15px] font-semibold text-white leading-relaxed mb-5">
          {q.question}
        </p>

        {/* Answer textarea */}
        <div className={`relative flex-1 rounded-2xl border ${q.borderColor} ${q.bgColor} overflow-hidden`}>
          <textarea
            ref={textareaRef}
            value={currentAnswer}
            onChange={e => {
              const newAnswers = [...answers];
              newAnswers[currentQ] = e.target.value;
              setAnswers(newAnswers);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && hasEnoughText) {
                e.preventDefault();
                advance();
              }
            }}
            placeholder={q.placeholder}
            className="w-full h-full min-h-[130px] bg-transparent text-sm text-white/80 placeholder-white/20 resize-none p-4 outline-none leading-relaxed"
          />
          {currentAnswer.length > 0 && (
            <div className="absolute bottom-2 right-3 text-[10px] font-mono text-white/20">
              {currentAnswer.length}
            </div>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div className="px-6 pb-5 pt-3 flex items-center justify-between gap-3 border-t border-white/[0.04]">
        <button
          onClick={advance}
          className="text-xs text-white/25 hover:text-white/45 transition-colors font-semibold py-2"
        >
          Skip →
        </button>

        <button
          onClick={advance}
          disabled={!hasEnoughText}
          className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 overflow-hidden ${
            hasEnoughText
              ? 'hover:scale-[1.02] active:scale-[0.98]'
              : 'opacity-30 cursor-not-allowed'
          }`}
          style={{
            background: hasEnoughText
              ? `linear-gradient(135deg, ${currentQ === INTERVIEW_QUESTIONS.length - 1 ? '#059669, #10b981' : '#2563eb, #3b82f6'})`
              : 'rgba(255,255,255,0.06)',
          }}
        >
          <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span>{currentQ === INTERVIEW_QUESTIONS.length - 1 ? 'Submit Answers' : 'Next Question'}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {currentQ === INTERVIEW_QUESTIONS.length - 1
              ? <polyline points="20 6 9 17 4 12" />
              : <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>
            }
          </svg>
        </button>
      </div>

      <div className="px-6 pb-4">
        <p className="text-[10px] text-white/15 font-mono text-center">⌘↵ to advance · Analysis runs in background</p>
      </div>
    </div>
  );
}

// â”€â”€ Main PendingReport export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function PendingReport({
  jobId,
  status,
  currentPhase,
  inputType,
}: {
  jobId: string;
  status: string;
  currentPhase?: string | null;
  inputType?: string | null;
}) {
  const router = useRouter();
  const ANALYSIS_STEPS = getSteps(inputType);
  const inputLabel = getInputLabel(inputType);

  // â”€â”€ SSE / live status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [livePhase, setLivePhase] = useState<string | null>(currentPhase || null);
  const [liveStatus, setLiveStatus] = useState<string>(status);

  // â”€â”€ Interview + completion state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [interviewDone, setInterviewDone] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);

  const jobDoneRef = useRef(false);
  const interviewDoneRef = useRef(false);

  // Trigger full-screen completion overlay then refresh
  const triggerCompletion = () => {
    setShowCompletionOverlay(true);
    setTimeout(() => router.refresh(), 1800);
  };

  useEffect(() => {
    if (liveStatus === 'COMPLETED' || liveStatus === 'FAILED' || liveStatus === 'CANCELLED') {
      jobDoneRef.current = true;
      if (liveStatus !== 'COMPLETED') {
        // Failed or cancelled â€” redirect immediately no matter what
        router.refresh();
        return;
      }
      // Completed: only redirect if interview is also done (or skip on skip)
      if (interviewDoneRef.current) {
        triggerCompletion();
      }
      // else wait â€” InterviewPanel's onAllAnswered will call triggerCompletion
      return;
    }

    const eventSource = new EventSource(`/api/jobs/${jobId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'phase_start' && data.phase) {
          setLivePhase(data.phase);
          if (liveStatus === 'PENDING') setLiveStatus('PROCESSING');
        } else if (data.type === 'phase_complete' && data.phase === 'save-report') {
          setLiveStatus('COMPLETED');
        }
      } catch (_) { /* ignore */ }
    };

    return () => eventSource.close();
  }, [jobId, liveStatus, router]);

  const handleInterviewAllAnswered = () => {
    interviewDoneRef.current = true;
    setInterviewDone(true);
    if (jobDoneRef.current) {
      // Job already finished while user was typing â€” redirect now
      triggerCompletion();
    }
    // else stay and wait â€” the SSE effect above will call triggerCompletion when job finishes
  };

  // Active step index derived from live phase
  const activeIndex = livePhase
    ? ANALYSIS_STEPS.findIndex(s => livePhase.toLowerCase().includes(s.id))
    : liveStatus === 'PENDING' ? -1 : 0;
  const safeActiveIndex = activeIndex === -1 ? (liveStatus === 'PENDING' ? -1 : 0) : activeIndex;

  const [displayedIndex, setDisplayedIndex] = useState(Math.max(safeActiveIndex, 0));

  useEffect(() => {
    setDisplayedIndex(prev => Math.max(prev, safeActiveIndex));
  }, [safeActiveIndex]);

  useEffect(() => {
    const t = setInterval(() => {
      setDisplayedIndex(prev => {
        const target = Math.max(safeActiveIndex, 0);
        return prev < target ? prev + 1 : prev;
      });
    }, 9000);
    return () => clearInterval(t);
  }, [safeActiveIndex]);

  // Elapsed timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  const [isCancelling, setIsCancelling] = useState(false);
  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
      router.refresh();
    } catch (err) {
      console.error('Failed to cancel job', err);
      setIsCancelling(false);
    }
  };

  const progress = Math.min(((displayedIndex + 1) / ANALYSIS_STEPS.length) * 100, 100);
  const activeStep = ANALYSIS_STEPS[displayedIndex];
  const jobIsDone = liveStatus === 'COMPLETED';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 relative overflow-hidden">

      {/* â”€â”€ INLINE CSS â”€â”€ */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(30px,-50px) scale(1.1); }
          66%  { transform: translate(-20px,20px) scale(0.9); }
          100% { transform: translate(0,0) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .anim-delay-2 { animation-delay: 2s; }
        .anim-delay-4 { animation-delay: 4s; }

        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .spin-slow { animation: spin-slow 3s linear infinite; }
        @keyframes spin-rev  { to { transform: rotate(-360deg); } }
        .spin-rev  { animation: spin-rev 2s linear infinite; }

        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          50%      { box-shadow: 0 0 30px 8px rgba(59,130,246,0.15); }
        }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }

        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-track { animation: ticker 18s linear infinite; }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up   { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .fade-up-1 { animation: fadeUp 0.5s 0.06s cubic-bezier(0.16,1,0.3,1) both; }
        .fade-up-2 { animation: fadeUp 0.5s 0.14s cubic-bezier(0.16,1,0.3,1) both; }

        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cursor { animation: blink 1s step-end infinite; }

        @keyframes scan {
          from { transform: translateY(-100%); }
          to   { transform: translateY(100%); }
        }
        .scan-line { animation: scan 2.5s ease-in-out infinite; }

        @keyframes step-enter {
          from { opacity:0; transform: translateX(-8px); }
          to   { opacity:1; transform: translateX(0); }
        }
        .step-enter { animation: step-enter 0.4s cubic-bezier(0.16,1,0.3,1) both; }

        @keyframes overlayIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        .overlay-in { animation: overlayIn 0.5s cubic-bezier(0.16,1,0.3,1) both; }

        @keyframes overlayContentIn {
          from { opacity:0; transform: scale(0.9) translateY(18px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        .overlay-content-in { animation: overlayContentIn 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both; }

        @keyframes divPulse {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.3; }
        }
        .div-pulse { animation: divPulse 3s ease-in-out infinite; }
      ` }} />

      {/* â”€â”€ ANIMATED BACKGROUND â”€â”€ */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-blue-600/15 blur-[130px] rounded-full mix-blend-screen animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/15 blur-[130px] rounded-full mix-blend-screen animate-blob anim-delay-2" />
        <div className="absolute top-[40%] left-[35%] w-[30%] h-[30%] bg-cyan-500/10 blur-[100px] rounded-full animate-blob anim-delay-4" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)] opacity-40" />
      </div>

      {/* â”€â”€ COMPLETION OVERLAY â”€â”€ */}
      {showCompletionOverlay && (
        <div
          className="fixed inset-0 z-50 overlay-in flex items-center justify-center"
          style={{ background: 'rgba(5,5,5,0.88)', backdropFilter: 'blur(24px)' }}
        >
          <div className="overlay-content-in flex flex-col items-center gap-6 text-center">
            <div className="relative">
              <div className="absolute inset-[-16px] rounded-full border border-emerald-500/20 animate-ping" />
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/25 to-green-500/15 border border-emerald-500/35 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Analysis Complete!</h2>
              <p className="text-white/45 text-sm font-mono">Loading your report card...</p>
            </div>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  style={{ animation: `blink 1.2s ${i * 0.22}s step-end infinite` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ TOP NAVBAR â”€â”€ */}
      <header className="relative z-20 border-b border-white/[0.06] bg-black/50 backdrop-blur-2xl">
        <div className="max-w-[1300px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.3)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <span className="font-bold text-sm text-white/80">
              Deebug <span className="text-blue-400 font-normal opacity-60">—</span> AI Code Analyzer
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[11px] font-mono text-blue-400">Live · {mins}:{secs}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="text-[11px] font-mono text-white/35">{Math.round(progress)}% analyzed</span>
            </div>
          </div>
        </div>
      </header>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SPLIT LAYOUT â€” Left: Analysis | Right: Interview
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="relative z-10 max-w-[1300px] mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            LEFT PANEL â€” Live Analysis Progress
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="flex-1 flex flex-col p-6 lg:p-8 lg:max-w-[580px] fade-up-1">

          {/* Panel label */}
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-white/35">AI Analysis Pipeline</span>
          </div>

          {/* Rotating ring visual */}
          <div className="flex flex-col items-center py-7 mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="scan-line absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-blue-500/4 to-transparent" />
            </div>

            <div className="relative w-24 h-24 pulse-glow rounded-full mb-5">
              <div className="absolute inset-0 rounded-full border-2 border-transparent spin-slow"
                style={{ borderTopColor: '#3b82f6', borderRightColor: 'rgba(59,130,246,0.3)' }} />
              <div className="absolute inset-2.5 rounded-full border-2 border-transparent spin-rev"
                style={{ borderBottomColor: '#a855f7', borderLeftColor: 'rgba(168,85,247,0.3)' }} />
              <div className="absolute inset-5 rounded-full border border-white/10 spin-slow" style={{ animationDuration: '5s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeStep?.color ?? 'from-blue-500 to-purple-500'} flex items-center justify-center shadow-lg transition-all duration-700`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
              </div>
            </div>

            <div key={displayedIndex} className="step-enter text-center">
              <div className="text-base font-bold text-white mb-0.5">{activeStep?.label}</div>
              <div className="text-xs text-white/40 font-mono">{activeStep?.detail}<span className="cursor">_</span></div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className={`w-1.5 h-1.5 rounded-full ${jobIsDone ? 'bg-emerald-400' : 'bg-blue-400 animate-pulse'}`} />
              <span className="text-[11px] font-mono text-white/40">
                {jobIsDone ? 'Analysis complete' : liveStatus === 'PENDING' ? 'Queued...' : 'Analyzing...'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono text-white/35 uppercase tracking-widest">Overall Progress</span>
              <span className="text-[11px] font-mono text-white/55">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${activeStep?.color ?? 'from-blue-500 to-purple-500'} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps list */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5" style={{ maxHeight: '320px' }}>
            {ANALYSIS_STEPS.map((step, idx) => {
              const isDone    = idx < displayedIndex;
              const isActive  = idx === displayedIndex;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-500 ${
                    isActive  ? 'bg-white/[0.05] border border-white/[0.07]' :
                    isDone    ? 'opacity-55' : 'opacity-18'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-all duration-500 ${
                    isDone   ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                    isActive ? `bg-gradient-to-br ${step.color} border-transparent text-white shadow` :
                    'bg-white/5 border-white/10 text-white/20'
                  }`}>
                    {isDone   ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    : isActive ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    :            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold ${isActive ? 'text-white' : isDone ? 'text-white/60' : 'text-white/22'}`}>
                      {step.label}
                    </div>
                    {isActive && (
                      <div className="text-[10px] font-mono text-white/32 mt-0.5 step-enter">{step.detail}</div>
                    )}
                  </div>

                  <div className="shrink-0">
                    {isDone   ? <span className="text-[9px] font-mono text-emerald-400/65 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">done</span>
                    : isActive ? <span className="text-[9px] font-mono text-blue-400/75 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full animate-pulse">running</span>
                    :            <span className="text-[9px] font-mono text-white/15">queued</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scrolling ticker */}
          <div className="mt-4 overflow-hidden border-t border-white/[0.04] pt-3">
            <div className="flex whitespace-nowrap ticker-track gap-10 text-[10px] font-mono text-white/18">
              {['Static Analysis', 'AST Parsing', 'Code Quality Score', 'Complexity Index', 'Security Scan', 'Best Practice Check', 'LLM Evaluation', 'Interview Generation', 'Report Compilation',
                'Static Analysis', 'AST Parsing', 'Code Quality Score', 'Complexity Index', 'Security Scan', 'Best Practice Check', 'LLM Evaluation', 'Interview Generation', 'Report Compilation'].map((text, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-blue-500/35 shrink-0" />
                  {text}
                </span>
              ))}
            </div>
          </div>

          {/* Cancel */}
          <div className="mt-5">
            <div className="rounded-xl border border-red-500/10 bg-red-950/12 p-3 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-300">Abort Analysis</p>
                <p className="text-[10px] text-red-400/45 font-mono">All progress will be lost.</p>
              </div>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs text-red-300 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isCancelling
                  ? <span className="w-3 h-3 rounded-full border border-red-400/60 border-t-red-400 animate-spin" />
                  : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                }
                {isCancelling ? 'Stopping...' : 'Stop'}
              </button>
            </div>
          </div>
        </div>

        {/* â”€â”€ Vertical divider (desktop) â”€â”€ */}
        <div className="hidden lg:flex flex-col items-center py-12">
          <div className="w-px flex-1 bg-gradient-to-b from-transparent via-white/8 to-transparent div-pulse" />
          <div className="w-7 h-7 rounded-lg border border-white/8 bg-white/[0.02] flex items-center justify-center my-3 shrink-0">
            <span className="text-[9px] text-white/18">↔</span>
          </div>
          <div className="w-px flex-1 bg-gradient-to-b from-transparent via-white/8 to-transparent div-pulse" />
        </div>

        {/* â”€â”€ Horizontal divider (mobile) â”€â”€ */}
        <div className="lg:hidden mx-6 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            RIGHT PANEL â€” Developer Interview
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="flex-1 flex flex-col p-6 lg:p-8 lg:max-w-[600px] fade-up-2">

          {/* Panel label */}
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-white/35">While You Wait</span>
            <div className="flex-1 h-px bg-white/[0.04]" />
            <span className="text-[10px] font-mono text-white/18 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">Optional</span>
          </div>

          {/* Interview card */}
          <div
            className="rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ minHeight: '460px' }}
          >
            <InterviewPanel
              jobDone={jobIsDone}
              onAllAnswered={handleInterviewAllAnswered}
            />
          </div>

          {/* Footer meta */}
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-mono text-white/18">
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Encrypted
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              No code stored
            </div>
            <div className="w-px h-3 bg-white/10" />
            <span>Job: {jobId.slice(0, 10)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

