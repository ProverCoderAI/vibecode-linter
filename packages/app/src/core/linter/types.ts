// CHANGE: Define linter domain types
// WHY: Type-safe representation of linter execution state and results
// QUOTE(TZ): n/a
// REF: issue-1
// SOURCE: n/a
// FORMAT THEOREM: forall r in Result: error_count(r) >= 0 and warning_count(r) >= 0
// PURITY: CORE
// INVARIANT: All counts are non-negative integers
// COMPLEXITY: O(1)
import { Data } from "effect"

/**
 * Represents the outcome of a single command execution.
 *
 * @pure true
 * @invariant exitCode >= 0
 */
export class CommandResult extends Data.Class<{
  readonly commandName: string
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
  readonly durationMs: number
}> {}

/**
 * Diagnostic entry from a linter.
 *
 * @pure true
 */
export class Diagnostic extends Data.Class<{
  readonly source: "typescript" | "eslint" | "biome"
  readonly file: string
  readonly line: number
  readonly column: number
  readonly message: string
  readonly ruleId: string
  readonly severity: "error" | "warning"
}> {}

/**
 * Summary of all diagnostics.
 *
 * @pure true
 * @invariant all counts >= 0
 */
export class DiagnosticSummary extends Data.Class<{
  readonly typescriptErrors: number
  readonly eslintErrors: number
  readonly biomeErrors: number
  readonly totalErrors: number
  readonly totalWarnings: number
}> {}

/**
 * Step in the linting process for output formatting.
 *
 * @pure true
 */
export type LintStep =
  | { readonly _tag: "LintingDirectory"; readonly directory: string }
  | { readonly _tag: "RunningFix"; readonly toolName: string; readonly directory: string; readonly command: string }
  | { readonly _tag: "FixCompleted"; readonly toolName: string; readonly passes?: number }
  | {
    readonly _tag: "RunningDiagnostics"
    readonly toolName: string
    readonly directory: string
    readonly command: string
  }
  | { readonly _tag: "FallbackCheck"; readonly toolName: string }
  | { readonly _tag: "Summary"; readonly summary: DiagnosticSummary }
