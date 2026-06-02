import { GameResult, Operation, Question } from './Types'
import { ProgressAggregator } from '../chart/ProgressAggregator'

export class GameState {
  private _correct   = 0
  private _incorrect = 0
  private _index     = 0
  private _startedAt = Date.now()

  constructor(
    readonly operation:  Operation,
    readonly questions:  Question[],
  ) {}

  // ── Accessors ─────────────────────────────────────────────────────────

  get currentQuestion(): Question  { return this.questions[this._index] }
  get currentIndex():    number    { return this._index }
  get totalQuestions():  number    { return this.questions.length }
  get correctCount():    number    { return this._correct }
  get incorrectCount():  number    { return this._incorrect }
  get isComplete():      boolean   { return this._index >= this.questions.length }
  get progressText():    string    { return `${this._index + 1} / ${this.questions.length}` }
  get correctText():     string    { return `✓ ${this._correct}` }
  get incorrectText():   string    { return `✗ ${this._incorrect}` }

  // ── Mutation ──────────────────────────────────────────────────────────

  recordCorrect():   void { this._correct++ }
  recordIncorrect(): void { this._incorrect++ }
  advance():         void { this._index++ }

  // ── Result building ───────────────────────────────────────────────────

  buildResult(): GameResult {
    const total   = this.questions.length
    const correct = this._correct
    const dateISO = ProgressAggregator.todayISO()

    return {
      id:             `${dateISO}-${Math.random().toString(36).slice(2, 7)}`,
      dateISO,
      operation:      this.operation,
      correct,
      incorrect:      this._incorrect,
      totalQuestions: total,
      durationMs:     Date.now() - this._startedAt,
      percentCorrect: Math.round((correct / Math.max(1, total)) * 100),
    }
  }
}
