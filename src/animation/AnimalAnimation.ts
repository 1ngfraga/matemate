import { FRAME_RUN_A, FRAME_RUN_B, FRAME_VICTORY, FRAME_HIT } from '../graphics/AnimalSprites'

export type AnimState = 'run' | 'victory' | 'hit' | 'idle'

export interface AnimSnapshot {
  frameIndex: number
  offsetX:    number   // CSS px offset applied when drawing
  offsetY:    number
  alpha:      number   // 0-1
}

export class AnimalAnimation {
  private state: AnimState = 'run'
  private stateTime = 0    // ms elapsed in current state
  private runPhase  = 0    // accumulated run timer (drives leg alternation + bob)

  // ── Public controls ───────────────────────────────────────────────────

  triggerVictory(): void { this.setState('victory') }
  triggerHit():    void { this.setState('hit') }
  startRun():      void { this.setState('run') }
  get currentState(): AnimState { return this.state }

  // ── Update ────────────────────────────────────────────────────────────

  /** Call every frame with delta-time in milliseconds */
  update(dt: number): AnimSnapshot {
    this.stateTime += dt

    switch (this.state) {
      case 'run':    return this.updateRun(dt)
      case 'victory':return this.updateVictory()
      case 'hit':    return this.updateHit()
      default:       return { frameIndex: FRAME_RUN_A, offsetX: 0, offsetY: 0, alpha: 1 }
    }
  }

  // ── Run cycle ─────────────────────────────────────────────────────────

  private updateRun(dt: number): AnimSnapshot {
    this.runPhase += dt
    // Legs alternate every 220ms
    const frameIndex = Math.floor(this.runPhase / 220) % 2 === 0 ? FRAME_RUN_A : FRAME_RUN_B
    // Subtle vertical body bob synced to stride
    const bobY = Math.sin((this.runPhase / 220) * Math.PI) * 2
    return { frameIndex, offsetX: 0, offsetY: bobY, alpha: 1 }
  }

  // ── Victory (jump arc ~900ms) ──────────────────────────────────────────

  private updateVictory(): AnimSnapshot {
    const duration = 900
    const t = Math.min(this.stateTime / duration, 1)

    // Full sine arc: rise then fall
    const jumpY  = -Math.sin(t * Math.PI) * 28
    // Quick squash on landing (last 15% of arc)
    const squish = t > 0.85 ? 1 + Math.sin((t - 0.85) / 0.15 * Math.PI) * 0.15 : 1

    if (this.stateTime >= duration + 80) this.setState('run')

    // Rotate between RUN_A and VICTORY for a lively feel
    const frameIndex = t < 0.15 || t > 0.85 ? FRAME_RUN_A : FRAME_VICTORY
    return { frameIndex, offsetX: 0, offsetY: jumpY * squish, alpha: 1 }
  }

  // ── Hit (shake + daze ~550ms) ─────────────────────────────────────────

  private updateHit(): AnimSnapshot {
    const duration = 550
    const decay    = Math.max(0, 1 - this.stateTime / duration)
    // Rapid horizontal shake that fades out
    const shakeX   = Math.sin(this.stateTime * 0.08) * 7 * decay

    if (this.stateTime >= duration) this.setState('run')

    return { frameIndex: FRAME_HIT, offsetX: shakeX, offsetY: 0, alpha: 1 }
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private setState(s: AnimState): void {
    this.state     = s
    this.stateTime = 0
    if (s === 'run' && this.runPhase === 0) this.runPhase = 0
  }
}
