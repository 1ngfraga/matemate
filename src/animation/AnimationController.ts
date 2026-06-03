import { Animal } from '../core/Types'
import { AnimalAnimation, AnimSnapshot } from './AnimalAnimation'
import { DamageEffect } from './DamageEffect'
import { Confetti } from '../graphics/Confetti'
import { getAnimalGameSheet, GameSheet, drawObstacle } from '../graphics/GameSprites'
import { drawGroundShadow } from '../graphics/PixelArtRenderer'
import { ObstacleKind } from '../graphics/ObstacleSprites'

// Ground surface fraction — must match PixelArtRenderer's groundY = H * GROUND_FRAC
export const GROUND_FRAC = 0.68

type ObstaclePhase = 'approach' | 'cracking' | 'breaking' | 'gone' | 'colliding'
interface ObstacleAnim { kind: ObstacleKind; x: number; phase: ObstaclePhase; phaseTime: number }

export class AnimationController {
  private animalAnim   = new AnimalAnimation()
  private damageEffect = new DamageEffect()
  private confetti     = new Confetti()
  private obstacle: ObstacleAnim | null = null
  private sheet: GameSheet

  // Cached layout values
  private animalX = 0
  private animalY = 0
  private groundY = 0
  private spr     = 3   // pixel scale

  constructor(private animal: Animal) {
    this.sheet = getAnimalGameSheet(animal)
  }

  // ── Events ────────────────────────────────────────────────────────────

  onCorrectAnswer(burstX: number, burstY: number): void {
    this.animalAnim.triggerVictory()
    this.confetti.burst(burstX, burstY, 55)
    if (this.obstacle) this.obstacle.phase = 'cracking'
  }
  onWrongAnswer(): void {
    this.animalAnim.triggerHit()
    this.damageEffect.trigger()
    if (this.obstacle) this.obstacle.phase = 'colliding'
  }
  onTimeout(): void {
    this.damageEffect.trigger()
    if (this.obstacle) this.obstacle.phase = 'colliding'
  }
  spawnObstacle(kind: ObstacleKind, startX: number): void {
    this.obstacle = { kind, x: startX, phase: 'approach', phaseTime: 0 }
  }
  clearObstacle(): void { this.obstacle = null }
  setAnimal(animal: Animal): void { this.animal = animal; this.sheet = getAnimalGameSheet(animal) }

  // ── Main tick ─────────────────────────────────────────────────────────

  update(ctx: CanvasRenderingContext2D, W: number, H: number, dt: number): void {
    // Ground surface position must match PixelArtRenderer's value
    this.groundY = H * GROUND_FRAC

    // Scale: target sprite ~26% of canvas height; sprite is 20 grid rows tall
    const SPRITE_H = 20
    this.spr     = Math.max(2, Math.min(5, Math.floor(H * 0.26 / SPRITE_H)))
    this.animalX = W * 0.14
    this.animalY = this.groundY - this.spr * SPRITE_H

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

  // ── Animal ────────────────────────────────────────────────────────────

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

  // ── Obstacle ──────────────────────────────────────────────────────────

  private updateObstacle(ctx: CanvasRenderingContext2D, dt: number, W: number): void {
    const obs  = this.obstacle!
    obs.phaseTime += dt
    const s    = this.spr
    // Obstacle heights per kind (in grid px)
    const obsGH = obs.kind === 'cactus' ? 20 : obs.kind === 'wall' ? 16 : 9
    const obsGW = obs.kind === 'cactus' ? 12 : obs.kind === 'wall' ? 12 : 14
    const obsY  = this.groundY - obsGH * s

    const paint = (x: number, alpha: number, cracked = false) => {
      ctx.save(); ctx.globalAlpha = alpha
      drawObstacle(ctx, obs.kind, x, obsY, s, cracked)
      ctx.restore()
      drawGroundShadow(ctx, x + (obsGW * s) / 2, this.groundY, obsGW * s)
    }

    switch (obs.phase) {
      case 'approach': {
        const speed = W * 0.35 / 1000
        const minX  = this.animalX + obsGW * s * 1.4
        obs.x = Math.max(minX, obs.x - speed * dt)
        paint(obs.x, 1)
        break
      }
      case 'cracking': {
        paint(obs.x + Math.sin(obs.phaseTime * 0.28) * 4, 1, true)
        if (obs.phaseTime > 180) { obs.phase = 'breaking'; obs.phaseTime = 0 }
        break
      }
      case 'breaking': {
        const alpha = Math.max(0, 1 - obs.phaseTime / 260)
        paint(obs.x, alpha, true)
        // Debris chunks
        ctx.save(); ctx.globalAlpha = alpha
        const dColor = obs.kind === 'rock' ? '#a0a090' : obs.kind === 'wall' ? '#c04030' : '#28aa28'
        ctx.fillStyle = dColor
        for (let i = 0; i < 5; i++) {
          const dx = (i - 2) * s * 3
          const dy = -(obs.phaseTime * 0.12) + i * s * 0.8
          ctx.fillRect(obs.x + obsGW * s / 2 + dx, obsY + dy, s * 2, s * 2)
        }
        ctx.restore()
        if (obs.phaseTime > 280) { obs.phase = 'gone'; obs.phaseTime = 0 }
        break
      }
      case 'colliding': {
        const bounce = Math.sin(obs.phaseTime * 0.022) * 12 * Math.max(0, 1 - obs.phaseTime / 480)
        paint(obs.x + bounce, Math.max(0, 1 - obs.phaseTime / 540))
        if (obs.phaseTime > 540) { obs.phase = 'gone'; obs.phaseTime = 0 }
        break
      }
      case 'gone': break
    }
  }

  // ── Accessors ─────────────────────────────────────────────────────────

  get obstaclePhase(): ObstaclePhase | null { return this.obstacle?.phase ?? null }
  get animalState() { return this.animalAnim.currentState }
}
