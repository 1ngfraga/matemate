// ── Sprite types ──────────────────────────────────────────────────────────

export interface Sprite {
  /** Each string is one row of pixels. One char = one pixel. '.' = transparent. */
  pixels: string[]
  /** Maps char → CSS color string */
  palette: Record<string, string>
}

export interface SpriteSheet {
  frames: Sprite[]
}

// ── Core draw function ────────────────────────────────────────────────────

/**
 * Draw a sprite on a canvas context.
 * @param ctx    Canvas 2D context
 * @param sprite Sprite to draw
 * @param x      Top-left X in CSS pixels
 * @param y      Top-left Y in CSS pixels
 * @param scale  Pixel size multiplier (e.g. 4 = each pixel is 4×4 CSS px)
 * @param flipX  Mirror horizontally
 * @param alpha  Global alpha (0-1)
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale: number,
  flipX = false,
  alpha = 1,
): void {
  const { pixels, palette } = sprite
  const rows = pixels.length
  const cols = pixels[0]?.length ?? 0
  if (!rows || !cols) return

  const ps  = Math.max(1, Math.round(scale))
  const prevAlpha = ctx.globalAlpha
  ctx.globalAlpha = alpha

  for (let row = 0; row < rows; row++) {
    const rowStr = pixels[row]
    for (let col = 0; col < cols; col++) {
      const ch = rowStr[flipX ? cols - 1 - col : col]
      if (ch === '.') continue
      const color = palette[ch]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(
        Math.round(x + col * ps),
        Math.round(y + row * ps),
        ps, ps,
      )
    }
  }

  ctx.globalAlpha = prevAlpha
}

/** Return pixel width of a sprite at a given scale */
export function spriteWidth(sprite: Sprite, scale: number): number {
  return (sprite.pixels[0]?.length ?? 0) * Math.round(scale)
}

/** Return pixel height of a sprite at a given scale */
export function spriteHeight(sprite: Sprite, scale: number): number {
  return sprite.pixels.length * Math.round(scale)
}
