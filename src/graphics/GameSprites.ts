// PNG-based sprite system.
// Character size comes directly from the PNG frame dimensions.

import { Animal } from '../core/Types'
import { loadSprite } from './SpriteLoader'

// ── Interface (kept compatible with AnimationController) ──────────────────────

export type DrawFn = (ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number) => void
export interface GameSprite { draw: DrawFn; gridW: number; gridH: number }
export interface GameSheet  { frames: GameSprite[] }

// ── Frame index constants ─────────────────────────────────────────────────────

export const F_RUN0 = 0, F_RUN1 = 1, F_RUN2 = 2, F_RUN3 = 3
export const F_VICTORY = 4, F_HIT = 5

// Each character PNG has 3 walk frames in a horizontal strip.
// Map game frame index → PNG column (ping-pong: 0→1→2→1)
const PNG_COL: number[] = [
  0,  // F_RUN0
  1,  // F_RUN1
  2,  // F_RUN2
  1,  // F_RUN3  (ping-pong)
  1,  // F_VICTORY
  0,  // F_HIT  (frame 0 + red tint)
]

function makePngCharSprite(
  img: HTMLImageElement,
  gameFrame: number,
): GameSprite {
  const col   = PNG_COL[gameFrame] ?? 0
  const isHit = gameFrame === F_HIT

  return {
    get gridW() {
      return img.naturalWidth > 0 ? img.naturalWidth / 3 : 1
    },
    get gridH() {
      return img.naturalHeight > 0 ? img.naturalHeight : 1
    },
    draw(ctx, ox, oy, s) {
      if (!img.complete || img.naturalWidth === 0) return
      const fw = img.naturalWidth / 3
      const dw = fw * s
      const dh = img.naturalHeight * s

      ctx.save()
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, col * fw, 0, fw, img.naturalHeight, ox, oy, dw, dh)

      if (isHit) {
        ctx.globalCompositeOperation = 'source-atop'
        ctx.fillStyle = 'rgba(255,60,60,0.45)'
        ctx.fillRect(ox, oy, dw, dh)
      }
      ctx.restore()
    },
  }
}

function makeCharSheet(path: string): GameSheet {
  const img = loadSprite(path)
  return {
    frames: [0, 1, 2, 3, 4, 5].map(fi => makePngCharSprite(img, fi)),
  }
}

// ── Character sheets ──────────────────────────────────────────────────────────

export const DINO_GAME_SHEET: GameSheet = makeCharSheet('sprites/dino.png')
export const OPOS_GAME_SHEET: GameSheet = makeCharSheet('sprites/opossum.png')
export const CAPI_GAME_SHEET: GameSheet = makeCharSheet('sprites/capybara.png')

export function getAnimalGameSheet(animal: Animal): GameSheet {
  switch (animal) {
    case Animal.Dinosaur: return DINO_GAME_SHEET
    case Animal.Opossum:  return OPOS_GAME_SHEET
    case Animal.Capybara: return CAPI_GAME_SHEET
  }
}

// ── Obstacle sprites (individual PNG files) ───────────────────────────────────

// Each obstacle kind maps to its own pre-cropped, transparency-trimmed PNG
const OBS_IMGS: Record<string, HTMLImageElement> = {
  rock:   loadSprite('sprites/rock.png'),
  cactus: loadSprite('sprites/lava.png'),
  wall:   loadSprite('sprites/crate.png'),
  bomb:   loadSprite('sprites/bomb.png'),
  pot:    loadSprite('sprites/pot.png'),
  ball:   loadSprite('sprites/ball.png'),
  cube:   loadSprite('sprites/cube.png'),
}

export function getObstacleSize(kind: string): { width: number; height: number } {
  const img = OBS_IMGS[kind]
  if (!img || img.naturalWidth === 0) return { width: 1, height: 1 }
  return { width: img.naturalWidth, height: img.naturalHeight }
}

export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  kind: string,
  ox: number, oy: number,
  s: number,
  _cracked = false,
): void {
  const img = OBS_IMGS[kind]
  if (!img || !img.complete || img.naturalWidth === 0) return
  const { width, height } = getObstacleSize(kind)

  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, ox, oy, width * s, height * s)
  ctx.restore()
}
