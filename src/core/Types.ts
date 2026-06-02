// ── Enums ──────────────────────────────────────────────────────────────────

export const enum Operation {
  Addition       = 'addition',
  Subtraction    = 'subtraction',
  Multiplication = 'multiplication',
  Division       = 'division',
}

export const enum Animal {
  Dinosaur = 'dinosaur',
  Opossum  = 'opossum',
  Capybara = 'capybara',
}

export const enum TimerDuration {
  Short  = 5,
  Medium = 10,
  Long   = 15,
}

export const enum Screen {
  Welcome        = 'welcome',
  Home           = 'home',
  Settings       = 'settings',
  OperationSetup = 'operation-setup',
  Game           = 'game',
  Result         = 'result',
}

// ── Settings ───────────────────────────────────────────────────────────────

export interface Settings {
  animal: Animal
  timerDuration: TimerDuration
  /** Tables 1–12; at least one must be true */
  multiplicationTables: Record<number, boolean>
  muted: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  animal: Animal.Dinosaur,
  timerDuration: TimerDuration.Medium,
  multiplicationTables: {
    1: true, 2: true, 3: true, 4: true,
    5: true, 6: true, 7: true, 8: true,
    9: true, 10: true, 11: true, 12: true,
  },
  muted: false,
}

// ── Question / Answer ──────────────────────────────────────────────────────

export interface Question {
  operation: Operation
  operandA: number
  operandB: number
  answer: number
  display: string   // e.g. "7 × 8"
}

export interface AnswerChoice {
  value: number
  isCorrect: boolean
}

// ── Game session state ─────────────────────────────────────────────────────

export interface GameSession {
  operation: Operation
  questions: Question[]
  currentIndex: number
  correctCount: number
  incorrectCount: number
  startedAt: number   // Date.now()
  endedAt: number | null
}

// ── Persisted result (one per completed game) ──────────────────────────────

export interface GameResult {
  id: string          // ISO date + random suffix
  dateISO: string     // "YYYY-MM-DD"
  operation: Operation
  correct: number
  incorrect: number
  totalQuestions: number
  durationMs: number
  percentCorrect: number
}

// ── Stored shapes (versioned for migration) ────────────────────────────────

export interface StoredSettings {
  version: number
  data: Settings
}

export interface StoredResults {
  version: number
  data: GameResult[]
}

export const STORAGE_VERSION = 1
