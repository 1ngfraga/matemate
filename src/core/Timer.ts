type TimerPhase = 'question' | 'grace' | 'expired'

export class Timer {
  private totalMs   = 0
  private remaining = 0
  private graceMs   = 1000
  private graceLeft = 0
  private phase: TimerPhase = 'expired'

  start(durationMs: number, graceMs = 1000): void {
    this.totalMs   = durationMs
    this.remaining = durationMs
    this.graceMs   = graceMs
    this.graceLeft = graceMs
    this.phase     = 'question'
  }

  update(dt: number): void {
    if (this.phase === 'question') {
      this.remaining -= dt
      if (this.remaining <= 0) {
        this.remaining = 0
        this.phase     = 'grace'
      }
    } else if (this.phase === 'grace') {
      this.graceLeft -= dt
      if (this.graceLeft <= 0) {
        this.graceLeft = 0
        this.phase     = 'expired'
      }
    }
  }

  stop(): void { this.phase = 'expired' }

  /** 0 = empty, 1 = full. During grace always 0. */
  get fraction(): number {
    return this.phase === 'question' ? this.remaining / this.totalMs : 0
  }

  /** Seconds left to display (0 during grace). */
  get displaySeconds(): number {
    return this.phase === 'question' ? Math.ceil(this.remaining / 1000) : 0
  }

  get isInGrace():  boolean { return this.phase === 'grace' }
  get isExpired():  boolean { return this.phase === 'expired' }
  get isRunning():  boolean { return this.phase === 'question' }
}
