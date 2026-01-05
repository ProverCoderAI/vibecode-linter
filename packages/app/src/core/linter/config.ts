// CHANGE: Define linter configuration schema
// WHY: Type-safe configuration parsing for vibecode-linter
// QUOTE(TZ): "commands", "priorityLevels" from issue description
// REF: issue-1
// SOURCE: n/a
// FORMAT THEOREM: forall c in Config: parse(c) = valid(c) or error(c)
// PURITY: CORE
// INVARIANT: Configuration schema matches JSON structure from issue
// COMPLEXITY: O(1)
import * as S from "@effect/schema/Schema"

/**
 * Command configuration for running a specific linter/tool.
 *
 * @pure true
 * @invariant level >= 0
 */
export const CommandConfigSchema = S.Struct({
  commandName: S.NonEmptyString,
  command: S.NonEmptyString,
  isCommandFix: S.Boolean,
  level: S.Int.pipe(S.nonNegative())
})

export type CommandConfig = S.Schema.Type<typeof CommandConfigSchema>

/**
 * Priority level configuration for organizing rules.
 *
 * @pure true
 * @invariant level >= 1
 * @invariant rules.length > 0
 */
export const PriorityLevelSchema = S.Struct({
  level: S.Int.pipe(S.positive()),
  name: S.NonEmptyString,
  rules: S.NonEmptyArray(S.NonEmptyString)
})

export type PriorityLevel = S.Schema.Type<typeof PriorityLevelSchema>

/**
 * Full linter configuration schema.
 *
 * @pure true
 * @invariant commands may be empty array
 * @invariant priorityLevels may be empty array
 */
export const LinterConfigSchema = S.Struct({
  commands: S.optionalWith(S.Array(CommandConfigSchema), { default: () => [] }),
  priorityLevels: S.optionalWith(S.Array(PriorityLevelSchema), { default: () => [] })
})

export type LinterConfig = S.Schema.Type<typeof LinterConfigSchema>
