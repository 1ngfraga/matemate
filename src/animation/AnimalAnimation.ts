import { F_RUN0, F_RUN1, F_RUN2, F_RUN3, F_VICTORY, F_HIT } from '../graphics/GameSprites'

export type AnimState = 'run' | 'victory' | 'hit' | 'idle'

export interface AnimSnapshot {
  frameIndex: number
  offsetX:    number
  offsetY:    number
  alpha:      number
}

// Run cycle: 4 frames, each held for ~150ms (faster than before = smoother SNES feel)
const RUN_FRAMES  = [F_RUN0, F_RUN1, F_RUN2, F_RUN3]
const FRAME_MS    = 150   // ms per run frame

export class AnimalAnimation {
  private state:     AnimState = 'run'
  private stateTime  = 0
  private runPhase   = 0   // accumulated ms for run cycle

  triggerVictory(): void { this.setState('victory') }
  triggerHit():    void  { this.setState('hit') }
  startRun():      void  { this.setState('run') }
  get currentState(): AnimState { return this.state }

  update(dt: number): AnimSnapshot {
    this.stateTime += dt
    switch (this.state) {
      case 'run':    return this.updateRun(dt)
      case 'victory':return this.updateVictory()
      case 'hit':    return this.updateHit()
      default:       return { frameIndex: F_RUN0, offsetX: 0, offsetY: 0, alpha: 1 }
    }
  }

  private updateRun(dt: number): AnimSnapshot {
    this.runPhase += dt
    // 4-frame cycle
    const frameIdx  = Math.floor(this.runPhase / FRAME_MS) % 4
    const frameIndex = RUN_FRAMES[frameIdx]
    // Body bob synced to stride (rise between step landings)
    const bobPhase  = (this.runPhase % (FRAME_MS * 4)) / (FRAME_MS * 4)
    const bobY      = -Math.abs(Math.sin(bobPhase * Math.PI * 2)) * 1.5
    return { frameIndex, offsetX: 0, offsetY: bobY, alpha: 1 }
  }

  private updateVictory(): AnimSnapshot {
    const dur = 900
    const t   = Math.min(this.stateTime / dur, 1)
    // Full sine arc jump
    const jumpY  = -Math.sin(t * Math.PI) * 30
    // Quick squash on landing
    const squish = t > 0.85 ? 1 + Math.sin((t - 0.85) / 0.15 * Math.PI) * 0.12 : 1
    if (this.stateTime >= dur + 80) this.setState('run')
    return { frameIndex: F_VICTORY, offsetX: 0, offsetY: jumpY * squish, alpha: 1 }
  }

  private updateHit(): AnimSnapshot {
    const dur   = 550
    const decay = Math.max(0, 1 - this.stateTime / dur)
    const shakeX = Math.sin(this.stateTime * 0.08) * 7 * decay
    if (this.stateTime >= dur) this.setState('run')
    return { frameIndex: F_HIT, offsetX: shakeX, offsetY: 0, alpha: 1 }
  }

  private setState(s: AnimState): void {
    this.state     = s
    this.stateTime = 0
  }
}
