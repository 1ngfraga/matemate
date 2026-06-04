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
  XLong  = 20,
  XXLong = 25,
  Mega   = 30,
}

export const enum Screen {
  Welcome        = 'welcome',
  Home           = 'home',
  Settings       = 'settings',
  OperationSetup = 'operation-setup',
  Game           = 'game',
  Result         = 'result',
}

export const enum GameMode {
  Play = 'play',
  Free = 'free',
}

export const enum Locale {
  Ar = 'ar',
  En = 'en',
  Es = 'es',
  Fr = 'fr',
  Hi = 'hi',
  Ja = 'ja',
  Pt = 'pt',
  Ru = 'ru',
  Zh = 'zh',
  Bn = 'bn',
}

// ── Difficulty types ───────────────────────────────────────────────────────

/** Size of each addend: 1 → single-digit (1-9), 2 → two-digit (10-99) */
export type AdditionOperandDigits = 1 | 2
/** How many numbers to sum: e.g. 4 → "3 + 7 + 2 + 8" */
export type AdditionNumAddends    = 2 | 3 | 4 | 5
/** Subtraction operand size */
export type SubtractionDigits     = 1 | 2

// ── Settings ───────────────────────────────────────────────────────────────

export interface Settings {
  animal:        Animal
  timerByOperation: Record<Operation, TimerDuration>
  /** Multiplication tables 1–9; at least one must be true */
  multiplicationTables: Record<number, boolean>
  /** Division tables 1–10; at least one must be true */
  divisionTables: Record<number, boolean>
  muted: boolean
  gameTargetByOperation: Record<Operation, number>

  // Suma
  additionOperandDigits: AdditionOperandDigits  // size per addend
  additionNumAddends:    AdditionNumAddends       // how many addends

  // Resta
  subtractionDigits: SubtractionDigits
}

export const DEFAULT_SETTINGS: Settings = {
  animal:        Animal.Dinosaur,
  timerByOperation: {
    [Operation.Addition]: TimerDuration.Medium,
    [Operation.Subtraction]: TimerDuration.Medium,
    [Operation.Multiplication]: TimerDuration.Medium,
    [Operation.Division]: TimerDuration.Medium,
  },
  multiplicationTables: {
    1: true, 2: true, 3: true, 4: true,
    5: true, 6: true, 7: true, 8: true, 9: true, 10: true,
  },
  divisionTables: {
    1: true, 2: true, 3: true, 4: true,
    5: true, 6: true, 7: true, 8: true, 9: true, 10: true,
  },
  muted: false,
  gameTargetByOperation: {
    [Operation.Addition]: 50,
    [Operation.Subtraction]: 50,
    [Operation.Multiplication]: 50,
    [Operation.Division]: 50,
  },
  additionOperandDigits: 1,
  additionNumAddends:    2,
  subtractionDigits:     1,
}

// ── Question / Answer ──────────────────────────────────────────────────────

export interface Question {
  operation: Operation
  operandA:  number
  operandB:  number
  /** For addition with 3+ addends; operandA/B are addends[0]/[1] */
  addends?:  number[]
  answer:    number
  display:   string
}

export interface AnswerChoice {
  value:     number
  isCorrect: boolean
}

// ── Game session ───────────────────────────────────────────────────────────

export interface GameSession {
  operation:     Operation
  questions:     Question[]
  currentIndex:  number
  correctCount:  number
  incorrectCount:number
  startedAt:     number
  endedAt:       number | null
}

// ── Persisted result ───────────────────────────────────────────────────────

export interface GameResult {
  id:             string
  dateISO:        string
  operation:      Operation
  correct:        number
  incorrect:      number
  currentTarget:  number
  answersPlayed:  number
  completed:      boolean
  totalQuestions: number
  durationMs:     number
  percentCorrect: number
}

// ── Stored shapes (versioned) ──────────────────────────────────────────────

export interface AppProfiles {
  [GameMode.Play]: Settings
  [GameMode.Free]: Settings
}

export interface AppState {
  profiles: AppProfiles
  pin: string | null
  locale: Locale
}

export interface StoredSettings {
  version: number
  data: Settings | AppState
}

export interface StoredResults {
  version: number
  data: GameResult[] | Record<GameMode, GameResult[]>
}

export const DEFAULT_APP_PROFILES: AppProfiles = {
  [GameMode.Play]: structuredClone(DEFAULT_SETTINGS),
  [GameMode.Free]: structuredClone(DEFAULT_SETTINGS),
}

export const DEFAULT_APP_STATE: AppState = {
  profiles: DEFAULT_APP_PROFILES,
  pin: null,
  locale: Locale.Es,
}

export const STORAGE_VERSION = 9
