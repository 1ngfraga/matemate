import { DEFAULT_SETTINGS, STORAGE_VERSION, StoredResults, StoredSettings } from '../core/Types'

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
          timerDuration:        (raw.timerDuration as typeof DEFAULT_SETTINGS.timerDuration) ?? DEFAULT_SETTINGS.timerDuration,
          muted:                Boolean(raw.muted),
          multiplicationTables: tables,
          additionOperandDigits:operandDigits,
          additionNumAddends:   2,
          subtractionDigits:    (subDigits === 1 || subDigits === 2 ? subDigits : 1) as 1 | 2,
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
          totalQuestions: r.totalQuestions ?? (r.correct + r.incorrect),
          durationMs:     r.durationMs ?? 0,
          percentCorrect: r.percentCorrect ?? Math.round((r.correct / Math.max(1, r.correct + r.incorrect)) * 100),
        }))
      version = STORAGE_VERSION
    }

    return { version, data }
  }
}
