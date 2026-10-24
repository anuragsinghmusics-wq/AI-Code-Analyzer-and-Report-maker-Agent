# Deebug — Project Overview

## What it is
Deebug is an AI-powered code analyzer and report card generator. Submit a GitHub repo/ZIP/files and get a numeric executive report card across 10 categories with detected bugs (file+line), architecture improvements, and AI-generated interview questions.

## Tech Stack
- Frontend: Next.js 14, React 18, Tailwind CSS, NextAuth
- Backend: Node.js, BullMQ, ioredis (worker)
- AI: LangGraph JS + LangChain Core; providers Groq (Llama 3.3 70B), OpenRouter, Anthropic
- Static analysis: Tree-sitter (TS/Python/Go/Java)
- DB: Prisma + PostgreSQL/SQLite
- Monorepo: Turborepo + npm workspaces
- Validation: Zod, TypeScript 5; Logging: Pino

## Monorepo layout
- apps/web — Next.js frontend + API routes (SSE progress, leaderboard, reports)
- apps/worker — BullMQ background job processor
- packages/pipeline — LangGraph state machine (8 reviewer nodes)
- packages/parser — Tree-sitter AST static analysis
- packages/db — Prisma schema/migrations
- packages/shared — types, scoring constants, grade rubrics

## Pipeline phases
Ingest → Parse AST → Dependency graph → File analysis → 7 parallel deep dives (Architecture, Security, Performance, Logic, Quality, Bug hunting, Design) → optional AI-agent review → Report card → Interview questions → Save DB. Real-time progress via SSE.

## Scoring categories (weights)
Architecture 15%, Security 15%, Performance 12%, Maintainability 12%, Scalability 10%, Error handling 10%, Code quality 8%, Readability 7%, Testing 6%, Documentation 5%.

## Run
npm install; cp .env.example .env; (set keys); cd packages/db && npx prisma migrate dev; docker-compose up -d redis; npm run dev → web :3000 + worker.
