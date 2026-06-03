import { GameResult, Operation, Question } from './Types'
import { ProgressAggregator } from '../chart/ProgressAggregator'

export class GameState {
  private questions: Question[]
  private currentIdx = 0
  private totalCorrect = 0
  private totalIncorrect = 0
  private streak = 0
  private bestStreak = 0
  private startedAt = Date.now()

  constructor(
    readonly operation: Operation,
    initialQuestions: Question[],
    readonly targetStreak: number,
  ) {
    this.questions = [...initialQuestions]
  }

  get currentQuestion(): Question { return this.questions[this.currentIdx] }
  get currentIndex(): number { return this.currentIdx }
  get correctCount(): number { return this.totalCorrect }
  get incorrectCount(): number { return this.totalIncorrect }
  get currentStreak(): number { return this.streak }
  get bestRun(): number { return this.bestStreak }
  get answersPlayed(): number { return this.totalCorrect + this.totalIncorrect }
  get isComplete(): boolean { return this.streak >= this.targetStreak }
  get progressText(): string { return `${this.streak} / ${this.targetStreak}` }
  get correctText(): string { return `✓ ${this.totalCorrect}` }
  get incorrectText(): string { return `✗ ${this.totalIncorrect}` }

  appendQuestions(extra: Question[]): void {
    this.questions.push(...extra)
  }

  recordCorrect(): void {
    this.totalCorrect++
    this.streak++
    this.bestStreak = Math.max(this.bestStreak, this.streak)
  }

  recordIncorrect(): void {
    this.totalIncorrect++
    this.streak = 0
  }

  advance(): void {
    this.currentIdx++
  }

  buildResult(): GameResult {
    const totalAttempts = this.answersPlayed
    const correct = this.totalCorrect
    const dateISO = ProgressAggregator.todayISO()

    return {
      id: `${dateISO}-${Math.random().toString(36).slice(2, 7)}`,
      dateISO,
      operation: this.operation,
      correct,
      incorrect: this.totalIncorrect,
      currentTarget: this.targetStreak,
      answersPlayed: totalAttempts,
      completed: this.isComplete,
      totalQuestions: this.targetStreak,
      durationMs: Date.now() - this.startedAt,
      percentCorrect: Math.round((correct / Math.max(1, totalAttempts)) * 100),
    }
  }
}
