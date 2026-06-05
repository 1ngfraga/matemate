import {
  AppState,
  DEFAULT_APP_STATE,
  DEFAULT_SETTINGS,
  GameMode,
  GameResult,
  Locale,
  Operation,
  STORAGE_VERSION,
  StoredResults,
  StoredSettings,
  TimerDuration,
} from '../core/Types'

const VALID_LOCALES = [
  Locale.Ar,
  Locale.Bn,
  Locale.De,
  Locale.En,
  Locale.Es,
  Locale.Fr,
  Locale.Hi,
  Locale.Ja,
  Locale.Ko,
  Locale.Pt,
  Locale.Ru,
  Locale.Zh,
]

export class MigrationService {
  private static emptyResultsByMode(): Record<GameMode, GameResult[]> {
    return {
      [GameMode.Play]: [],
      [GameMode.Free]: [],
    }
  }

  private static migrateLegacySettings(stored: StoredSettings): { version: number; data: typeof DEFAULT_SETTINGS } {
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
          divisionTables:       structuredClone(DEFAULT_SETTINGS.divisionTables),
          gameTargetByOperation: structuredClone(DEFAULT_SETTINGS.gameTargetByOperation),
          additionOperandDigits:operandDigits,
          additionNumAddends:   2,
          subtractionDigits:    (subDigits === 1 || subDigits === 2 ? subDigits : 1) as 1 | 2,
          divisionStyle:        DEFAULT_SETTINGS.divisionStyle,
          multiplicationStyle:  DEFAULT_SETTINGS.multiplicationStyle,
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
          divisionTables: prev.divisionTables ?? structuredClone(nextTables),
          timerByOperation: prev.timerByOperation ?? structuredClone(DEFAULT_SETTINGS.timerByOperation),
        },
      }
    }

    if (version < 8) {
      const prev = stored.data as typeof DEFAULT_SETTINGS
      const nextDivisionTables = { ...DEFAULT_SETTINGS.divisionTables, ...(prev.divisionTables ?? prev.multiplicationTables) }
      if (!Object.values(nextDivisionTables).some(Boolean)) nextDivisionTables[5] = true
      return {
        version: 8,
        data: {
          ...prev,
          divisionTables: nextDivisionTables,
        },
      }
    }

    return { version, data: stored.data as typeof DEFAULT_SETTINGS }
  }

  static migrateSettings(stored: StoredSettings): { version: number; data: AppState } {
    if (!stored || typeof stored.version !== 'number' || !stored.data) {
      return { version: STORAGE_VERSION, data: structuredClone(DEFAULT_APP_STATE) }
    }

    const rawData = stored.data as unknown as Record<string, unknown>
    const looksLikeAppState =
      typeof rawData === 'object' &&
      rawData !== null &&
      typeof rawData.profiles === 'object' &&
      rawData.profiles !== null

    if (!looksLikeAppState) {
      const legacy = this.migrateLegacySettings(stored)
      return {
        version: STORAGE_VERSION,
        data: {
          profiles: {
            [GameMode.Play]: structuredClone(legacy.data),
            [GameMode.Free]: structuredClone(DEFAULT_SETTINGS),
          },
          pin: null,
          locale: Locale.Es,
        },
      }
    }

    const raw = stored.data as AppState
    const play = this.migrateLegacySettings({ version: stored.version, data: raw.profiles?.[GameMode.Play] ?? DEFAULT_SETTINGS }).data
    const free = this.migrateLegacySettings({ version: stored.version, data: raw.profiles?.[GameMode.Free] ?? DEFAULT_SETTINGS }).data
    return {
      version: STORAGE_VERSION,
      data: {
        profiles: {
          [GameMode.Play]: play,
          [GameMode.Free]: free,
        },
        pin: typeof raw.pin === 'string' && /^\d{6}$/.test(raw.pin) ? raw.pin : null,
        locale: VALID_LOCALES.includes(raw.locale as Locale) ? raw.locale as Locale : Locale.Es,
      },
    }
  }

  static migrateResults(stored: StoredResults): { version: number; data: Record<GameMode, GameResult[]> } {
    if (!stored || typeof stored.version !== 'number' || !Array.isArray(stored.data)) {
      const raw = stored?.data as Record<string, unknown> | undefined
      if (
        raw &&
        typeof raw === 'object' &&
        Array.isArray(raw[GameMode.Play]) &&
        Array.isArray(raw[GameMode.Free])
      ) {
        return {
          version: STORAGE_VERSION,
          data: {
            [GameMode.Play]: raw[GameMode.Play] as GameResult[],
            [GameMode.Free]: raw[GameMode.Free] as GameResult[],
          },
        }
      }
      return {
        version: STORAGE_VERSION,
        data: this.emptyResultsByMode(),
      }
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

    return {
      version: STORAGE_VERSION,
      data: {
        [GameMode.Play]: data,
        [GameMode.Free]: [],
      },
    }
  }
}
