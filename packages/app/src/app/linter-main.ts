// CHANGE: CLI entry point for vibecode-linter
// WHY: Provides command-line interface to run the linter
// QUOTE(TZ): "npx @ton-ai-core/vibecode-linter src/"
// REF: issue-1
// SOURCE: https://effect.website/docs/platform/runtime/ "runMain helps you execute a main effect"
// FORMAT THEOREM: forall args: main(args) = linter_output
// PURITY: SHELL
// EFFECT: Effect<void, ConfigError | CommandError, NodeContext>
// INVARIANT: Parses args, loads config, runs linter
// COMPLEXITY: O(n) where n = |commands|
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Effect, Layer, pipe } from "effect"

import { CommandExecutorLive } from "../shell/linter/command-executor.js"
import { ConfigLoaderLive } from "../shell/linter/config-loader.js"
import { linterProgram } from "./linter-program.js"

/**
 * Parses command line arguments.
 *
 * @returns Effect with parsed arguments
 *
 * @pure false - reads process.argv
 */
const parseArgs = Effect.sync(() => {
  const args = process.argv.slice(2)
  const directory = args[0] ?? "src/"
  const configPath = args[1] ?? "linter.config.json"
  const cwd = process.cwd()
  return { configPath, cwd, directory }
})

/**
 * Combined layer for all linter services.
 */
const LinterLive = Layer.merge(CommandExecutorLive, ConfigLoaderLive)

/**
 * Main program composition.
 */
const main = pipe(
  parseArgs,
  Effect.flatMap(({ configPath, cwd, directory }) => linterProgram(configPath, directory, cwd)),
  Effect.provide(LinterLive),
  Effect.provide(NodeContext.layer)
)

NodeRuntime.runMain(main)
