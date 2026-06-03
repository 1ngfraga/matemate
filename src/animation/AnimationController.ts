import { Animal } from '../core/Types'
import { AnimalAnimation, AnimSnapshot } from './AnimalAnimation'
import { DamageEffect } from './DamageEffect'
import { Confetti } from '../graphics/Confetti'
import { getAnimalGameSheet, GameSheet, drawObstacle, getObstacleSize } from '../graphics/GameSprites'
import { drawGroundShadow } from '../graphics/PixelArtRenderer'
import { ObstacleKind } from '../graphics/ObstacleSprites'

export const GROUND_FRAC = 0.68
const ANIMAL_HIT_X_FRAC = 0.9

// ── Obstacle state ────────────────────────────────────────────────────────

type ObstaclePhase =
  | 'approach'    // moving toward animal, timed to arrive at question end
  | 'waiting'     // arrived at animal, grace period (player still can answer)
  | 'cracking'    // correct answer → break sequence
  | 'breaking'
  | 'colliding'   // wrong/timeout → hit sequence
  | 'gone'

interface ObstacleAnim {
  kind:     ObstacleKind
  x:        number      // current x (CSS px at scale 1)
  startX:   number      // initial x
  targetX:  number      // x where it stands next to animal (computed on first tick)
  timerMs:  number      // total question time in ms
  speed:    number      // px per ms (computed on first tick)
  phase:    ObstaclePhase
  phaseTime:number
}

// ── Controller ────────────────────────────────────────────────────────────

export class AnimationController {
  private animalAnim   = new AnimalAnimation()
  private damageEffect = new DamageEffect()
  private confetti     = new Confetti()
  private obstacle: ObstacleAnim | null = null
  private sheet: GameSheet

  private animalX = 0
  private animalY = 0
  private groundY = 0
  private spr     = 3

  constructor(private animal: Animal) {
    this.sheet = getAnimalGameSheet(animal)
  }

  // ── Events ────────────────────────────────────────────────────────────

  /** Correct answer: break obstacle with confetti */
  onCorrectAnswer(burstX: number, burstY: number): void {
    this.confetti.burst(burstX, burstY, 55)
    if (this.obstacle && this.obstacle.phase !== 'cracking' && this.obstacle.phase !== 'breaking') {
      this.obstacle.phase     = 'cracking'
      this.obstacle.phaseTime = 0
    }
  }

  /** Wrong answer: immediate damage + obstacle collision wherever it is */
  onWrongAnswer(): void {
    this.damageEffect.trigger()
    if (this.obstacle) { this.obstacle.phase = 'colliding'; this.obstacle.phaseTime = 0 }
  }

  /** Grace period ended without answer → damage (obstacle was already 'waiting') */
  onTimeout(): void {
    this.damageEffect.trigger()
    if (this.obstacle) { this.obstacle.phase = 'colliding'; this.obstacle.phaseTime = 0 }
  }

  /**
   * Spawn a new obstacle.
   * @param timerMs  Total question duration in ms — obstacle arrives exactly at end.
   */
  spawnObstacle(kind: ObstacleKind, startX: number, timerMs: number): void {
    this.obstacle = {
      kind, x: startX, startX, targetX: 0, timerMs,
      speed: 0, phase: 'approach', phaseTime: 0,
    }
  }

  clearObstacle(): void { this.obstacle = null }

  setAnimal(animal: Animal): void {
    this.animal = animal
    this.sheet  = getAnimalGameSheet(animal)
  }

  // ── Main tick ─────────────────────────────────────────────────────────

  update(ctx: CanvasRenderingContext2D, W: number, H: number, dt: number): void {
    this.groundY = H * GROUND_FRAC
    const frame0 = this.sheet.frames[0]
    const sprH   = frame0 ? frame0.gridH : 1
    this.spr     = 1
    this.animalX = W * 0.10
    this.animalY = this.groundY - sprH * this.spr

    const { dx, dy } = this.damageEffect.update(dt)
    ctx.save()
    ctx.translate(dx, dy)

    const snap = this.animalAnim.update(dt)
    this.drawAnimal(ctx, snap)

    if (this.obstacle) this.updateObstacle(ctx, dt, W)

    this.confetti.update(ctx, dt)
    ctx.restore()

    this.damageEffect.draw(ctx, W, H)
  }

  // ── Animal draw ───────────────────────────────────────────────────────

  private drawAnimal(ctx: CanvasRenderingContext2D, snap: AnimSnapshot): void {
    const frame = this.sheet.frames[snap.frameIndex]
    if (!frame) return
    const s  = this.spr
    const x  = Math.round(this.animalX + snap.offsetX)
    const y  = Math.round(this.animalY + snap.offsetY)
    const sw = frame.gridW * s
    drawGroundShadow(ctx, x + sw / 2, this.groundY, sw)
    frame.draw(ctx, x, y, s)
  }

  // ── Obstacle update ────────────────────────────────────────────────────

  private updateObstacle(ctx: CanvasRenderingContext2D, dt: number, W: number): void {
    const obs = this.obstacle!
    obs.phaseTime += dt

    const s       = this.spr
    const obsSize = getObstacleSize(obs.kind)
    const obsW    = obsSize.width * s
    const obsH    = obsSize.height * s
    const animalW = this.sheet.frames[0]?.gridW ? this.sheet.frames[0].gridW * s : 0
    const obsY    = this.groundY - obsH

    // Compute speed on first tick (needs animalX which is only known after first update)
    if (obs.speed === 0 && this.animalX > 0) {
      // The obstacle collides with its left edge, so x itself is the hit point.
      obs.targetX = this.animalX + animalW * ANIMAL_HIT_X_FRAC
      const dist  = Math.max(1, obs.startX - obs.targetX)
      obs.speed   = dist / Math.max(1, obs.timerMs)
    }

    const paint = (x: number, alpha: number, cracked = false) => {
      ctx.save(); ctx.globalAlpha = Math.max(0, alpha)
      drawObstacle(ctx, obs.kind, x, obsY, s, cracked)
      ctx.restore()
      if (alpha > 0.1) drawGroundShadow(ctx, x + obsW / 2, this.groundY, obsW)
    }

    switch (obs.phase) {

      case 'approach': {
        if (obs.speed > 0) {
          obs.x -= obs.speed * dt
          if (obs.x <= obs.targetX) {
            obs.x         = obs.targetX
            obs.phase     = 'waiting'
            obs.phaseTime = 0
          }
        }
        paint(obs.x, 1)
        break
      }

      case 'waiting': {
        // Arrived at animal: tense vibration, waiting for player or grace to expire
        const t       = obs.phaseTime / 1000   // 0→1 over 1 second
        const vibrate = Math.sin(obs.phaseTime * 0.06) * 3 * (1 - t * 0.5)
        paint(obs.x + vibrate, 1)
        // Grace is handled externally by GameScreen (Timer.grace → onTimeout())
        break
      }

      case 'cracking': {
        const shake = Math.sin(obs.phaseTime * 0.28) * 4
        paint(obs.x + shake, 1, true)
        if (obs.phaseTime > 180) { obs.phase = 'breaking'; obs.phaseTime = 0 }
        break
      }

      case 'breaking': {
        const alpha = Math.max(0, 1 - obs.phaseTime / 280)
        paint(obs.x, alpha, true)
        // Debris
        ctx.save(); ctx.globalAlpha = alpha
        const DEBRIS: Record<string, string> = {
          rock: '#a0a090', cactus: '#cc4010', wall: '#c08040',
          bomb: '#1a1a1a', pot: '#5080c0', ball: '#e04020', cube: '#c03080',
        }
        ctx.fillStyle = DEBRIS[obs.kind] ?? '#a0a090'
        for (let i = 0; i < 5; i++) {
          const dx = (i - 2) * s * 3
          const dy = -(obs.phaseTime * 0.14) + i * s * 0.5
          ctx.fillRect(obs.x + obsW / 2 + dx, obsY + dy, s * 2, s * 2)
        }
        ctx.restore()
        if (obs.phaseTime > 300) { obs.phase = 'gone'; obs.phaseTime = 0 }
        break
      }

      case 'colliding': {
        const bounce = Math.sin(obs.phaseTime * 0.022) * 14 * Math.max(0, 1 - obs.phaseTime / 500)
        const alpha  = Math.max(0, 1 - obs.phaseTime / 560)
        paint(obs.x + bounce, alpha)
        if (obs.phaseTime > 560) { obs.phase = 'gone'; obs.phaseTime = 0 }
        break
      }

      case 'gone': break
    }
  }

  // ── Accessors ─────────────────────────────────────────────────────────

  get obstaclePhase(): ObstaclePhase | null { return this.obstacle?.phase ?? null }
  get animalState() { return this.animalAnim.currentState }
}
