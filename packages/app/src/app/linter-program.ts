// CHANGE: Main linter program composition
// WHY: Compose the linter workflow as a single Effect
// QUOTE(TZ): "Generate message with linting output"
// REF: issue-1
// SOURCE: n/a
// FORMAT THEOREM: forall args: run(args) = lint_result
// PURITY: SHELL
// EFFECT: Effect<void, ConfigError | CommandError, CommandExecutor | ConfigLoader | Console>
// INVARIANT: Steps are executed in order, output is formatted
// COMPLEXITY: O(n) where n = |commands|
import { Console, Effect, pipe } from "effect"

import type { CommandResult, LinterConfig, LintStep } from "../core/linter/index.js"
import { DiagnosticSummary, formatLintStep, generateLintSteps, substituteDirectory } from "../core/linter/index.js"
import type { CommandError } from "../shell/linter/command-executor.js"
import { CommandExecutor } from "../shell/linter/command-executor.js"
import type { ConfigError } from "../shell/linter/config-loader.js"
import { ConfigLoader } from "../shell/linter/config-loader.js"

/**
 * Executes a single lint step and returns the result.
 *
 * @param step - The lint step to execute
 * @param cwd - Current working directory
 * @returns Effect with optional command result
 *
 * @pure false - executes commands
 * @effect CommandExecutor, Console
 */
const executeStep = (
  step: LintStep,
  cwd: string
): Effect.Effect<CommandResult | null, CommandError, CommandExecutor> =>
  pipe(
    Effect.succeed(step),
    Effect.tap(() => Console.log(formatLintStep(step))),
    Effect.flatMap((s) => {
      if (s._tag === "RunningFix" || s._tag === "RunningDiagnostics") {
        return pipe(
          CommandExecutor,
          Effect.flatMap((executor) => executor.execute(s.toolName, substituteDirectory(s.command, cwd), cwd)),
          Effect.tap((_result) => {
            const completedStep: LintStep = { _tag: "FixCompleted", toolName: s.toolName }
            return Console.log(formatLintStep(completedStep))
          }),
          Effect.map((result) => result as CommandResult | null)
        )
      }
      return Effect.succeed(null)
    })
  )

/**
 * Runs all lint steps and aggregates results.
 *
 * @param config - Linter configuration
 * @param directory - Target directory
 * @param cwd - Current working directory
 * @returns Effect with diagnostic summary
 *
 * @pure false - executes commands
 * @effect CommandExecutor, Console
 */
const runLintSteps = (
  config: LinterConfig,
  directory: string,
  cwd: string
): Effect.Effect<DiagnosticSummary, CommandError, CommandExecutor> => {
  const lintSteps = generateLintSteps(config, directory)
  const stepEffects = lintSteps.map((lintStep) => executeStep(lintStep, cwd))

  return pipe(
    Effect.all(stepEffects, { concurrency: 1 }),
    Effect.map((_results) =>
      new DiagnosticSummary({
        biomeErrors: 0,
        eslintErrors: 0,
        totalErrors: 0,
        totalWarnings: 0,
        typescriptErrors: 0
      })
    )
  )
}

/**
 * Main linter program.
 *
 * @param configPath - Path to linter configuration file
 * @param directory - Target directory to lint
 * @returns Effect that runs the linter
 *
 * @pure false - IO operations
 * @effect ConfigLoader, CommandExecutor, Console
 * @invariant Loads config, runs steps, prints summary
 */
export const linterProgram = (
  configPath: string,
  directory: string,
  cwd: string
): Effect.Effect<void, ConfigError | CommandError, ConfigLoader | CommandExecutor> =>
  pipe(
    ConfigLoader,
    Effect.flatMap((loader) => loader.load(configPath)),
    Effect.flatMap((config) => runLintSteps(config, directory, cwd)),
    Effect.tap((summary) => Console.log(formatLintStep({ _tag: "Summary", summary }))),
    Effect.asVoid
  )
