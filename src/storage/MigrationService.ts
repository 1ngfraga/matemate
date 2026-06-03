import { DEFAULT_SETTINGS, Operation, STORAGE_VERSION, StoredResults, StoredSettings, TimerDuration } from '../core/Types'

export class MigrationService {
  static migrateSettings(stored: StoredSettings): StoredSettings {
    if (!stored || typeof stored.version !== 'number' || !stored.data) {
      return { version: STORAGE_VERSION, data: structuredClone(DEFAULT_SETTINGS) }
    }

    // Treat stored data as a loose record to allow reading old/unknown fields
    let version = stored.version
    const raw   = stored.data as unknown as Record<string, unknown>

    // v0 → v1: ensure all basic fields exist
    if (version < 1) { version = 1 }

    // v1 → v2: old per-operation fields existed (multiplicationDigits, divisionDigits…)
    if (version < 2) { version = 2 }

    // v2 → v3: new addition model + tables 1-9 only
    if (version < 3) {
      const oldDigits = Number(raw.additionDigits ?? 1)
      const operandDigits: 1 | 2 = oldDigits >= 2 ? 2 : 1

      const rawTables = (raw.multiplicationTables as Record<number, boolean>) ?? {}
      const tables: Record<number, boolean> = {}
      for (let i = 1; i <= 9; i++) {
        tables[i] = rawTables[i] ?? DEFAULT_SETTINGS.multiplicationTables[i]
      }
      if (!Object.values(tables).some(Boolean)) tables[5] = true

      const subDigits = Number(raw.subtractionDigits ?? 1)

      return {
        version: 3,
        data: {
          animal:               (raw.animal as typeof DEFAULT_SETTINGS.animal)               ?? DEFAULT_SETTINGS.animal,
          timerByOperation: structuredClone(DEFAULT_SETTINGS.timerByOperation),
          muted:                Boolean(raw.muted),
          multiplicationTables: tables,
          gameTargetByOperation: structuredClone(DEFAULT_SETTINGS.gameTargetByOperation),
          additionOperandDigits:operandDigits,
          additionNumAddends:   2,
          subtractionDigits:    (subDigits === 1 || subDigits === 2 ? subDigits : 1) as 1 | 2,
        },
      }
    }

    if (version < 4) {
      const prev = stored.data as typeof DEFAULT_SETTINGS
      const rawTargets = (raw.gameTargetByOperation as Record<string, number> | undefined) ?? {}
      const rawTimers = (raw.timerByOperation as Record<string, number> | undefined) ?? {}
      const clampTarget = (value: unknown, fallback: number) => {
        const n = Math.round(Number(value))
        return Number.isFinite(n) ? Math.max(1, Math.min(200, n)) : fallback
      }
      const clampTimer = (value: unknown, fallback: TimerDuration) => {
        const n = Math.round(Number(value))
        const allowed = [5, 10, 15, 20, 25, 30]
        return (allowed.includes(n) ? n : fallback) as TimerDuration
      }
      const legacyTimer = clampTimer(raw.timerDuration, DEFAULT_SETTINGS.timerByOperation[Operation.Addition])
      return {
        version: 4,
        data: {
          ...prev,
          timerByOperation: {
            [Operation.Addition]: clampTimer(rawTimers[Operation.Addition], legacyTimer),
            [Operation.Subtraction]: clampTimer(rawTimers[Operation.Subtraction], legacyTimer),
            [Operation.Multiplication]: clampTimer(rawTimers[Operation.Multiplication], legacyTimer),
            [Operation.Division]: clampTimer(rawTimers[Operation.Division], legacyTimer),
          },
          gameTargetByOperation: {
            [Operation.Addition]: clampTarget(rawTargets[Operation.Addition], DEFAULT_SETTINGS.gameTargetByOperation[Operation.Addition]),
            [Operation.Subtraction]: clampTarget(rawTargets[Operation.Subtraction], DEFAULT_SETTINGS.gameTargetByOperation[Operation.Subtraction]),
            [Operation.Multiplication]: clampTarget(rawTargets[Operation.Multiplication], DEFAULT_SETTINGS.gameTargetByOperation[Operation.Multiplication]),
            [Operation.Division]: clampTarget(rawTargets[Operation.Division], DEFAULT_SETTINGS.gameTargetByOperation[Operation.Division]),
          },
        },
      }
    }

    if (version < 5) {
      return {
        version: 5,
        data: {
          ...(stored.data as typeof DEFAULT_SETTINGS),
          timerByOperation: (stored.data as typeof DEFAULT_SETTINGS).timerByOperation ?? structuredClone(DEFAULT_SETTINGS.timerByOperation),
        },
      }
    }

    if (version < 6) {
      const prev = stored.data as typeof DEFAULT_SETTINGS
      const nextTables = { ...DEFAULT_SETTINGS.multiplicationTables, ...prev.multiplicationTables }
      return {
        version: 6,
        data: {
          ...prev,
          multiplicationTables: nextTables,
          timerByOperation: prev.timerByOperation ?? structuredClone(DEFAULT_SETTINGS.timerByOperation),
        },
      }
    }

    return { version, data: stored.data }
  }

  static migrateResults(stored: StoredResults): StoredResults {
    if (!stored || typeof stored.version !== 'number' || !Array.isArray(stored.data)) {
      return { version: STORAGE_VERSION, data: [] }
    }

    let { version, data } = stored

    if (version < 1) {
      data = data
        .filter(r => r && typeof r.correct === 'number' && typeof r.dateISO === 'string')
        .map(r => ({
          ...r,
          id:             r.id ?? `${r.dateISO}-${Math.random().toString(36).slice(2, 7)}`,
          currentTarget:  r.currentTarget ?? r.totalQuestions ?? (r.correct + r.incorrect),
          answersPlayed:  r.answersPlayed ?? (r.correct + r.incorrect),
          completed:      r.completed ?? true,
          totalQuestions: r.totalQuestions ?? (r.correct + r.incorrect),
          durationMs:     r.durationMs ?? 0,
          percentCorrect: r.percentCorrect ?? Math.round((r.correct / Math.max(1, r.correct + r.incorrect)) * 100),
        }))
      version = 1
    }

    if (version < 4) {
      data = data.map(r => ({
        ...r,
        currentTarget:  r.currentTarget ?? (r.totalQuestions ?? 50),
        answersPlayed:  r.answersPlayed ?? (r.correct + r.incorrect),
        completed:      false,
      }))
      version = 4
    }

    if (version < 5) {
      data = data.map(r => ({
        ...r,
        completed: Boolean(r.completed) &&
          (r.correct >= (r.currentTarget ?? r.totalQuestions ?? 50)) &&
          (r.answersPlayed >= (r.currentTarget ?? r.totalQuestions ?? 50)),
      }))
      version = 5
    }

    if (version < 6) {
      version = STORAGE_VERSION
    }

    return { version, data }
  }
}
