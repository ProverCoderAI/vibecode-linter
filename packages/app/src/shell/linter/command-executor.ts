// CHANGE: Command execution service for running shell commands
// WHY: Isolate all side effects in SHELL layer
// QUOTE(TZ): "npx eslint", "npx biome check"
// REF: issue-1
// SOURCE: n/a
// FORMAT THEOREM: forall cmd in Commands: execute(cmd) = Effect<CommandResult, CommandError, CommandExecutor>
// PURITY: SHELL
// EFFECT: Effect<CommandResult, CommandError, CommandExecutor>
// INVARIANT: All command execution is through this service
// COMPLEXITY: O(1) + command execution time
import { Context, Data, Effect, Layer, pipe } from "effect"
import { exec } from "node:child_process"

import { CommandResult } from "../../core/linter/types.js"

/**
 * Error that occurs during command execution.
 *
 * @pure true
 */
export class CommandError extends Data.TaggedError("CommandError")<{
  readonly command: string
  readonly message: string
  readonly exitCode: number
  readonly stderr: string
}> {}

/**
 * Service interface for executing shell commands.
 *
 * @pure false - executes shell commands
 */
export interface CommandExecutor {
  readonly execute: (
    commandName: string,
    command: string,
    cwd: string
  ) => Effect.Effect<CommandResult, CommandError>
}

export const CommandExecutor = Context.GenericTag<CommandExecutor>("CommandExecutor")

/**
 * Executes a shell command using Effect.async for callback-based APIs.
 *
 * @param commandName - Human readable name for the command
 * @param command - The shell command string to execute
 * @param cwd - Working directory for command execution
 * @returns Effect with CommandResult or CommandError
 *
 * @pure false - spawns processes
 * @effect Process spawning, IO
 * @complexity O(1) + command execution time
 */
const executeCommand = (
  commandName: string,
  command: string,
  cwd: string
): Effect.Effect<CommandResult, CommandError> =>
  pipe(
    Effect.sync(() => Date.now()),
    Effect.flatMap((startTime) =>
      pipe(
        Effect.async<{ exitCode: number; stderr: string; stdout: string }, CommandError>((resume) => {
          // SECURITY: Command execution is intentional - commands come from trusted linter.config.json
          // sonarjs/os-command: This is the core functionality of the linter tool
          exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => { // NOSONAR
            const code = error?.code ?? 0
            const exitCode = typeof code === "number" ? code : 1
            resume(Effect.succeed({ exitCode, stderr, stdout }))
          })
        }),
        Effect.map(({ exitCode, stderr, stdout }) =>
          new CommandResult({
            commandName,
            durationMs: Date.now() - startTime,
            exitCode,
            stderr,
            stdout
          })
        )
      )
    )
  )

/**
 * Live implementation of CommandExecutor using child_process.
 *
 * @pure false - spawns processes
 * @effect Process spawning, IO
 */
const makeCommandExecutor = (): CommandExecutor => ({
  execute: executeCommand
})

export const CommandExecutorLive = Layer.succeed(CommandExecutor, makeCommandExecutor())
