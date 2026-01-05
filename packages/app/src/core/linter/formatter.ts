// CHANGE: Pure formatter for linting output
// WHY: Separate presentation logic from business logic
// QUOTE(TZ): "Linting directory: src/", "Running ESLint auto-fix on: src/"
// REF: issue-1
// SOURCE: n/a
// FORMAT THEOREM: forall step in LintStep: format(step) = emoji + text
// PURITY: CORE
// INVARIANT: Pure string transformation, no side effects
// COMPLEXITY: O(1)
import { Match } from "effect"

import type { DiagnosticSummary, LintStep } from "./types.js"

/**
 * Formats a linting step into human-readable output.
 *
 * @param step - The linting step to format
 * @returns Formatted string with emoji prefix
 *
 * @pure true
 * @invariant Output always starts with an emoji
 * @complexity O(1) time / O(1) space
 */
export const formatLintStep = (step: LintStep): string =>
  Match.value(step).pipe(
    Match.when({ _tag: "LintingDirectory" }, ({ directory }) => `\uD83D\uDCCB Linting directory: ${directory}`),
    Match.when(
      { _tag: "RunningFix" },
      ({ command, directory, toolName }) =>
        `\uD83D\uDD27 Running ${toolName} auto-fix on: ${directory}\n   \u21B3 Command: ${command}`
    ),
    Match.when({ _tag: "FixCompleted" }, ({ passes, toolName }) =>
      passes === undefined
        ? `\u2705 ${toolName} auto-fix completed`
        : `\u2705 ${toolName} auto-fix completed (${passes} passes)`),
    Match.when(
      { _tag: "RunningDiagnostics" },
      ({ command, directory, toolName }) =>
        `\uD83E\uDDEA Running ${toolName} diagnostics on: ${directory}\n   \u21B3 Command: ${command}`
    ),
    Match.when({ _tag: "FallbackCheck" }, ({ toolName }) =>
      `\uD83D\uDD04 ${toolName}: Falling back to individual file checking...`),
    Match.when({ _tag: "Summary" }, ({ summary }) =>
      formatSummary(summary)),
    Match.exhaustive
  )

/**
 * Formats the diagnostic summary.
 *
 * @param summary - The diagnostic summary to format
 * @returns Formatted summary string
 *
 * @pure true
 * @invariant Output contains total error and warning counts
 * @complexity O(1) time / O(1) space
 */
export const formatSummary = (summary: DiagnosticSummary): string => {
  const errorBreakdown =
    `${summary.typescriptErrors} TypeScript, ${summary.eslintErrors} ESLint, ${summary.biomeErrors} Biome`
  return `\n\uD83D\uDCCA Total: ${summary.totalErrors} errors (${errorBreakdown}), ${summary.totalWarnings} warnings.`
}
