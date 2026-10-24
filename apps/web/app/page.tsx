"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmitPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [problemStatement, setProblemStatement] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      try { recognitionRef.current?.stop(); } catch (_) {}
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let baseText = problemStatement || '';
    if (baseText && !baseText.endsWith(' ')) baseText += ' ';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      const spoken = (finalTranscript + interimTranscript).trim();
      if (spoken) setProblemStatement(baseText ? `${baseText}${spoken}` : spoken);
    };
    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const loadingSteps = [
    "Cloning repository & inspecting tree...",
    "Building AST & dependency graph...",
    "Executing parallel LLM static analysis...",
    "Evaluating against problem statement...",
    "Generating dynamic interview questions...",
    "Synthesizing final executive report card..."
  ];
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 2500);
      return () => clearInterval(interval);
    } else {
      setLoadingStepIndex(0);
    }
  }, [loading]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const repoUrl = formData.get('repoUrl') as string;
    const file = formData.get('fileUpload') as File | null;

    if (!repoUrl && (!file || file.size === 0)) {
      setError('Please provide either a GitHub URL or upload a ZIP / code file.');
      setLoading(false);
      return;
    }

    const agentReadProblemStatement = problemStatement.trim() || null;

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: repoUrl ? { 'Content-Type': 'application/json' } : undefined,
        body: repoUrl
          ? JSON.stringify({ repoUrl, problemStatement: agentReadProblemStatement })
          : (() => {
              if (agentReadProblemStatement) {
                formData.set('problemStatement', agentReadProblemStatement);
              }
              return formData;
            })(),
      });

      if (!res.ok) throw new Error('Failed to submit code for analysis');

      const { jobId } = await res.json();
      router.push(`/report/${jobId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission');
      setLoading(false);
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
      if (fileInput) fileInput.files = dataTransfer.files;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white text-zinc-950 font-sans overflow-hidden selection:bg-emerald-500/25 selection:text-emerald-950">
      
      {/* Precision architectural background pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md px-7 py-3.5 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-tight text-zinc-950">Deebug</span>
            <span className="text-zinc-300 font-mono text-xs">/</span>
            <span className="text-xs text-zinc-700 font-bold tracking-normal">AI Code Analyzer & Report Agent</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span>Inspection Engine Online</span>
          </div>
        </div>
      </header>

      {/* Two-Column Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* ── LEFT PANEL: Problem Statement / Context ─────────────────────────────── */}
        <div className="w-[430px] flex-shrink-0 border-r border-zinc-200 flex flex-col overflow-hidden bg-white relative z-10">
          
          {/* Panel header */}
          <div className="px-7 py-5 flex items-center justify-between border-b border-zinc-200 bg-zinc-50/70">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-black text-zinc-950 tracking-tight">Evaluation Context</h2>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono font-bold mt-0.5">Problem Statement & Rules</p>
              </div>
            </div>
            {problemStatement.length > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold">
                {problemStatement.length} chars
              </span>
            )}
          </div>

          {/* Textarea container */}
          <div className="flex-1 p-6 flex flex-col relative bg-white">
            <label className="text-[11px] uppercase tracking-wider font-bold flex items-center gap-2 text-zinc-800 mb-3">
              <span className={`w-2 h-2 rounded-full ${problemStatement ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
              Hackathon or Project Requirements
            </label>
            
            <div className="flex-1 relative h-full flex flex-col">
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                disabled={loading}
                placeholder={isListening ? "Listening... speak now. Your requirements will appear here automatically." : "Paste the hackathon challenge description, engineering constraints, or compliance criteria here...\n\nThe AI grading agent will cross-examine your submitted code against these exact requirements to grade correctness and completeness."}
                className="flex-1 w-full rounded-xl text-xs outline-none resize-none transition-all duration-200 disabled:opacity-50 bg-zinc-50/80 border border-zinc-300 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-zinc-950 placeholder:text-zinc-500 font-sans p-4 pb-12 leading-relaxed font-medium"
              />
              <div className="absolute bottom-2.5 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse shadow-red-200"
                      : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
                  }`}
                  title={isListening ? "Click to stop recording" : "Dictate requirements with microphone"}
                >
                  {isListening ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <span>Listening... Stop</span>
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="23"/>
                        <line x1="8" y1="23" x2="16" y2="23"/>
                      </svg>
                      <span>Dictate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Panel footer */}
          <div className={`px-7 py-3.5 flex items-center gap-2.5 transition-all duration-300 border-t ${
            problemStatement ? 'bg-emerald-50/70 border-emerald-200' : 'bg-zinc-50/80 border-zinc-200'
          }`}>
            <div className={`w-2 h-2 rounded-full transition-colors ${
              problemStatement ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-zinc-400'
            }`} />
            <span className="text-[11px] font-bold" style={{ color: problemStatement ? '#064e3b' : '#3f3f46' }}>
              {problemStatement 
                ? 'Evaluation agent calibrated to custom requirements' 
                : 'Awaiting problem context (optional)'}
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL: Codebase Submission ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto relative bg-[#fbfbfa]">
          <div className="min-h-full flex flex-col items-center justify-start py-6 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-lg my-auto transition-all duration-300 relative">
            
            {loading ? (
              /* DYNAMIC LOADING RADAR */
              <div className="flex flex-col items-center justify-center py-16 px-8 rounded-2xl bg-white border border-zinc-200 shadow-md relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-50/30" />
                
                {/* Orbital Scanner */}
                <div className="relative w-28 h-28 mb-8">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
                  <div className="absolute inset-2.5 rounded-full border-2 border-zinc-200 border-b-zinc-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
                  <div className="absolute inset-5 rounded-full border border-emerald-100" />
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-emerald-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-lg font-black mb-2 text-zinc-950 tracking-tight relative z-10">Executing Codebase Audit</h3>
                
                <div className="h-6 relative w-full flex items-center justify-center overflow-hidden mb-6 z-10">
                  {loadingSteps.map((step, idx) => (
                    <p
                      key={step}
                      className={`absolute text-xs font-mono font-bold transition-all duration-300 text-emerald-800 ${
                        idx === loadingStepIndex
                          ? 'opacity-100 translate-y-0 scale-100'
                          : idx < loadingStepIndex
                          ? 'opacity-0 -translate-y-4 scale-95'
                          : 'opacity-0 translate-y-4 scale-95'
                      }`}
                    >
                      {step}
                    </p>
                  ))}
                </div>
                
                <div className="w-64 h-1.5 bg-zinc-200 rounded-full overflow-hidden relative z-10">
                  <div className="h-full bg-emerald-600 rounded-full animate-[progress_1.8s_ease-in-out_infinite]" style={{ width: '45%' }} />
                </div>
              </div>
            ) : (
              /* SUBMISSION FORM */
              <div>
                <div className="mb-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Enterprise Code Auditor
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 mb-1.5">
                    Submit Codebase
                  </h1>
                  <p className="text-xs text-zinc-700 font-medium max-w-sm mx-auto leading-relaxed">
                    AST structural parsing, deep architectural inspection, and automated report card generation.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl text-xs bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="font-bold">{error}</p>
                  </div>
                )}

                <form className="bg-white border border-zinc-200 p-5 sm:p-6 rounded-2xl shadow-sm relative w-full space-y-3.5" onSubmit={handleSubmit}>
                  
                  {/* GitHub Repository Input */}
                  <div>
                    <label htmlFor="repoUrl" className="block text-[11px] font-bold mb-2 uppercase tracking-wider text-zinc-800 flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                      </svg>
                      GitHub Repository URL
                    </label>
                    <input
                      id="repoUrl"
                      name="repoUrl"
                      type="url"
                      placeholder="https://github.com/org/repo"
                      className="w-full rounded-xl px-4 py-3 text-xs outline-none transition-all duration-200 bg-zinc-50 border border-zinc-300 text-zinc-950 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-500 font-mono shadow-sm font-medium"
                    />
                  </div>

                  {/* Clean Divider */}
                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-zinc-200" />
                    <span className="mx-4 text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest bg-white px-2 py-0.5">or</span>
                    <div className="flex-grow border-t border-zinc-200" />
                  </div>

                  {/* Direct File Dropzone */}
                  <div>
                    <label htmlFor="fileUpload" className="block text-[11px] font-bold mb-2 uppercase tracking-wider text-zinc-800 flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Direct File or Archive Upload
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative flex flex-col items-center justify-center w-full rounded-xl border border-dashed transition-all duration-200 cursor-pointer p-5 ${
                        isDragging 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-zinc-300 bg-zinc-50/80 hover:border-emerald-500 hover:bg-emerald-50/40'
                      }`}
                    >
                      <input
                        id="fileUpload"
                        name="fileUpload"
                        type="file"
                        accept=".zip,.ts,.js,.py,.go,.java,.cpp,.c,.h,.rs,.tsx,.jsx,.html,.css,.ipynb"
                        className="hidden"
                        onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                      />
                      <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center justify-center text-center w-full h-full">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2.5 transition-all duration-200 ${
                          isDragging ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-zinc-200 shadow-sm'
                        }`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                        </div>
                        <div className="text-xs font-bold text-zinc-950">
                          {fileName ? (
                            <span className="text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md font-mono font-bold">
                              {fileName}
                            </span>
                          ) : (
                            <span className="flex flex-col gap-0.5">
                              <span className="text-zinc-950 font-bold">Drag & drop project archive or file</span>
                              <span className="text-zinc-600 font-semibold text-[11px]">or click to browse filesystem</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-2 font-mono">
                          Supports .zip, .ts, .py, .go, .rs, .ipynb (Max 20MB)
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_3px_14px_rgba(5,150,105,0.35)] hover:shadow-[0_4px_20px_rgba(5,150,105,0.45)] flex items-center justify-center gap-2"
                    >
                      <span>Start AI Analysis</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="text-[10px] text-center pt-1 text-zinc-600 uppercase tracking-widest font-mono font-bold flex items-center justify-center gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Secure In-Memory Inspection • Ephemeral Execution
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
      
      {/* Precision styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}} />
    </div>
  );
}
