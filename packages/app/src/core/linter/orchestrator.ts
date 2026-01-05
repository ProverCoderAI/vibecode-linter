// CHANGE: Linter orchestration logic
// WHY: Pure business logic for coordinating linting steps
// QUOTE(TZ): "commands with level 0 run first as fix commands"
// REF: issue-1
// SOURCE: n/a
// FORMAT THEOREM: forall config: orchestrate(config) = ordered_steps
// PURITY: CORE
// INVARIANT: Commands are sorted by level, fix commands run before diagnostics
// COMPLEXITY: O(n log n) where n = |commands|
import { Array as A, Order } from "effect"

import type { CommandConfig, LinterConfig } from "./config.js"
import type { LintStep } from "./types.js"

/**
 * Order for sorting commands by level (ascending).
 *
 * @pure true
 * @invariant Lower levels come first
 */
const commandByLevel: Order.Order<CommandConfig> = Order.mapInput(Order.number, (c) => c.level)

/**
 * Separates commands into fix and diagnostic groups.
 *
 * @param commands - Array of command configurations
 * @returns Tuple of [diagnosticCommands, fixCommands]
 *
 * @pure true
 * @invariant isCommandFix = true -> fixCommands, else diagnosticCommands
 * @complexity O(n)
 */
export const partitionCommands = (
  commands: ReadonlyArray<CommandConfig>
): readonly [ReadonlyArray<CommandConfig>, ReadonlyArray<CommandConfig>] => A.partition(commands, (c) => c.isCommandFix)

/**
 * Sorts commands by their level in ascending order.
 *
 * @param commands - Array of command configurations
 * @returns Sorted array by level
 *
 * @pure true
 * @invariant forall i < j: result[i].level <= result[j].level
 * @complexity O(n log n)
 */
export const sortByLevel = (commands: ReadonlyArray<CommandConfig>): ReadonlyArray<CommandConfig> =>
  A.sort(commands, commandByLevel)

/**
 * Generates lint steps from configuration for a given directory.
 *
 * @param config - Linter configuration
 * @param directory - Target directory to lint
 * @returns Array of lint steps in execution order
 *
 * @pure true
 * @invariant Steps are ordered: LintingDirectory -> RunningFix* -> RunningDiagnostics*
 * @complexity O(n log n) where n = |commands|
 */
export const generateLintSteps = (config: LinterConfig, directory: string): ReadonlyArray<LintStep> => {
  const [diagnosticCommands, fixCommands] = partitionCommands(config.commands)
  const sortedFixCommands = sortByLevel(fixCommands)
  const sortedDiagnosticCommands = sortByLevel(diagnosticCommands)

  const steps: Array<LintStep> = [{ _tag: "LintingDirectory", directory }]

  for (const cmd of sortedFixCommands) {
    steps.push({
      _tag: "RunningFix",
      command: cmd.command,
      directory,
      toolName: cmd.commandName
    })
  }

  for (const cmd of sortedDiagnosticCommands) {
    steps.push({
      _tag: "RunningDiagnostics",
      command: cmd.command,
      directory,
      toolName: cmd.commandName
    })
  }

  return steps
}

/**
 * Replaces directory placeholder in command string.
 *
 * @param command - Command template string
 * @param directory - Directory to substitute
 * @returns Command with directory substituted
 *
 * @pure true
 * @invariant "${directory}" or the literal directory path is substituted
 * @complexity O(n) where n = |command|
 */
export const substituteDirectory = (command: string, directory: string): string =>
  command.replaceAll("${directory}", directory).replaceAll("\"src/\"", `"${directory}"`)
