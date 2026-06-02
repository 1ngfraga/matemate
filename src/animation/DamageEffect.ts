/**
 * Full-screen red flash + optional horizontal shake for wrong answers.
 * Call trigger() on wrong answer, then update() every frame.
 */
export class DamageEffect {
  private life    = 0
  private maxLife = 420  // ms
  private active  = false

  // Screen-shake state
  private shakeTime = 0
  private shakeMax  = 280  // ms

  trigger(): void {
    this.active    = true
    this.life      = this.maxLife
    this.shakeTime = this.shakeMax
  }

  /** Returns canvas translation { dx, dy } to apply before drawing this frame */
  update(dt: number): { dx: number; dy: number } {
    let dx = 0, dy = 0

    if (this.shakeTime > 0) {
      this.shakeTime -= dt
      const mag = Math.min(1, this.shakeTime / this.shakeMax)
      dx = (Math.random() - 0.5) * 10 * mag
      dy = (Math.random() - 0.5) * 4  * mag
    }

    if (this.active) {
      this.life -= dt
      if (this.life <= 0) {
        this.life   = 0
        this.active = false
      }
    }

    return { dx: Math.round(dx), dy: Math.round(dy) }
  }

  /** Draw the red overlay — call AFTER drawing the scene */
  draw(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    if (!this.active && this.life <= 0) return
    const alpha = (this.life / this.maxLife) * 0.55
    if (alpha <= 0) return

    // Red vignette stronger at edges
    const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.8)
    grad.addColorStop(0,   `rgba(180, 20, 20, ${alpha * 0.3})`)
    grad.addColorStop(1,   `rgba(220, 20, 20, ${alpha})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Hard red border flash in first 80ms
    if (this.life > this.maxLife - 80) {
      const borderAlpha = ((this.life - (this.maxLife - 80)) / 80) * 0.7
      ctx.fillStyle = `rgba(255, 0, 0, ${borderAlpha})`
      ctx.fillRect(0, 0, W, 6)
      ctx.fillRect(0, H - 6, W, 6)
      ctx.fillRect(0, 0, 6, H)
      ctx.fillRect(W - 6, 0, 6, H)
    }
  }

  get isActive(): boolean { return this.active }
}
