"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-pro");
  const [securityScan, setSecurityScan] = useState(true);
  const [strictProblemEvaluation, setStrictProblemEvaluation] = useState(true);
  const [diagnosticQuestionsCount, setDiagnosticQuestionsCount] = useState("5");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-zinc-950 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-200 px-8 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <h1 className="text-sm font-black tracking-wide text-zinc-950 uppercase font-mono">
            System Settings & Engine Configuration
          </h1>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-150 shadow-sm"
        >
          {saved ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Preferences Saved
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Configuration
            </>
          )}
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-8 max-w-4xl w-full mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Analyzer Engine Settings</h2>
          <p className="text-xs text-zinc-700 font-medium mt-1">
            Configure LLM reasoning backends, static AST parser flags, and diagnostic question parameters.
          </p>
        </div>

        {/* Section 1: AI Model */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-zinc-950">LLM Reasoning Engine</h3>
              <p className="text-xs text-zinc-600 font-medium">Select model backend for multi-agent synthesis and code grading.</p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-black">
              Active: Gemini Pro
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { id: "gemini-2.5-pro", title: "Gemini 2.5 Pro", desc: "Best for deep multi-file architectural reasoning" },
              { id: "gemini-2.5-flash", title: "Gemini 2.5 Flash", desc: "Ultra-fast execution for lightweight static scans" },
              { id: "gpt-4o", title: "GPT-4o (Fallback)", desc: "Secondary provider fallback via OpenAI key" },
            ].map((m) => (
              <label
                key={m.id}
                onClick={() => setGeminiModel(m.id)}
                className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  geminiModel === m.id
                    ? "border-emerald-500 bg-emerald-50/60 text-zinc-950 shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-950">{m.title}</span>
                    <input
                      type="radio"
                      name="model"
                      checked={geminiModel === m.id}
                      onChange={() => setGeminiModel(m.id)}
                      className="accent-emerald-600"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-600 font-medium mt-1 leading-snug">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Section 2: Audit Engine Toggles */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-black text-zinc-950 border-b border-zinc-100 pb-3">
            Static Analysis & Guardrails
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-950">Automated AST Security & Vulnerability Check</p>
                <p className="text-[11px] text-zinc-600 font-medium">Scans for SQL injection patterns, secret leakage, and insecure deserialization.</p>
              </div>
              <button
                type="button"
                onClick={() => setSecurityScan(!securityScan)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  securityScan ? "bg-emerald-600" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm transition-transform ${
                    securityScan ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-950">Strict Problem Statement Alignment</p>
                <p className="text-[11px] text-zinc-600 font-medium">Deducts points if the codebase does not explicitly satisfy the user-supplied prompt.</p>
              </div>
              <button
                type="button"
                onClick={() => setStrictProblemEvaluation(!strictProblemEvaluation)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  strictProblemEvaluation ? "bg-emerald-600" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm transition-transform ${
                    strictProblemEvaluation ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs font-bold text-zinc-950">Diagnostic Interview Questions Count</p>
                <p className="text-[11px] text-zinc-600 font-medium">Number of dynamic interactive questions generated per report.</p>
              </div>
              <select
                value={diagnosticQuestionsCount}
                onChange={(e) => setDiagnosticQuestionsCount(e.target.value)}
                className="bg-white border border-zinc-300 text-xs font-mono font-bold text-zinc-950 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 shadow-sm"
              >
                <option value="3">3 Questions</option>
                <option value="5">5 Questions (Recommended)</option>
                <option value="10">10 Questions (Deep Assessment)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Design & Environment Information */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6 space-y-3">
          <h3 className="text-sm font-black text-zinc-950 border-b border-zinc-100 pb-3">
            Design System & Account
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-zinc-600 font-semibold block">Theme Scheme</span>
              <span className="text-emerald-800 font-mono font-bold">Clean White &amp; Emerald Accent (#059669)</span>
            </div>
            <div>
              <span className="text-zinc-600 font-semibold block">Organization</span>
              <span className="text-zinc-950 font-mono font-bold">Deebug Autonomous Agent</span>
            </div>
            <div>
              <span className="text-zinc-600 font-semibold block">Account Tier</span>
              <span className="text-emerald-800 font-mono font-black">Pro License</span>
            </div>
            <div>
              <span className="text-zinc-600 font-semibold block">Local Runtime</span>
              <span className="text-zinc-950 font-mono font-bold">Next.js 14 / Turbopack / SQLite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
