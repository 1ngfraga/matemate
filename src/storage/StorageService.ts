import {
  DEFAULT_SETTINGS,
  GameResult,
  Settings,
  STORAGE_VERSION,
  StoredResults,
  StoredSettings,
} from '../core/Types'
import { MigrationService } from './MigrationService'

const KEY_SETTINGS = 'matemate_settings'
const KEY_RESULTS  = 'matemate_results'

export class StorageService {
  private static instance: StorageService | null = null

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  // ── Settings ─────────────────────────────────────────────────────────────

  loadSettings(): Settings {
    try {
      const raw = localStorage.getItem(KEY_SETTINGS)
      if (!raw) return structuredClone(DEFAULT_SETTINGS)

      const stored: StoredSettings = JSON.parse(raw)
      const migrated = MigrationService.migrateSettings(stored)
      return migrated.data
    } catch {
      this.clearSettings()
      return structuredClone(DEFAULT_SETTINGS)
    }
  }

  saveSettings(settings: Settings): void {
    try {
      const stored: StoredSettings = {
        version: STORAGE_VERSION,
        data: settings,
      }
      localStorage.setItem(KEY_SETTINGS, JSON.stringify(stored))
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }

  clearSettings(): void {
    try { localStorage.removeItem(KEY_SETTINGS) } catch { /* ignore */ }
  }

  // ── Results ───────────────────────────────────────────────────────────────

  loadResults(): GameResult[] {
    try {
      const raw = localStorage.getItem(KEY_RESULTS)
      if (!raw) return []

      const stored: StoredResults = JSON.parse(raw)
      const migrated = MigrationService.migrateResults(stored)
      return migrated.data
    } catch {
      this.clearResults()
      return []
    }
  }

  saveResult(result: GameResult): void {
    try {
      const results = this.loadResults()
      results.push(result)

      // Keep only last 365 results to avoid unbounded growth
      const trimmed = results.slice(-365)

      const stored: StoredResults = {
        version: STORAGE_VERSION,
        data: trimmed,
      }
      localStorage.setItem(KEY_RESULTS, JSON.stringify(stored))
    } catch {
      // Storage full — silently ignore
    }
  }

  clearResults(): void {
    try { localStorage.removeItem(KEY_RESULTS) } catch { /* ignore */ }
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  isAvailable(): boolean {
    try {
      const probe = '__matemate_probe__'
      localStorage.setItem(probe, '1')
      localStorage.removeItem(probe)
      return true
    } catch {
      return false
    }
  }
}

export const storage = StorageService.getInstance()
