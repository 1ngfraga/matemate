// SNES-cute sprite system — unified chibi-rodent body for all 3 animals.
// All sprites: 22 cols × 18 rows. 4-legged gallop animation (4 run frames).
// Character differences: color palette + ears + snout + tail.

export type DrawFn = (ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number) => void
export interface GameSprite { draw: DrawFn; gridW: number; gridH: number }
export interface GameSheet  { frames: GameSprite[] }

export const F_RUN0 = 0, F_RUN1 = 1, F_RUN2 = 2, F_RUN3 = 3
export const F_VICTORY = 4, F_HIT = 5

// ── Shared pixel helper ───────────────────────────────────────────────────

type Px = (c: string, x: number, y: number, w?: number, h?: number) => void
function mkpx(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number): Px {
  return (c, x, y, w = 1, h = 1) => {
    ctx.fillStyle = c
    ctx.fillRect(ox + x * s, oy + y * s, w * s, h * s)
  }
}

// ── Cute 4-legged gallop legs ────────────────────────────────────────────
// frame 0: FR+BL down | frame 1: mid | frame 2: FL+BR down | frame 3: mid
// Front legs near x=11-13, Back legs near x=3-5

function drawLegs(p: Px, frame: number, legColor: string, legShadow: string, K: string) {
  const bob  = (frame === 0 || frame === 2) ? -1 : 0   // body rises when legs extend
  const base = 12 + bob                                 // y where legs attach to body

  // leg(x, extended, forward): draw one leg
  const leg = (x: number, ext: boolean, fwd: boolean) => {
    const dx = fwd ? 1 : -1   // foot slant direction
    p(K, x, base, 2, 1)                                // leg root
    if (ext) {
      // Full stride
      p(legColor, x, base + 1, 1, 3); p(legShadow, x + 1, base + 1, 1, 3)
      p(K, x + dx - 1, base + 4, 4, 1)                // foot top
      p(legColor, x + dx - 1, base + 5, 3, 1)         // foot
      p(K, x + dx - 1, base + 6, 3, 1)                // ground line
    } else {
      // Pulled up / tucked
      p(legColor, x, base + 1, 1, 2); p(legShadow, x + 1, base + 1, 1, 2)
      p(K, x - dx, base + 3, 3, 1)                    // foot up
    }
  }

  if (frame === 0) {
    leg(12, true,  true);  leg(10, false, false)       // FR down, FL up
    leg(4,  false, true);  leg(3,  true,  false)       // BR up, BL down
  } else if (frame === 2) {
    leg(12, false, false); leg(10, true,  true)        // FR up, FL down
    leg(4,  true,  false); leg(3,  false, true)        // BR down, BL up
  } else {
    // neutral mid — all legs half-extended
    leg(12, false, true); leg(10, false, false)
    leg(4,  false, false); leg(3,  false, true)
  }
}

// ── Shared cute body + head ───────────────────────────────────────────────
// Everybody gets the same round body + big round head (chibi proportions).
// Character-specific stuff (ears, snout, tail, blush) is passed as callbacks.

interface BodyOptions {
  K: string    // black outline
  L: string    // light (highlight)
  M: string    // main body color
  D: string    // dark shadow
  S: string    // deepest shadow
  B: string    // belly light
  W: string    // belly mid
  Ws: string   // belly shadow
  Blush: string
  EW: string   // eye white
  EP: string   // eye pupil
  legColor: string
  legShadow: string
}

function drawBody(p: Px, o: BodyOptions) {
  const { K, L, M, D, S, B, W, Ws } = o

  // ── Body oval (cols 0-14, rows 4-13) ──
  p(K, 3, 4, 11, 1)        // top edge
  p(K, 1, 5, 1, 8)         // left edge
  p(K, 0, 6, 1, 5)         // far left (curved)
  p(K, 14, 5, 1, 7)        // right edge
  p(K, 2, 13, 13, 1)       // bottom edge
  p(K, 1, 12, 1, 1); p(K, 13, 12, 1, 1)  // bottom corners

  // Fill
  p(L, 4, 5, 8, 1)         // highlight stripe
  p(M, 2, 5, 11, 2)        // upper body
  p(M, 1, 7, 10, 3)        // mid body
  p(D, 11, 7, 3, 3)        // right shadow
  p(D, 1, 10, 10, 2)       // bottom shadow
  p(S, 11, 10, 3, 2)       // deep corner shadow
  p(S, 2, 12, 2, 1)        // bottom-left deep

  // Belly stripe (lighter, centered)
  p(B,  4, 6, 4, 1)
  p(W,  3, 7, 5, 3)
  p(Ws, 3, 10, 4, 1)

  // ── Head (cols 11-20, rows 0-8) — BIG round for cute factor ──
  p(K, 12, 0, 9, 1)        // head top
  p(K, 11, 1, 1, 7)        // head left
  p(K, 20, 1, 1, 7)        // head right
  p(K, 12, 8, 9, 1)        // head bottom

  p(L, 13, 1, 6, 1)        // highlight
  p(M, 12, 1, 1, 1); p(M, 19, 1, 1, 1)   // corners
  p(M, 13, 2, 7, 3)        // head upper fill
  p(D, 19, 2, 1, 3)        // right shadow
  p(M, 12, 5, 8, 3)        // head lower
  p(D, 19, 5, 1, 3)        // lower right shadow

  // ── Eye (cols 15-17, rows 2-5) ──
  p(K,  15, 2, 4, 4)       // socket outline
  p(o.EW, 16, 3, 2, 2)     // white
  p(o.EP, 17, 4, 1, 1)     // pupil
  p('#ccffee', 16, 3, 1, 1) // highlight dot

  // Cheek blush
  p(o.Blush, 13, 6, 2, 1)
}

// ── DINOSAUR ──────────────────────────────────────────────────────────────

function drawDino(p: Px, frame: number, hit: boolean) {
  const K='#0a0a0a', L='#88ff88', M='#33cc33', D='#1a881a', S='#0d550d'
  const B='#f0fff0', W='#b8e8b0', Ws='#78c878'
  const Y='#ffe820', Yd='#b87808'

  // Spiky nubs on head (instead of ears)
  p(Y,  14, -2); p(Y, 16, -3); p(Y, 18, -2)          // spike tips
  p(Yd, 14, -1); p(Yd,16, -2); p(Yd,18, -1)          // spike mid
  p(K,  13, -1); p(K, 15, -3, 2, 2); p(K,17, -2, 2, 2); p(K,19, -1)  // spike outline

  drawBody(p, { K, L, M, D, S, B, W, Ws, Blush: '#50dd50', EW:'#ffffff', EP:'#113311', legColor:M, legShadow:D })

  // Simple rounded dino snout
  p(M,  20, 3, 1, 3); p(D, 20, 5, 1, 1)
  p(K,  20, 6, 1, 1); p(K, 21, 3, 1, 3)
  p(K,  20, 2, 2, 1)

  // Thick dino tail
  p(K,  0, 6, 1, 4);  p(S, 1, 6, 1, 1); p(D, 1, 7, 2, 2); p(M, 1, 9, 2, 1)
  p(K,  1, 10, 3, 1); p(K, 2, 5, 2, 1)

  if (hit) {
    p('#ff4444', 15, 3, 2, 1); p('#ff4444', 15, 5, 2, 1) // X eyes
    p(Y, 21, -1); p(Y, 22, 1)                             // stars
  }

  drawLegs(p, frame, M, D, K)
}

// ── OPOSSUM / TLACUACHE ───────────────────────────────────────────────────

function drawOpossum(p: Px, frame: number, hit: boolean) {
  const K='#0a0a0a', L='#e8e8e8', M='#b8b8b8', D='#808080', S='#505050'
  const B='#f8f4f0', W='#d0d0d0', Ws='#a0a0a0'
  const PK='#e888a8', PKl='#ffc8d8'   // pink ear

  // BIG ROUND EARS — most distinctive opossum feature
  p(K,  12, -4, 4, 1); p(K, 17, -4, 4, 1)   // ear tops
  p(K,  12, -3, 1, 4); p(K, 15, -3, 1, 4)   // left ear sides
  p(K,  17, -3, 1, 4); p(K, 20, -3, 1, 4)   // right ear sides
  p(PK, 13, -4, 2, 4)                         // left ear fill (pink)
  p(PK, 18, -4, 2, 4)                         // right ear fill
  p(PKl,13, -4, 1, 1); p(PKl, 18, -4, 1, 1) // ear highlight

  drawBody(p, { K, L, M, D, S, B, W, Ws, Blush: '#e080a0', EW:'#ffffff', EP:'#221111', legColor:M, legShadow:D })

  // LONG POINTY SNOUT — very distinctive
  p(K,  20, 1, 1, 5)                          // snout top start
  p(K,  21, 2, 1, 4)                          // extend right
  p(K,  22, 3, 1, 3)                          // more taper
  p(M,  21, 3, 1, 2); p(D, 21, 4, 1, 1)      // snout fill
  p('#ff8898', 22, 4, 1, 1)                   // pink nose tip
  p(K,  22, 5, 1, 1)                          // nose bottom
  p(K,  20, 6, 3, 1)                          // snout bottom line
  p(D,  20, 5, 2, 1)                          // undersnout shadow

  // Thin curly tail
  p(K,  0, 7); p(D, 1, 7); p(D, 1, 8)
  p(K,  1, 9); p(D, 2, 9); p(K, 3, 9)
  p(K,  0, 10); p(D, 0, 10)

  if (hit) {
    p('#ff4444', 15, 3, 2, 1); p('#ff4444', 15, 5, 2, 1)
    p('#ffe820', 22, -1); p('#ffe820', 23, 1)
  }

  drawLegs(p, frame, M, D, K)
}

// ── CAPYBARA ──────────────────────────────────────────────────────────────

function drawCapybara(p: Px, frame: number, hit: boolean) {
  const K='#0a0a0a', L='#f0c060', M='#c8843c', D='#905020', S='#603008'
  const B='#f0dbb0', W='#d0b878', Ws='#a08040'
  const N='#2a1004'

  // Tiny ears (barely visible — capybaras have tiny ears)
  p(K,  14, -2, 2, 2); p(K, 17, -2, 2, 2)
  p(M,  15, -2, 1, 1); p(M, 18, -2, 1, 1)
  p(L,  14, -2, 1, 1); p(L, 17, -2, 1, 1)

  drawBody(p, { K, L, M, D, S, B, W, Ws, Blush: '#d08840', EW:'#ffffff', EP:'#1a0800', legColor:M, legShadow:D })

  // WIDE FLAT SQUARE SNOUT — most distinctive capybara feature
  p(K,  19, 1, 4, 1)                          // snout top
  p(K,  22, 2, 1, 5)                          // snout right
  p(K,  19, 2, 1, 5)                          // snout left
  p(K,  19, 7, 4, 1)                          // snout bottom
  p(D,  20, 2, 2, 4)                          // snout fill (darker than body)
  p(M,  20, 2, 2, 1)                          // snout top highlight
  p(N,  20, 5, 1, 1); p(N, 21, 5, 1, 1)     // two nostrils
  p(S,  20, 6, 2, 1)                          // under-nose dark

  // Stubby barely-there tail
  p(K, 0, 8, 2, 3); p(D, 1, 9, 1, 1)

  if (hit) {
    p('#ff4444', 15, 3, 2, 1); p('#ff4444', 15, 5, 2, 1)
    p('#ffe820', 22, -1); p('#ffe820', 23, 1)
  }

  drawLegs(p, frame, M, D, K)
}

// ── Victory pose (shared) ─────────────────────────────────────────────────

function makeVictory(drawFn: (p: Px, f: number, h: boolean) => void): GameSprite {
  return {
    gridW: 24, gridH: 20,
    draw: (ctx, ox, oy, s) => {
      const p = mkpx(ctx, ox, oy - s * 4, s)  // jump up 4 grid px
      drawFn(p, 0, false)
      // Star burst around head
      const star = mkpx(ctx, ox, oy, s)
      star('#ffe820', 21, -5); star('#ffe820', 23, -3); star('#ffe820', 19, -6)
    },
  }
}

// ── Sheet factory ─────────────────────────────────────────────────────────

function makeSheet(drawFn: (p: Px, frame: number, hit: boolean) => void): GameSheet {
  const GW = 24, GH = 20
  const run = (f: 0|1|2|3): GameSprite => ({
    gridW: GW, gridH: GH,
    draw: (ctx, ox, oy, s) => drawFn(mkpx(ctx, ox, oy, s), f, false),
  })
  return {
    frames: [
      run(0), run(1), run(2), run(3),
      makeVictory(drawFn),
      { gridW: GW, gridH: GH, draw: (ctx, ox, oy, s) => drawFn(mkpx(ctx, ox, oy, s), 0, true) },
    ],
  }
}

export const DINO_GAME_SHEET: GameSheet = makeSheet(drawDino)
export const OPOS_GAME_SHEET: GameSheet = makeSheet(drawOpossum)
export const CAPI_GAME_SHEET: GameSheet = makeSheet(drawCapybara)

// ── Obstacle draw functions ───────────────────────────────────────────────

export function drawRock(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number, cracked = false) {
  const p = mkpx(ctx, ox, oy, s)
  p('#d4d4c0', 2, 0, 10, 1); p('#d4d4c0', 0, 2, 1, 1)  // top highlight
  p('#0a0a0a', 1, 0, 11, 1)  // top outline
  p('#0a0a0a', 0, 1, 1, 7); p('#0a0a0a', 13, 1, 1, 7)   // sides
  p('#0a0a0a', 1, 8, 12, 1)  // bottom
  p('#bdbdaa', 2, 1, 8, 1)   // highlight
  p('#a0a090', 1, 1, 10, 3)  // upper fill
  p('#808070', 1, 4, 9, 3)   // mid fill
  p('#606050', 10, 1, 3, 6)  // right shadow
  p('#404030', 1, 7, 12, 1)  // bottom shadow
  if (cracked) {
    p('#0a0a0a', 5, 1, 1, 4); p('#0a0a0a', 6, 4, 1, 3)  // main crack
    p('#0a0a0a', 8, 2, 1, 2)                              // minor crack
    p('#404030', 5, 1, 1, 3); p('#404030', 6, 4, 1, 2)   // crack shadow
  }
}

export function drawWall(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number) {
  const p = mkpx(ctx, ox, oy, s)
  const K='#0a0a0a', BL='#e06050', B='#c04030', BD='#802010', M='#b09060'
  // Mortar base
  p(M, 0, 0, 12, 16)
  // Row 1
  p(K,0,0,12,1); p(K,0,3,12,1)
  p(BD,1,1,5,2); p(B,1,1,4,1); p(BL,2,1,3,1)
  p(BD,7,1,5,2); p(B,7,1,4,1); p(BL,8,1,3,1)
  // Row 2 (offset)
  p(K,0,6,12,1)
  p(BD,0,4,2,2); p(B,0,4,2,1)
  p(BD,3,4,4,2); p(B,3,4,3,1); p(BL,4,4,2,1)
  p(BD,9,4,3,2); p(B,9,4,2,1)
  // Row 3
  p(K,0,9,12,1)
  p(BD,1,7,5,2); p(B,1,7,4,1); p(BL,2,7,3,1)
  p(BD,7,7,5,2); p(B,7,7,4,1); p(BL,8,7,3,1)
  // Row 4
  p(K,0,12,12,1); p(K,0,15,12,1)
  p(BD,0,10,2,2); p(B,0,10,2,1)
  p(BD,3,10,4,2); p(B,3,10,3,1); p(BL,4,10,2,1)
  p(BD,9,10,3,2); p(B,9,10,2,1)
  // Outline
  p(K,0,0,1,16); p(K,11,0,1,16)
}

export function drawCactus(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number) {
  const p = mkpx(ctx, ox, oy, s)
  const K='#0a0a0a', CL='#60ee60', C='#28aa28', Cm='#108810', Sp='#f8e820'
  // Trunk
  p(K,4,4,4,1); p(K,4,5,1,14); p(K,7,5,1,14); p(K,4,19,4,1)
  p(CL,5,5,1,13); p(C,5,5,2,13); p(Cm,6,5,1,13)
  // Left arm
  p(K,0,9,1,5); p(K,1,8,1,1); p(K,4,7,1,3); p(K,1,13,5,1)
  p(CL,1,9,1,3); p(C,1,9,2,3); p(Cm,3,9,1,3)
  p(C,2,8,2,1); p(C,1,12,4,1)
  // Right arm
  p(K,11,7,1,5); p(K,10,6,1,1); p(K,8,6,1,2); p(K,7,11,5,1)
  p(C,8,7,2,3); p(Cm,10,7,1,3)
  p(C,8,6,3,1); p(C,7,10,4,1)
  // Spines
  p(Sp,3,4); p(Sp,8,4); p(Sp,0,8); p(Sp,0,13); p(Sp,11,6); p(Sp,11,11)
}

export function drawObstacle(ctx: CanvasRenderingContext2D, kind: string, ox: number, oy: number, s: number, cracked = false) {
  if (kind === 'rock') drawRock(ctx, ox, oy, s, cracked)
  else if (kind === 'wall') drawWall(ctx, ox, oy, s)
  else drawCactus(ctx, ox, oy, s)
}

// ── Lookup ────────────────────────────────────────────────────────────────

import { Animal } from '../core/Types'

export function getAnimalGameSheet(animal: Animal): GameSheet {
  switch (animal) {
    case Animal.Dinosaur: return DINO_GAME_SHEET
    case Animal.Opossum:  return OPOS_GAME_SHEET
    case Animal.Capybara: return CAPI_GAME_SHEET
  }
}
