/**
 * Synthesizes all game sounds via Web Audio API — no audio files needed.
 * AudioContext is lazy-created on first play (satisfies browser autoplay policy).
 */
export class SoundService {
  private ac: AudioContext | null = null
  private muted: boolean

  constructor(muted = false) { this.muted = muted }

  setMuted(m: boolean): void { this.muted = m }
  get isMuted(): boolean      { return this.muted }

  // ── Public sound events ───────────────────────────────────────────────

  /** Ascending C-E-G chime — played on correct answer */
  playCorrect(): void {
    const ctx = this.ctx(); if (!ctx) return
    const now = ctx.currentTime
    this.tone(ctx, 523, now,        0.12, 'sine',     0.28)
    this.tone(ctx, 659, now + 0.11, 0.12, 'sine',     0.28)
    this.tone(ctx, 784, now + 0.22, 0.20, 'sine',     0.32)
  }

  /** Low descending buzz — played on wrong answer / timeout */
  playWrong(): void {
    const ctx = this.ctx(); if (!ctx) return
    const now = ctx.currentTime
    this.tone(ctx, 220, now,        0.10, 'sawtooth', 0.22)
    this.tone(ctx, 170, now + 0.10, 0.22, 'sawtooth', 0.18)
  }

  /** Short high click — played once per second in last 3s of timer */
  playTick(): void {
    const ctx = this.ctx(); if (!ctx) return
    this.tone(ctx, 1100, ctx.currentTime, 0.05, 'square', 0.12)
  }

  /** Urgent pulse — played when grace period starts */
  playGrace(): void {
    const ctx = this.ctx(); if (!ctx) return
    const now = ctx.currentTime
    this.tone(ctx, 660, now,        0.07, 'square', 0.18)
    this.tone(ctx, 660, now + 0.12, 0.07, 'square', 0.15)
  }

  /** Celebratory ascending arpeggio — played when game ends with good score */
  playVictory(): void {
    const ctx = this.ctx(); if (!ctx) return
    const now   = ctx.currentTime
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      this.tone(ctx, freq, now + i * 0.13, i === 3 ? 0.45 : 0.13, 'sine', 0.28)
    })
  }

  // ── Internal helpers ──────────────────────────────────────────────────

  private ctx(): AudioContext | null {
    if (this.muted) return null
    try {
      if (!this.ac) {
        const AC = window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        this.ac = new AC()
      }
      if (this.ac.state === 'suspended') this.ac.resume()
      return this.ac
    } catch { return null }
  }

  private tone(
    ctx:   AudioContext,
    freq:  number,
    start: number,
    dur:   number,
    type:  OscillatorType,
    gain:  number,
  ): void {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.connect(env)
    env.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = freq
    env.gain.setValueAtTime(0, start)
    env.gain.linearRampToValueAtTime(gain, start + 0.01)
    env.gain.exponentialRampToValueAtTime(0.001, start + dur)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }
}
