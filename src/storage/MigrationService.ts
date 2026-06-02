import {
  DEFAULT_SETTINGS,
  STORAGE_VERSION,
  StoredResults,
  StoredSettings,
} from '../core/Types'

export class MigrationService {
  static migrateSettings(stored: StoredSettings): StoredSettings {
    if (!stored || typeof stored.version !== 'number' || !stored.data) {
      return { version: STORAGE_VERSION, data: { ...DEFAULT_SETTINGS } }
    }

    let { version, data } = stored

    // v0 → v1: ensure all fields exist (backfill missing keys)
    if (version < 1) {
      data = {
        ...DEFAULT_SETTINGS,
        ...data,
        multiplicationTables: {
          ...DEFAULT_SETTINGS.multiplicationTables,
          ...(data.multiplicationTables ?? {}),
        },
      }
      version = 1
    }

    // Future migrations: if (version < 2) { ... version = 2 }

    return { version, data }
  }

  static migrateResults(stored: StoredResults): StoredResults {
    if (!stored || typeof stored.version !== 'number' || !Array.isArray(stored.data)) {
      return { version: STORAGE_VERSION, data: [] }
    }

    let { version, data } = stored

    // v0 → v1: ensure each result has required fields
    if (version < 1) {
      data = data.filter(
        (r) =>
          r &&
          typeof r.correct === 'number' &&
          typeof r.incorrect === 'number' &&
          typeof r.dateISO === 'string',
      ).map((r) => ({
        ...r,
        id: r.id ?? `${r.dateISO}-${Math.random().toString(36).slice(2, 7)}`,
        totalQuestions: r.totalQuestions ?? (r.correct + r.incorrect),
        durationMs: r.durationMs ?? 0,
        percentCorrect:
          r.percentCorrect ??
          Math.round((r.correct / Math.max(1, r.correct + r.incorrect)) * 100),
      }))
      version = 1
    }

    return { version, data }
  }
}
