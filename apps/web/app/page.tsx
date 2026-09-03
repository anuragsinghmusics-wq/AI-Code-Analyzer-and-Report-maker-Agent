"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmitPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [problemStatement, setProblemStatement] = useState('');

  const loadingSteps = [
    "Cloning repository...",
    "Scanning project structure...",
    "Running static code analysis...",
    "Evaluating against problem statement...",
    "Generating dynamic interview questions...",
    "Finalizing report card..."
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
      setError(err.message || 'An error occurred');
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
    <div className="h-screen flex flex-col bg-[#050505] text-white font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
      </div>

      {/* Top navbar */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 py-4 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <span className="font-bold text-base tracking-tight text-white/90 group-hover:text-white transition-colors">
            Deebug <span className="text-blue-500 font-medium opacity-80">—</span> AI Code Analyzer
          </span>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* ── LEFT PANEL: Problem Statement ─────────────────────────────── */}
        <div className="w-[450px] flex-shrink-0 border-r border-white/5 flex flex-col overflow-hidden relative bg-black/20 backdrop-blur-3xl shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-10">
          
          {/* Panel header */}
          <div className="px-8 py-6 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-blue-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white">Problem Statement</h2>
                <p className="text-[11px] uppercase tracking-[0.2em] mt-1 text-white/40 font-semibold">Evaluation Context</p>
              </div>
            </div>
          </div>

          {/* Manual textarea body */}
          <div className="flex-1 px-8 pb-6 flex flex-col relative">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs uppercase tracking-widest font-bold flex items-center gap-2 text-white/50">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></span>
                Enter Details Manually
              </label>
              {problemStatement.length > 0 && (
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-white/5 text-blue-300 border border-white/10">
                  {problemStatement.length} chars
                </span>
              )}
            </div>
            
            <div className="flex-1 relative group h-full flex flex-col">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-500/20 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-md pointer-events-none" />
              
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                disabled={loading}
                placeholder={"Paste the hackathon or challenge problem statement here...\n\nThe AI agent will read these exact requirements and grade your code submission based on how well it solves this specific problem."}
                className="relative flex-1 w-full rounded-2xl text-sm outline-none resize-none transition-all duration-300 disabled:opacity-50 bg-[#0a0a0c] border border-white/10 focus:border-blue-500/50 text-white/90 placeholder:text-white/30 shadow-inner"
                style={{
                  padding: '20px 24px',
                  lineHeight: '1.8',
                }}
              />
            </div>
          </div>

          {/* Panel footer */}
          <div className={`px-8 py-5 flex items-center gap-3 transition-all duration-500 border-t ${problemStatement ? 'bg-blue-500/5 border-blue-500/20' : 'bg-transparent border-white/5'}`}>
            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${problemStatement ? 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)]' : 'bg-white/20'}`} />
            <span className="text-xs font-medium transition-colors duration-500" style={{ color: problemStatement ? '#fff' : 'rgba(255,255,255,0.4)' }}>
              {problemStatement 
                ? 'Agent is ready to grade against requirements' 
                : 'Awaiting problem statement context...'}
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL: Code Submission ──────────────────────────────── */}
        <div className="flex-1 flex flex-col items-start justify-start p-6 overflow-y-auto relative">
          <div className="w-full max-w-xl transition-all duration-500 relative mx-auto my-auto py-4">
            
            {loading ? (
              /* DYNAMIC LOADING STATE */
              <div className="flex flex-col items-center justify-center py-20 px-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50"></div>
                
                <div className="relative w-32 h-32 mb-10">
                  <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-blue-500 animate-spin" />
                  <div className="absolute inset-3 rounded-full border-b-2 border-r-2 border-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  <div className="absolute inset-6 rounded-full border-t-2 border-r-2 border-white/20 animate-spin" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-white tracking-tight relative z-10">Analyzing Codebase</h3>
                
                <div className="h-8 relative w-full flex items-center justify-center overflow-hidden mb-8 z-10">
                  {loadingSteps.map((step, idx) => (
                    <p
                      key={step}
                      className={`absolute text-base font-medium transition-all duration-500 text-blue-300 ${
                        idx === loadingStepIndex
                          ? 'opacity-100 translate-y-0 scale-100'
                          : idx < loadingStepIndex
                          ? 'opacity-0 -translate-y-8 scale-95'
                          : 'opacity-0 translate-y-8 scale-95'
                      }`}
                    >
                      {step}
                    </p>
                  ))}
                </div>
                
                <div className="w-72 h-1.5 bg-white/10 rounded-full overflow-hidden relative z-10">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
                </div>
              </div>
            ) : (
              /* SUBMISSION FORM */
              <div className="animate-fade-in-up">
                <div className="mb-5 text-center relative pt-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 mb-3 shadow-2xl relative group">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl group-hover:bg-blue-500/30 transition-all duration-500" />
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white relative z-10"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                  </div>
                  <h1 className="text-2xl font-extrabold mb-1.5 tracking-tight text-white leading-tight">
                    Code Submission
                  </h1>
                  <p className="text-sm leading-relaxed text-white/50 max-w-md mx-auto">
                    Provide your codebase for AI static analysis.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3 backdrop-blur-sm animate-shake">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                <form className="space-y-5 bg-white/[0.03] border border-white/10 p-6 rounded-[24px] shadow-2xl backdrop-blur-2xl relative w-full" onSubmit={handleSubmit}>
                  <div className="absolute inset-0 rounded-[24px] shadow-[inset_0_0_100px_rgba(255,255,255,0.02)] pointer-events-none" />

                  {/* GitHub URL */}
                  <div className="relative z-10">
                    <label htmlFor="repoUrl" className="block text-[11px] font-bold mb-2 uppercase tracking-widest text-white/60 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                      GitHub Repository
                    </label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 blur opacity-0 group-focus-within:opacity-40 transition duration-500" />
                      <input
                        id="repoUrl"
                        name="repoUrl"
                        type="url"
                        placeholder="https://github.com/your-org/your-repo"
                        className="relative w-full rounded-xl px-5 py-4 text-sm outline-none transition-all duration-300 bg-black/50 border border-white/10 text-white focus:border-white/30 placeholder:text-white/20 font-mono shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative flex items-center py-2 z-10">
                    <div className="flex-grow border-t border-white/5" />
                    <span className="mx-6 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] bg-[#111113] px-2 py-1 rounded-md border border-white/5">or</span>
                    <div className="flex-grow border-t border-white/5" />
                  </div>

                  {/* File upload */}
                  <div className="relative z-10">
                    <label htmlFor="fileUpload" className="block text-[11px] font-bold mb-2 uppercase tracking-widest text-white/60 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      Direct Upload
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative group flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/15 bg-black/30 hover:border-blue-500/50 hover:bg-white/5'} py-6`}
                    >
                      <input
                        id="fileUpload"
                        name="fileUpload"
                        type="file"
                        accept=".zip,.ts,.js,.py,.go,.java,.cpp,.c,.h,.rs,.tsx,.jsx,.html,.css,.ipynb"
                        className="hidden"
                        onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                      />
                      <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center justify-center text-center w-full h-full relative z-10">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-500 ${isDragging ? 'bg-blue-500 text-white scale-110' : 'bg-white/5 text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20'}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <div className="mb-2 text-sm font-semibold text-white/90">
                          {fileName ? (
                            <span className="text-blue-400 bg-blue-500/10 px-3 py-1 rounded-md">{fileName}</span>
                          ) : (
                            <span className="flex flex-col gap-1">
                              <span>Drag & drop your codebase</span>
                              <span className="text-white/40 font-normal">or click to browse</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/30 uppercase tracking-widest mt-2 font-semibold">
                          Max 20MB Limit • .zip, .ts, .py, etc.
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-4 relative z-10">
                    <button
                      type="submit"
                      disabled={loading}
                      className="relative w-full py-4 rounded-xl text-sm font-bold transition-all duration-300 group overflow-hidden bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 opacity-100 transition-opacity duration-500" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:200%_0,0_0] bg-no-repeat transition-all duration-1000 ease-out group-hover:bg-[position:-200%_0,0_0]" />
                      <span className="relative flex items-center justify-center gap-2">
                        Start AI Analysis
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-300"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                      </span>
                    </button>
                  </div>
                  
                  <div className="text-[10px] text-center pt-2 text-white/30 uppercase tracking-widest font-semibold flex items-center justify-center gap-2 relative z-10">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Secure Static Analysis • Auto-deleted in 1H
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Global styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        textarea::-webkit-scrollbar { width: 8px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.1); border-radius: 20px; }
      `}} />
    </div>
  );
}
