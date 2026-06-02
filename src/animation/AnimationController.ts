import { Animal } from '../core/Types'
import { AnimalAnimation, AnimSnapshot } from './AnimalAnimation'
import { DamageEffect } from './DamageEffect'
import { Confetti } from '../graphics/Confetti'
import { getAnimalSheet } from '../graphics/AnimalSprites'
import { drawSprite } from '../graphics/SpriteFactory'
import { drawGroundShadow } from '../graphics/PixelArtRenderer'
import { ObstacleKind, getObstacleSprite } from '../graphics/ObstacleSprites'

// ── Obstacle animation state ───────────────────────────────────────────────

type ObstaclePhase = 'approach' | 'cracking' | 'breaking' | 'gone' | 'colliding'

interface ObstacleAnim {
  kind: ObstacleKind
  x: number           // current X position in canvas coords
  phase: ObstaclePhase
  phaseTime: number   // ms in current phase
}

// ── Main controller ────────────────────────────────────────────────────────

export class AnimationController {
  private animalAnim  = new AnimalAnimation()
  private damageEffect = new DamageEffect()
  private confetti    = new Confetti()
  private obstacle: ObstacleAnim | null = null

  // Layout props set on each render (derived from canvas dimensions)
  private animalX = 0
  private animalY = 0
  private groundY = 0
  private spriteScale = 4

  constructor(private animal: Animal) {}

  // ── Game event triggers ────────────────────────────────────────────────

  onCorrectAnswer(burstX: number, burstY: number): void {
    this.animalAnim.triggerVictory()
    this.confetti.burst(burstX, burstY, 45)
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

  /** Spawn a new obstacle approaching from the right */
  spawnObstacle(kind: ObstacleKind, startX: number): void {
    this.obstacle = { kind, x: startX, phase: 'approach', phaseTime: 0 }
  }

  clearObstacle(): void { this.obstacle = null }

  setAnimal(animal: Animal): void { this.animal = animal }

  // ── Main update + draw ─────────────────────────────────────────────────

  /**
   * Call every frame. Handles all animation logic + drawing.
   * @param ctx     Game canvas context
   * @param W       Canvas CSS width
   * @param H       Canvas CSS height
   * @param dt      Delta-time in milliseconds
   * @param scrollX Background scroll amount (provided by game loop)
   */
  update(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    dt: number,
  ): void {
    // Layout
    this.spriteScale = Math.max(2, Math.floor(H / 40))
    this.groundY     = H * 0.88
    this.animalX     = W * 0.18
    this.animalY     = this.groundY - this.spriteScale * 12  // 12 rows tall sprite

    // Screen shake from damage
    const { dx, dy } = this.damageEffect.update(dt)
    ctx.save()
    ctx.translate(dx, dy)

    // Animal
    const snap = this.animalAnim.update(dt)
    this.drawAnimal(ctx, snap)

    // Obstacle
    if (this.obstacle) this.updateObstacle(ctx, dt, W, H)

    // Confetti (drawn on top)
    this.confetti.update(ctx, dt)

    ctx.restore()

    // Red overlay (no shake applied — stays fixed on screen)
    this.damageEffect.draw(ctx, W, H)
  }

  // ── Animal drawing ─────────────────────────────────────────────────────

  private drawAnimal(ctx: CanvasRenderingContext2D, snap: AnimSnapshot): void {
    const sheet = getAnimalSheet(this.animal)
    const sprite = sheet.frames[snap.frameIndex]
    if (!sprite) return

    const s   = this.spriteScale
    const x   = this.animalX + snap.offsetX
    const y   = this.animalY + snap.offsetY

    // Ground shadow
    const sw = (sprite.pixels[0]?.length ?? 12) * s
    drawGroundShadow(ctx, x + sw / 2, this.groundY, sw)

    // Sprite
    drawSprite(ctx, sprite, x, y, s, false, snap.alpha)
  }

  // ── Obstacle update + draw ─────────────────────────────────────────────

  private updateObstacle(
    ctx: CanvasRenderingContext2D,
    dt: number,
    W: number,
    _H: number,
  ): void {
    const obs = this.obstacle!
    obs.phaseTime += dt

    const s      = this.spriteScale
    const sprite = getObstacleSprite(obs.kind, obs.phase === 'cracking')
    const sprW   = (sprite.pixels[0]?.length ?? 10) * s
    const sprH   = sprite.pixels.length * s
    const obsY   = this.groundY - sprH

    switch (obs.phase) {
      case 'approach': {
        // Slide in from right at a fixed speed
        const speed = W * 0.18 / 1000  // crosses ~18% of screen per second per ms
        obs.x = Math.max(this.animalX + sprW * 1.4, obs.x - speed * dt)
        drawSprite(ctx, sprite, obs.x, obsY, s)
        drawGroundShadow(ctx, obs.x + sprW / 2, this.groundY, sprW)
        break
      }
      case 'cracking': {
        // Shake in place
        const shakeX = Math.sin(obs.phaseTime * 0.25) * 4
        drawSprite(ctx, sprite, obs.x + shakeX, obsY, s)
        if (obs.phaseTime > 180) {
          obs.phase    = 'breaking'
          obs.phaseTime = 0
        }
        break
      }
      case 'breaking': {
        // Fade out + rise slightly
        const alpha = Math.max(0, 1 - obs.phaseTime / 250)
        const rise  = obs.phaseTime * 0.04
        drawSprite(ctx, sprite, obs.x, obsY - rise, s, false, alpha)
        if (obs.phaseTime > 260) {
          obs.phase    = 'gone'
          obs.phaseTime = 0
        }
        break
      }
      case 'colliding': {
        // Bounce back and fade
        const bounce = Math.sin(obs.phaseTime * 0.02) * 8 * Math.max(0, 1 - obs.phaseTime / 400)
        const alpha  = Math.max(0, 1 - obs.phaseTime / 500)
        drawSprite(ctx, sprite, obs.x + bounce, obsY, s, false, alpha)
        if (obs.phaseTime > 500) {
          obs.phase    = 'gone'
          obs.phaseTime = 0
        }
        break
      }
      case 'gone':
        // Nothing to draw; game loop will call clearObstacle + spawnObstacle
        break
    }
  }

  // ── Accessors ─────────────────────────────────────────────────────────

  get obstaclePhase(): ObstaclePhase | null {
    return this.obstacle?.phase ?? null
  }

  get animalState() {
    return this.animalAnim.currentState
  }
}
