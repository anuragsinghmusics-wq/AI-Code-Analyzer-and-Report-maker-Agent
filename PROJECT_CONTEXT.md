# Project Context: Autonomous Code Analyzer & Report Card Agent (Deebug)

## 1. High-Level Overview
We are building an **Autonomous AI Code Analysis & Grading Platform** (a multi-agent automated code review and hackathon grading engine). It ingests source code submissions (single files, ZIP bundles, or GitHub repository URLs), builds a semantic structural abstraction using static parsing and dependency mapping, and orchestrates an **8-phase deep automated AI code inspection pipeline** using LangGraph. Finally, it generates a strict **Executive Report Card** complete with numeric category grades (0.0 – 10.0), specific code evidence, actionable architectural improvements, automated interview questions, and cohort rankings.

---

## 2. Technology Stack & Monorepo Architecture
The project is built as a **Turborepo Monorepo** (using `npm` and Node >= 20.0.0) utilizing TypeScript across all packages. The architecture is split into specific apps and packages:

### Applications
- **`@code-analyzer/web` (Frontend):** 
  - Framework: Next.js 14 (App Router), React 18, Tailwind CSS, PostCSS.
  - Features: NextAuth for authentication, `@auth/prisma-adapter`.
  - Roles: Handles code submission workflows, live analysis progress streaming via Server-Sent Events / state polling, and rich Report Card interactive dashboards including an `evaluate-interview` API (using Groq/OpenRouter and Llama 3.3).
  - Integrations: BullMQ & ioredis for job queue management.

- **`@code-analyzer/worker` (Backend Job Processor):**
  - Framework: Node.js executed via `tsx` / `tsc`.
  - Roles: Background polling worker that decouples intensive AI inference jobs from the web server. It executes the LangGraph analysis state machine in watch mode.
  - Integrations: BullMQ, ioredis, and direct dependencies on the `@code-analyzer/pipeline` and `@code-analyzer/db`.

### Packages
- **`@code-analyzer/pipeline` (AI & Workflow Engine):**
  - Framework: LangGraph JS (`@langchain/langgraph`), LangChain (`@langchain/core`).
  - Integrations: Groq (`llama-3.3-70b-versatile`) via OpenAI SDK, Anthropic (`@anthropic-ai/sdk`), Zod for schema validation, and `js-tiktoken`.
  - Roles: Orchestrates the parallel LLM state machine, implements the `ai-agent-review` and `question-gen` nodes for deep inspection.
  
- **`@code-analyzer/parser` (Static Analysis):**
  - Framework: `tree-sitter` bindings (`tree-sitter-typescript`, `tree-sitter-python`).
  - Roles: Uses Tree-sitter and AST extraction to generate dependency graphs, cyclomatic complexity scores, and interface/function definitions *before* any LLM inference occurs.
  
- **`@code-analyzer/db` (Persistence Layer):**
  - Framework: Prisma ORM (`@prisma/client`).
  - Roles: Backed by PostgreSQL / SQLite managing jobs, submissions, hackathons, user telemetry, and stored analysis artifacts.
  
- **`@code-analyzer/shared` (Common Types & Constants):**
  - Framework: Zod, Pino (for logging).
  - Roles: Shared TypeScript interfaces, grading rubrics (`scoring.constants.ts`), scoring weight definitions, and category score thresholds across frontend and backend services.

---

## 3. The Comprehensive Analytical Review Pipeline
Our evaluation engine transitions through a LangGraph directed state machine (`PipelineState`), where each node processes prior AST findings and AI critiques to build upon the context. The process is orchestrated in several distinct phases, utilizing parallel execution to optimize speed and handle API rate limits:

1. **Ingest & Parse (AST & Structural Parsing):** Retrieves code (GitHub/Zip), extracts functions, classes, imports/exports, cyclomatic complexity, and checks for circular dependency cycles via a structural dependency graph.
2. **File-Level Analysis:** Evaluates each individual file for its responsibility, public API design, internal complexity rating, and immediate bugs.
3. **Parallel Deep Dives:** Executes 7 deep-dive LLM reviews concurrently (staggered to manage RPM limits):
   - **Architecture & Structure Review:** Detects design patterns (MVC, Microservices, Clean Architecture, RAG, LangGraph, etc.) and flags layering violations.
   - **Data Flow & State Management:** Traces end-to-end user journeys, state mutations, and validation boundaries.
   - **Logic & Concurrency Inspection:** Hunts for race conditions, authentication flaws, and state corruption.
   - **Quality Review:** Evaluates code rigor across core engineering dimensions.
   - **Bug Hunting & Security:** Categorizes exploits, antipatterns, and logic faults with fix suggestions.
   - **Performance Review:** Identifies static bottlenecks, O(n²) algorithms, N+1 queries, unnecessary re-renders, and memory overhead.
   - **Design Review:** Evaluates adherence to SOLID principles, abstraction levels, and overall design issues.
4. **Specialized AI-Agent Code Review (Conditional):** If AI framework usage (LangGraph, RAG, tool calling) is detected, it triggers specialized multi-agent architectural evaluations (`ai-agent-review.node.ts`).
5. **Diagnostics Generation:** Synthesizes top findings from previous phases (security bugs, architectural violations, logic issues) and automatically generates tailored interview-style diagnostic questions based on the exact flaws found in the codebase (`question-gen.node.ts`).
6. **Executive Synthesis (Report Card & Question Gen):** Aggregates all insights to generate a strict, final Report Card (`report-card.prompt.ts`) with numeric category grades, actionable architectural improvements, and automated interview questions, saving the final analysis to the database.

---

## 4. Recent Technical Enhancements & Current Strictness Engine
To elevate this system from a simple analyzer into an **Enterprise-Grade Automated Auditor**, we have made several strictness and reliability upgrades:
- **Uncompromising Production Grading Mandate:** We upgraded system prompts and scoring rubrics to apply zero tolerance for missing try/catch bounds, hardcoded credentials, unvalidated inputs, or tightly coupled architectural layers. Average prototype code is strictly graded in C, D, or F tiers; A and B grades are reserved solely for production-hardened implementations.
- **Granular Phase-by-Phase Score Reasoning:** Rather than generating unexplained numbers, `CategoryScore` now implements an explicit `scoreReasoning` field. The executive synthesis node feeds deep diagnostic outputs from all prior 8 evaluation phases directly into the grading prompt, mandating a written rationale explaining why specific numeric deductions occurred.
- **Expanded Grade Enum & Threshold Tolerance:** Expanded our Zod validation enums and TypeScript types to support the entire spectrum of letter grades (`A+`, `A`, `A-`, `B+`, `B`, `B-`, `C+`, `C`, `C-`, `D+`, `D`, `D-`, `F`) to ensure zero failure rates when LLMs generate realistic plus/minus academic tiering.
- **Proactive Rate-Limit Management & Retry Logic:** Integrated automated delay throttling (`withRetry` in `llm.ts`) with custom exponential backoff to handle free-tier TPM (Tokens Per Minute) limits gracefully on providers like Groq without crashing background tasks.
- **Interactive UI Presentation:** The Next.js dashboard renders high-contrast badges for **"⚖️ Why This Score"** (score rationale), structured breakdown grids, actionable bug-fix code diff recommendations, and interactive AI evaluation interviews.

---

## 5. Areas for Future Brainstorming & Major Improvements
We are looking to brainstorm major architectural and feature improvements, such as:
1. **Multi-Agent Debate / Peer Review:** Using dual LLM agents (e.g., an aggressive Security Hacker agent vs. a Pragmatic Staff Architect agent) to debate findings and achieve higher precision before assigning final grades.
2. **Auto-Remediation & Pull Request Generation:** Extending the pipeline from static reporting to generating verified GitHub PR fixes and unit tests using execution sandboxing.
3. **Smart Context Window Compression / RAG for Mega-Repos:** Improving token efficiency when ingesting repositories exceeding 50,000 LOC by implementing semantic embeddings or graph-based import trimming.
4. **Custom Team / Hackathon Rule Evaluation:** Allowing hackathon organizers or enterprise engineering teams to feed custom `.deebug-rules` yaml contracts or compliance rubrics into the LangGraph state machine.
