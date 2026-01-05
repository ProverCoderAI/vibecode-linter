// CHANGE: Configuration file loader
// WHY: Isolate file system access in SHELL layer
// QUOTE(TZ): "linter.config.json"
// REF: issue-1
// SOURCE: n/a
// FORMAT THEOREM: forall path in Paths: load(path) = Effect<LinterConfig, ConfigError, ConfigLoader>
// PURITY: SHELL
// EFFECT: Effect<LinterConfig, ConfigError, ConfigLoader>
// INVARIANT: Configuration is validated via Schema
// COMPLEXITY: O(1) + file read time
import * as S from "@effect/schema/Schema"
import { Context, Data, Effect, Layer, pipe } from "effect"
import { readFile } from "node:fs/promises"
import path from "node:path"

import { type LinterConfig, LinterConfigSchema } from "../../core/linter/config.js"

/**
 * JSON value type for safe parsing.
 * Used only at boundary for initial parsing before Schema validation.
 *
 * @pure true
 */
type JsonValue =
  | null
  | boolean
  | number
  | string
  | ReadonlyArray<JsonValue>
  | { readonly [k: string]: JsonValue }

/**
 * Error that occurs during configuration loading.
 *
 * @pure true
 */
export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly path: string
  readonly message: string
}> {}

/**
 * Service interface for loading linter configuration.
 *
 * @pure false - reads files
 */
export interface ConfigLoader {
  readonly load: (configPath: string) => Effect.Effect<LinterConfig, ConfigError>
}

export const ConfigLoader = Context.GenericTag<ConfigLoader>("ConfigLoader")

/**
 * Reads a config file from disk.
 *
 * @param configPath - Path to config file
 * @returns Effect with file content or ConfigError
 */
const readConfigFile = (configPath: string): Effect.Effect<string, ConfigError> =>
  Effect.tryPromise({
    catch: (err) =>
      new ConfigError({
        message: `Failed to read config file: ${String(err)}`,
        path: configPath
      }),
    try: () => readFile(path.resolve(configPath), "utf8")
  })

/**
 * Parses JSON content.
 *
 * @param content - Raw file content
 * @param configPath - Path for error reporting
 * @returns Effect with parsed JSON or ConfigError
 */
const parseJsonContent = (content: string, configPath: string): Effect.Effect<JsonValue, ConfigError> =>
  Effect.try({
    catch: (err) =>
      new ConfigError({
        message: `Invalid JSON in config file: ${String(err)}`,
        path: configPath
      }),
    try: (): JsonValue => JSON.parse(content) as JsonValue
  })

/**
 * Validates JSON against LinterConfigSchema.
 *
 * @param json - Parsed JSON value
 * @param configPath - Path for error reporting
 * @returns Effect with validated LinterConfig or ConfigError
 */
const validateConfig = (json: JsonValue, configPath: string): Effect.Effect<LinterConfig, ConfigError> =>
  S.decodeUnknown(LinterConfigSchema)(json).pipe(
    Effect.mapError(
      (err) =>
        new ConfigError({
          message: `Invalid config schema: ${String(err)}`,
          path: configPath
        })
    )
  )

/**
 * Live implementation of ConfigLoader using fs.
 *
 * @pure false - file system access
 * @effect File system read
 */
const makeConfigLoader = (): ConfigLoader => ({
  load: (configPath) =>
    pipe(
      readConfigFile(configPath),
      Effect.flatMap((content) => parseJsonContent(content, configPath)),
      Effect.flatMap((json) => validateConfig(json, configPath))
    )
})

export const ConfigLoaderLive = Layer.succeed(ConfigLoader, makeConfigLoader())
