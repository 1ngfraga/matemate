export class GameLoop {
  private raf:  number | null = null
  private last: number | null = null

  start(tick: (dt: number) => void): void {
    const loop = (now: number) => {
      // Clamp dt to 100ms so large gaps (tab switch, device sleep) don't explode physics
      const dt   = this.last !== null ? Math.min(now - this.last, 100) : 16
      this.last  = now
      tick(dt)
      this.raf   = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop(): void {
    if (this.raf !== null) { cancelAnimationFrame(this.raf); this.raf = null }
    this.last = null
  }
}
