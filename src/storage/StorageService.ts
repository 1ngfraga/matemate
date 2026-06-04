import {
  AppState,
  DEFAULT_APP_STATE,
  GameMode,
  GameResult,
  Locale,
  Settings,
  STORAGE_VERSION,
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

  // ── Settings / app state ────────────────────────────────────────────────

  loadAppState(): AppState {
    try {
      const raw = localStorage.getItem(KEY_SETTINGS)
      if (!raw) return structuredClone(DEFAULT_APP_STATE)

      const stored: StoredSettings = JSON.parse(raw)
      const migrated = MigrationService.migrateSettings(stored)
      return migrated.data
    } catch {
      this.clearSettings()
      return structuredClone(DEFAULT_APP_STATE)
    }
  }

  loadSettings(mode: GameMode = GameMode.Play): Settings {
    return structuredClone(this.loadAppState().profiles[mode])
  }

  loadPin(): string | null {
    return this.loadAppState().pin
  }

  loadLocale(): Locale {
    return this.loadAppState().locale
  }

  saveAppState(state: AppState): void {
    try {
      const stored: StoredSettings = {
        version: STORAGE_VERSION,
        data: state,
      }
      localStorage.setItem(KEY_SETTINGS, JSON.stringify(stored))
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }

  saveSettings(mode: GameMode, settings: Settings): void {
    const state = this.loadAppState()
    state.profiles[mode] = structuredClone(settings)
    this.saveAppState(state)
  }

  savePin(pin: string | null): void {
    const state = this.loadAppState()
    state.pin = pin
    this.saveAppState(state)
  }

  saveLocale(locale: Locale): void {
    const state = this.loadAppState()
    state.locale = locale
    this.saveAppState(state)
  }

  clearSettings(): void {
    try { localStorage.removeItem(KEY_SETTINGS) } catch { /* ignore */ }
  }

  // ── Results ──────────────────────────────────────────────────────────────

  private loadAllResults(): Record<GameMode, GameResult[]> {
    try {
      const raw = localStorage.getItem(KEY_RESULTS)
      if (!raw) {
        return {
          [GameMode.Play]: [],
          [GameMode.Free]: [],
        }
      }
      const migrated = MigrationService.migrateResults(JSON.parse(raw))
      return migrated.data
    } catch {
      this.clearResults()
      return {
        [GameMode.Play]: [],
        [GameMode.Free]: [],
      }
    }
  }

  loadResults(mode: GameMode = GameMode.Play): GameResult[] {
    return this.loadAllResults()[mode] ?? []
  }

  saveResult(mode: GameMode, result: GameResult): void {
    try {
      const allResults = this.loadAllResults()
      const nextResults = [...(allResults[mode] ?? []), result].slice(-365)
      allResults[mode] = nextResults
      localStorage.setItem(KEY_RESULTS, JSON.stringify({
        version: STORAGE_VERSION,
        data: allResults,
      }))
    } catch {
      // Storage full — silently ignore
    }
  }

  clearResults(mode?: GameMode): void {
    try {
      if (!mode) {
        localStorage.removeItem(KEY_RESULTS)
        return
      }
      const allResults = this.loadAllResults()
      allResults[mode] = []
      localStorage.setItem(KEY_RESULTS, JSON.stringify({
        version: STORAGE_VERSION,
        data: allResults,
      }))
    } catch {
      if (!mode) {
        try { localStorage.removeItem(KEY_RESULTS) } catch { /* ignore */ }
      }
    }
  }

  resetAllProgress(): void {
    const locale = this.loadLocale()
    this.clearResults()
    const nextState = structuredClone(DEFAULT_APP_STATE)
    nextState.locale = locale
    this.saveAppState(nextState)
  }

  // ── Utilities ────────────────────────────────────────────────────────────

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
