import { z } from "zod";

export const TraitAxisEnum = z.enum([
  "riskAwareness",       // security / failure-mode sensitivity
  "systemsThinking",     // local patch vs. architectural fix
  "pragmatism",          // ships workable vs. over-engineers
  "ownershipDepth",      // understands *why* vs. pattern-matched
  "tradeoffAwareness",   // can articulate cost of their own choice
]);

export type TraitAxis = z.infer<typeof TraitAxisEnum>;

export const DiagnosticOptionSchema = z.object({
  id: z.enum(["A", "B", "C", "D"]),
  text: z.string(),               // the option as the candidate reads it
  rationale: z.string(),          // internal-only: why an engineer might pick this
  traitSignal: z.string(),        // short label, e.g. "ships-fast-accepts-risk"
  axisWeights: z.record(TraitAxisEnum, z.number().min(-2).max(2)),
});

export type DiagnosticOption = z.infer<typeof DiagnosticOptionSchema>;

export const DiagnosticQuestionSchema = z.object({
  id: z.string(),
  codeEvidence: z.object({
    file: z.string(),
    lineRange: z.tuple([z.number(), z.number()]),
    snippet: z.string(),
  }),
  phaseSource: z.enum([
    "architecture", "dataFlow", "concurrency", "quality", "security", "aiAgentReview", "bugHunting"
  ]),
  stem: z.string(),                // the scenario/question text
  options: z.array(DiagnosticOptionSchema).length(4),
  // NOTE: no `correctAnswer` field — by design
});

export type DiagnosticQuestion = z.infer<typeof DiagnosticQuestionSchema>;

export const CandidateProfileSchema = z.object({
  riskAwareness: z.number(),
  systemsThinking: z.number(),
  pragmatism: z.number(),
  ownershipDepth: z.number(),
  tradeoffAwareness: z.number(),
  dominantTraits: z.array(z.string()), // top traitSignals across all answers
});

export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;
