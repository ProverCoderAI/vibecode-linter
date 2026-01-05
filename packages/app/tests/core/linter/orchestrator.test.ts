import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"

import type { CommandConfig } from "../../../src/core/linter/config.js"
import {
  generateLintSteps,
  partitionCommands,
  sortByLevel,
  substituteDirectory
} from "../../../src/core/linter/orchestrator.js"

describe("partitionCommands", () => {
  it.effect("separates fix and diagnostic commands", () =>
    Effect.sync(() => {
      const commands: ReadonlyArray<CommandConfig> = [
        { command: "eslint --fix", commandName: "eslint-fix", isCommandFix: true, level: 0 },
        { command: "eslint --check", commandName: "eslint-check", isCommandFix: false, level: 1 },
        { command: "biome --write", commandName: "biome-fix", isCommandFix: true, level: 0 }
      ]
      const [diagnosticCmds, fixCmds] = partitionCommands(commands)
      expect(fixCmds.length).toBe(2)
      expect(diagnosticCmds.length).toBe(1)
      expect(fixCmds.every((c) => c.isCommandFix)).toBe(true)
      expect(diagnosticCmds.every((c) => !c.isCommandFix)).toBe(true)
    }))

  it.effect("handles empty array", () =>
    Effect.sync(() => {
      const [diagnosticCmds, fixCmds] = partitionCommands([])
      expect(fixCmds).toEqual([])
      expect(diagnosticCmds).toEqual([])
    }))
})

describe("sortByLevel", () => {
  it.effect("sorts commands by level ascending", () =>
    Effect.sync(() => {
      const commands: ReadonlyArray<CommandConfig> = [
        { command: "cmd2", commandName: "cmd2", isCommandFix: false, level: 2 },
        { command: "cmd0", commandName: "cmd0", isCommandFix: false, level: 0 },
        { command: "cmd1", commandName: "cmd1", isCommandFix: false, level: 1 }
      ]
      const sorted = sortByLevel(commands)
      expect(sorted[0]?.level).toBe(0)
      expect(sorted[1]?.level).toBe(1)
      expect(sorted[2]?.level).toBe(2)
    }))

  it.effect("preserves order for same level", () =>
    Effect.sync(() => {
      const commands: ReadonlyArray<CommandConfig> = [
        { command: "first", commandName: "first", isCommandFix: false, level: 0 },
        { command: "second", commandName: "second", isCommandFix: false, level: 0 }
      ]
      const sorted = sortByLevel(commands)
      expect(sorted[0]?.commandName).toBe("first")
      expect(sorted[1]?.commandName).toBe("second")
    }))
})

describe("generateLintSteps", () => {
  it.effect("generates steps in correct order", () =>
    Effect.sync(() => {
      const config = {
        commands: [
          { command: "eslint --check", commandName: "eslint", isCommandFix: false, level: 1 },
          { command: "eslint --fix", commandName: "eslint-fix", isCommandFix: true, level: 0 }
        ],
        priorityLevels: []
      }
      const steps = generateLintSteps(config, "src/")
      expect(steps.length).toBe(3)
      expect(steps[0]?._tag).toBe("LintingDirectory")
      expect(steps[1]?._tag).toBe("RunningFix")
      expect(steps[2]?._tag).toBe("RunningDiagnostics")
    }))

  it.effect("handles config with no commands", () =>
    Effect.sync(() => {
      const config = { commands: [], priorityLevels: [] }
      const steps = generateLintSteps(config, "src/")
      expect(steps.length).toBe(1)
      expect(steps[0]?._tag).toBe("LintingDirectory")
    }))
})

describe("substituteDirectory", () => {
  it.effect("replaces ${directory} placeholder", () =>
    Effect.sync(() => {
      const cmd = "npx eslint ${directory} --ext .ts"
      const result = substituteDirectory(cmd, "lib/")
      expect(result).toBe("npx eslint lib/ --ext .ts")
    }))

  it.effect("replaces quoted src/ with directory", () =>
    Effect.sync(() => {
      const cmd = 'npx eslint "src/" --ext .ts'
      const result = substituteDirectory(cmd, "lib/")
      expect(result).toBe('npx eslint "lib/" --ext .ts')
    }))

  it.effect("handles command without placeholders", () =>
    Effect.sync(() => {
      const cmd = "npx tsc --noEmit"
      const result = substituteDirectory(cmd, "src/")
      expect(result).toBe("npx tsc --noEmit")
    }))
})
