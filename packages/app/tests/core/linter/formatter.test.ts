import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"

import { formatLintStep, formatSummary } from "../../../src/core/linter/formatter.js"
import { DiagnosticSummary, type LintStep } from "../../../src/core/linter/types.js"

describe("formatLintStep", () => {
  it.effect("formats LintingDirectory step", () =>
    Effect.sync(() => {
      const step: LintStep = { _tag: "LintingDirectory", directory: "src/" }
      const result = formatLintStep(step)
      expect(result).toContain("Linting directory: src/")
    }))

  it.effect("formats RunningFix step", () =>
    Effect.sync(() => {
      const step: LintStep = {
        _tag: "RunningFix",
        command: "npx eslint --fix src/",
        directory: "src/",
        toolName: "ESLint"
      }
      const result = formatLintStep(step)
      expect(result).toContain("Running ESLint auto-fix on: src/")
      expect(result).toContain("Command: npx eslint --fix src/")
    }))

  it.effect("formats FixCompleted step without passes", () =>
    Effect.sync(() => {
      const step: LintStep = { _tag: "FixCompleted", toolName: "ESLint" }
      const result = formatLintStep(step)
      expect(result).toContain("ESLint auto-fix completed")
      expect(result).not.toContain("passes")
    }))

  it.effect("formats FixCompleted step with passes", () =>
    Effect.sync(() => {
      const step: LintStep = { _tag: "FixCompleted", passes: 3, toolName: "Biome" }
      const result = formatLintStep(step)
      expect(result).toContain("Biome auto-fix completed (3 passes)")
    }))

  it.effect("formats RunningDiagnostics step", () =>
    Effect.sync(() => {
      const step: LintStep = {
        _tag: "RunningDiagnostics",
        command: "npx eslint --format json src/",
        directory: "src/",
        toolName: "ESLint"
      }
      const result = formatLintStep(step)
      expect(result).toContain("Running ESLint diagnostics on: src/")
      expect(result).toContain("Command: npx eslint --format json src/")
    }))

  it.effect("formats FallbackCheck step", () =>
    Effect.sync(() => {
      const step: LintStep = { _tag: "FallbackCheck", toolName: "Biome" }
      const result = formatLintStep(step)
      expect(result).toContain("Biome: Falling back to individual file checking...")
    }))

  it.effect("formats Summary step", () =>
    Effect.sync(() => {
      const summary = new DiagnosticSummary({
        biomeErrors: 1,
        eslintErrors: 2,
        totalErrors: 3,
        totalWarnings: 5,
        typescriptErrors: 0
      })
      const step: LintStep = { _tag: "Summary", summary }
      const result = formatLintStep(step)
      expect(result).toContain("Total: 3 errors")
      expect(result).toContain("0 TypeScript, 2 ESLint, 1 Biome")
      expect(result).toContain("5 warnings")
    }))
})

describe("formatSummary", () => {
  it.effect("formats zero errors and warnings", () =>
    Effect.sync(() => {
      const summary = new DiagnosticSummary({
        biomeErrors: 0,
        eslintErrors: 0,
        totalErrors: 0,
        totalWarnings: 0,
        typescriptErrors: 0
      })
      const result = formatSummary(summary)
      expect(result).toContain("Total: 0 errors")
      expect(result).toContain("0 warnings")
    }))

  it.effect("formats with all error types", () =>
    Effect.sync(() => {
      const summary = new DiagnosticSummary({
        biomeErrors: 1,
        eslintErrors: 2,
        totalErrors: 6,
        totalWarnings: 10,
        typescriptErrors: 3
      })
      const result = formatSummary(summary)
      expect(result).toContain("3 TypeScript")
      expect(result).toContain("2 ESLint")
      expect(result).toContain("1 Biome")
    }))
})
