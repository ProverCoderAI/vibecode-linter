import * as S from "@effect/schema/Schema"
import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"

import {
  CommandConfigSchema,
  LinterConfigSchema,
  PriorityLevelSchema
} from "../../../src/core/linter/config.js"

describe("CommandConfigSchema", () => {
  it.effect("decodes valid command config", () =>
    Effect.gen(function*(_) {
      const input = {
        command: "npx eslint src/",
        commandName: "eslint",
        isCommandFix: true,
        level: 0
      }
      const result = yield* _(S.decodeUnknown(CommandConfigSchema)(input))
      expect(result.commandName).toBe("eslint")
      expect(result.command).toBe("npx eslint src/")
      expect(result.isCommandFix).toBe(true)
      expect(result.level).toBe(0)
    }))

  it.effect("rejects empty commandName", () =>
    Effect.gen(function*(_) {
      const input = {
        command: "npx eslint",
        commandName: "",
        isCommandFix: false,
        level: 0
      }
      const result = yield* _(
        S.decodeUnknown(CommandConfigSchema)(input).pipe(
          Effect.either
        )
      )
      expect(result._tag).toBe("Left")
    }))

  it.effect("rejects negative level", () =>
    Effect.gen(function*(_) {
      const input = {
        command: "npx eslint",
        commandName: "eslint",
        isCommandFix: false,
        level: -1
      }
      const result = yield* _(
        S.decodeUnknown(CommandConfigSchema)(input).pipe(
          Effect.either
        )
      )
      expect(result._tag).toBe("Left")
    }))
})

describe("PriorityLevelSchema", () => {
  it.effect("decodes valid priority level", () =>
    Effect.gen(function*(_) {
      const input = {
        level: 1,
        name: "Critical Errors",
        rules: ["ts(2307)", "ts(2835)"]
      }
      const result = yield* _(S.decodeUnknown(PriorityLevelSchema)(input))
      expect(result.level).toBe(1)
      expect(result.name).toBe("Critical Errors")
      expect(result.rules).toEqual(["ts(2307)", "ts(2835)"])
    }))

  it.effect("rejects level 0", () =>
    Effect.gen(function*(_) {
      const input = {
        level: 0,
        name: "Invalid",
        rules: ["rule1"]
      }
      const result = yield* _(
        S.decodeUnknown(PriorityLevelSchema)(input).pipe(
          Effect.either
        )
      )
      expect(result._tag).toBe("Left")
    }))

  it.effect("rejects empty rules array", () =>
    Effect.gen(function*(_) {
      const input = {
        level: 1,
        name: "Empty Rules",
        rules: []
      }
      const result = yield* _(
        S.decodeUnknown(PriorityLevelSchema)(input).pipe(
          Effect.either
        )
      )
      expect(result._tag).toBe("Left")
    }))
})

describe("LinterConfigSchema", () => {
  it.effect("decodes full config", () =>
    Effect.gen(function*(_) {
      const input = {
        commands: [
          {
            command: "npx eslint --fix src/",
            commandName: "eslint",
            isCommandFix: true,
            level: 0
          }
        ],
        priorityLevels: [
          {
            level: 1,
            name: "Critical",
            rules: ["ts(2307)"]
          }
        ]
      }
      const result = yield* _(S.decodeUnknown(LinterConfigSchema)(input))
      expect(result.commands.length).toBe(1)
      expect(result.priorityLevels.length).toBe(1)
    }))

  it.effect("provides defaults for missing fields", () =>
    Effect.gen(function*(_) {
      const input = {}
      const result = yield* _(S.decodeUnknown(LinterConfigSchema)(input))
      expect(result.commands).toEqual([])
      expect(result.priorityLevels).toEqual([])
    }))
})
