interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number
  color: string
  life: number       // 0 = dead, 1 = fresh
  decay: number      // per-frame decay rate
  rotation: number
  rotSpeed: number
}

const COLORS = [
  '#f0c040', '#40d060', '#4080ff', '#ff4080',
  '#ff8040', '#c040ff', '#40fff0', '#ffffff',
]

export class Confetti {
  private particles: Particle[] = []

  /** Burst confetti from a center point */
  burst(cx: number, cy: number, count = 40): void {
    for (let i = 0; i < count; i++) {
      const angle  = (Math.random() * Math.PI * 2)
      const speed  = 2 + Math.random() * 6
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 20,
        y: cy + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 3 + Math.floor(Math.random() * 5),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
        decay: 0.015 + Math.random() * 0.015,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
      })
    }
  }

  /** Update + draw. Returns true if any particles are still alive. */
  update(ctx: CanvasRenderingContext2D, dt: number): boolean {
    const gravity = 0.18
    this.particles = this.particles.filter((p) => p.life > 0)

    for (const p of this.particles) {
      p.vy += gravity
      p.x  += p.vx
      p.y  += p.vy
      p.vx *= 0.98
      p.life -= p.decay
      p.rotation += p.rotSpeed

      ctx.save()
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.translate(Math.round(p.x), Math.round(p.y))
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      ctx.restore()
    }

    return this.particles.length > 0
  }

  clear(): void { this.particles = [] }
  get alive(): boolean { return this.particles.length > 0 }
}
