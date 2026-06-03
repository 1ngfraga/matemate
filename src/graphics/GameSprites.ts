// Pixel art sprites matching the reference chibi style.
// Opossum: dark gray body + white face mask, quadruped.
// Dino: orange-brown T-rex, bipedal, big round head.
// Capybara: sandy-tan barrel body, quadruped, dark snout.

export type DrawFn = (ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number) => void
export interface GameSprite { draw: DrawFn; gridW: number; gridH: number }
export interface GameSheet  { frames: GameSprite[] }

export const F_RUN0 = 0, F_RUN1 = 1, F_RUN2 = 2, F_RUN3 = 3
export const F_VICTORY = 4, F_HIT = 5

type Px = (c: string, x: number, y: number, w?: number, h?: number) => void

function mkpx(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number): Px {
  return (c, x, y, w = 1, h = 1) => {
    if (!c) return
    ctx.fillStyle = c
    ctx.fillRect(ox + x * s, oy + y * s, w * s, h * s)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OPOSSUM — dark gray body, white face mask, long pink tail, quadruped
// Grid: 28 wide × 16 tall
// ─────────────────────────────────────────────────────────────────────────────

function drawOpossum(p: Px, legFrame: number, hit: boolean) {
  const K  = '#0a0a0a'   // outline
  const B  = '#3a3248'   // dark body (blue-gray)
  const Bm = '#5a5070'   // mid body
  const Bl = '#807898'   // light body highlight
  const W  = '#f2eeea'   // white face mask
  const Wm = '#d8d2cc'   // face shadow
  const Pk = '#e06878'   // pink (ears inside, nose)
  const Pl = '#f098a8'   // pink light
  const T  = '#d09090'   // tail color
  const Ts = '#a06060'   // tail shadow
  const EW = '#ffffff'   // eye white
  const EP = '#1a0820'   // eye pupil
  const Blush = '#e89098'

  // ── TAIL (left side, long trailing tail) ──
  p(K,  0, 7, 1, 6)
  p(T,  0, 7, 1, 5)
  p(Ts, 0, 9, 1, 2)
  p(K,  1, 7, 1, 1); p(T, 1, 8, 1, 4)
  p(K,  1, 12, 2, 1)
  // Tail curves down and right at the bottom
  p(K,  2, 11, 2, 1); p(T, 2, 11, 1, 1)
  p(K,  3, 12, 1, 2); p(T, 3, 12, 1, 1)
  p(K,  3, 14, 2, 1); p(T, 3, 13, 1, 1)

  // ── BODY (dark gray, hunched) ──
  p(K,  3, 4, 14, 1)      // body top
  p(K,  2, 5, 1, 8)       // body left
  p(K,  16, 4, 1, 7)      // body right
  p(K,  3, 12, 14, 1)     // body bottom

  p(Bl, 5, 5, 9, 1)       // top highlight
  p(Bm, 3, 5, 12, 2)      // upper body
  p(B,  3, 7, 10, 4)      // main body
  p(K,  13, 5, 3, 6)      // right shadow zone
  p(B,  13, 5, 2, 5)      // right shadow
  p(K,  15, 5, 1, 6)      // body right edge

  // Belly (lighter fur strip)
  p(Wm, 5, 8, 5, 3)
  p(W,  5, 8, 4, 2)

  // ── HEAD (round, white face mask) ──
  // Ears first (dark, with pink inside)
  p(K,  17, -2, 4, 1); p(K, 22, -2, 4, 1)   // ear tops
  p(K,  17, -1, 1, 4); p(K, 20, -1, 1, 4)   // left ear sides
  p(K,  22, -1, 1, 4); p(K, 25, -1, 1, 4)   // right ear sides
  p(B,  18, -2, 2, 4); p(B, 23, -2, 2, 4)   // ear dark fill
  p(Pk, 18, -1, 2, 3); p(Pk, 23, -1, 2, 3)  // pink inner ear
  p(Pl, 18, -1, 1, 1); p(Pl, 23, -1, 1, 1)  // ear highlight

  // Head outline
  p(K,  16, 0, 12, 1)    // head top
  p(K,  16, 1, 1, 7)     // head left
  p(K,  27, 1, 1, 7)     // head right
  p(K,  16, 8, 12, 1)    // head bottom

  // Head fill - body color at back, white mask in front
  p(Bm, 17, 1, 4, 7)     // back of head (dark)
  p(B,  20, 1, 1, 7)     // transition
  p(W,  21, 1, 5, 7)     // white face mask
  p(Wm, 21, 6, 5, 2)     // face lower shadow

  // Eye (on white area)
  p(K,  22, 2, 3, 4)
  p(EW, 23, 3, 2, 2)
  p(EP, 24, 4, 1, 1)
  p(EW, 23, 3, 1, 1)     // highlight
  p(Blush, 22, 6, 2, 1)  // cheek blush

  // Pointed snout extending right
  p(K,  26, 3, 2, 1)
  p(K,  27, 4, 2, 3)
  p(K,  26, 7, 3, 1)
  p(Wm, 27, 4, 1, 3)     // snout fill
  p(Pk, 28, 5, 1, 1)     // pink nose tip
  p(K,  28, 4, 1, 1); p(K, 28, 6, 1, 1)  // nose outline

  // ── LEGS (4-legged running) ──
  const bob = (legFrame === 1 || legFrame === 3) ? 0 : -1
  const by  = 12 + bob
  const Lc  = Bm, Ld = B

  const leg = (x: number, ext: boolean, fwd: boolean, lite: boolean) => {
    const c = lite ? Bm : B, d = lite ? B : K
    p(K,  x, by, 2, 1)
    if (ext) {
      p(c,  x, by+1, 1, 3); p(d, x+1, by+1, 1, 3)
      const fx = fwd ? x+1 : x-1
      p(K,  fx-1, by+4, 4, 1)   // foot
      p(Pk, fx-1, by+5, 3, 1)   // pink paw
      p(K,  fx-1, by+6, 3, 1)   // paw ground
    } else {
      p(c,  x, by+1, 1, 2); p(d, x+1, by+1, 1, 2)
      p(K,  x, by+3, 2, 1)
    }
  }

  if (legFrame === 0) {
    leg(13, true,  true,  true);  leg(11, false, false, true)
    leg(5,  false, true,  false); leg(3,  true,  false, false)
  } else if (legFrame === 2) {
    leg(13, false, false, true);  leg(11, true,  true,  true)
    leg(5,  true,  false, false); leg(3,  false, true,  false)
  } else {
    leg(13, false, true, true);  leg(11, false, false, true)
    leg(5,  false, false, false); leg(3,  false, true,  false)
  }

  if (hit) {
    p('#ff3333', 22, 3, 2, 1); p('#ff3333', 22, 5, 2, 1)  // X eyes
    p('#ffe820', 27, 0); p('#ffe820', 29, 2)               // stars
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DINOSAUR — orange-brown T-rex, BIPEDAL, big round head, cream belly
// Grid: 20 wide × 24 tall  (taller because it stands upright!)
// ─────────────────────────────────────────────────────────────────────────────

function drawDino(p: Px, legFrame: number, hit: boolean) {
  const K  = '#0a0a0a'
  const O  = '#d4882a'   // orange-brown main
  const OL = '#e8aa45'   // light orange highlight
  const OD = '#a45e10'   // dark orange shadow
  const OS = '#7a3e08'   // very dark
  const CR = '#f0e0a0'   // cream belly
  const CRs= '#d4c078'   // cream shadow
  const Blush = '#f0a0a0'
  const EW = '#ffffff'
  const EP = '#1a0800'

  // ── TAIL (fat dino tail, bottom left) ──
  p(K,  0, 14, 1, 6)
  p(OD, 1, 14, 2, 4); p(O, 1, 15, 1, 3)
  p(K,  1, 18, 3, 1)
  p(OD, 2, 17, 1, 1)
  p(K,  2, 18, 2, 3)
  p(OD, 2, 19, 2, 2); p(O, 2, 19, 1, 2)
  p(K,  2, 21, 3, 1); p(OD, 3, 20, 1, 1)

  // ── BODY (round, belly strip) ──
  p(K,  4, 10, 12, 1)    // body top
  p(K,  3, 11, 1, 10)    // body left
  p(K,  15, 11, 1, 9)    // body right
  p(K,  4, 20, 12, 1)    // body bottom

  p(OL, 5, 11, 8, 1)     // body top highlight
  p(O,  4, 11, 10, 3)    // upper body
  p(OD, 13, 11, 2, 8)    // right shadow
  p(O,  4, 14, 9, 5)     // mid body
  p(OD, 4, 19, 10, 1)    // bottom shadow

  // Belly/chest cream
  p(CR, 6, 12, 4, 7)
  p(CRs,6, 18, 4, 1)
  p(CRs,9, 12, 1, 6)     // belly right edge

  // ── SMALL ARMS (raised at chest level) ──
  p(K,  14, 12, 2, 3)
  p(O,  14, 13, 1, 2); p(OD, 15, 13, 1, 2)
  p(K,  14, 15, 3, 1)    // claws
  p(OS, 15, 15); p(OS, 16, 15)

  // ── NECK ──
  p(K,  7, 7, 6, 1)
  p(K,  7, 8, 1, 3); p(K, 12, 8, 1, 3)
  p(OL, 8, 8, 3, 1); p(O, 8, 8, 4, 3); p(OD, 11, 8, 1, 3)

  // ── HEAD (big round, cute T-rex) ──
  p(K,  5, 0, 12, 1)     // head top
  p(K,  4, 1, 1, 7)      // head left
  p(K,  16, 1, 1, 7)     // head right
  p(K,  5, 8, 12, 1)     // head bottom

  p(OL, 6, 1, 8, 1)      // top highlight
  p(O,  5, 1, 1, 1); p(O, 14, 1, 1, 1)  // corners
  p(O,  5, 2, 10, 5)     // head main
  p(OD, 14, 1, 2, 7)     // right shadow
  p(OD, 5, 7, 10, 1)     // bottom shadow
  p(O,  6, 2, 8, 1)      // upper fill

  // ── FACE ──
  // Eye (large and cute)
  p(K,  8, 2, 5, 4)
  p(EW, 9, 3, 3, 2)
  p(EP, 11, 4, 1, 1)
  p(EW, 9, 3, 1, 1)      // highlight
  p(K,  11, 3, 1, 1)     // pupil top

  // Blush
  p(Blush, 6, 5, 2, 1); p(Blush, 7, 6, 1, 1)

  // Snout (front of mouth area)
  p(K,  14, 3, 3, 1)     // snout top
  p(K,  16, 4, 1, 3)     // snout right
  p(K,  14, 6, 3, 1)     // jaw
  p(O,  15, 4, 1, 2)     // snout fill
  p(CR, 14, 5, 2, 1)     // mouth line

  // Nostril
  p(OS, 15, 3, 1, 1)

  // ── LEGS (bipedal, 2 big legs) ──
  const bob = (legFrame === 0 || legFrame === 2) ? -1 : 0
  const by  = 20 + bob

  const bipedLeg = (x: number, forward: boolean, lite: boolean) => {
    const c = lite ? O : OD, d = lite ? OD : OS
    p(K,  x, by, 3, 1)
    p(c,  x, by+1, 2, 3); p(d, x+2, by+1, 1, 3)
    // Knee
    p(K,  x, by+4, 4, 1)
    // Shin
    const sx = forward ? x+1 : x-1
    p(c,  sx, by+5, 2, 2); p(d, sx+2, by+5, 1, 2)
    // Foot / 3 toes
    p(K,  sx-1, by+7, 5, 1)
    p(c,  sx-1, by+8, 4, 1)
    p(K,  sx-1, by+9, 5, 1)
  }

  if (legFrame === 0) {
    bipedLeg(9, true, false)   // left leg (far, darker)
    bipedLeg(6, false, true)   // right leg (near, lighter)
  } else if (legFrame === 2) {
    bipedLeg(9, false, false)
    bipedLeg(6, true, true)
  } else {
    bipedLeg(9, false, false)
    bipedLeg(6, false, true)
  }

  if (hit) {
    p('#ff3333', 8, 3, 4, 1); p('#ff3333', 8, 5, 4, 1)  // X eyes
    p('#ffe820', 17, 0); p('#ffe820', 18, 2)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPYBARA — sandy-tan barrel body, dark square snout, short legs, quadruped
// Grid: 28 wide × 14 tall
// ─────────────────────────────────────────────────────────────────────────────

function drawCapybara(p: Px, legFrame: number, hit: boolean) {
  const K  = '#0a0a0a'
  const C  = '#c8943a'   // main sandy brown
  const CL = '#e0b860'   // light highlight
  const Cm = '#a07020'   // mid shadow
  const CD = '#784a08'   // dark shadow
  const CS = '#503008'   // deep shadow
  const SN = '#5a3010'   // snout dark brown
  const SNl= '#8a5830'   // snout lighter
  const Blush = '#f0a888'
  const EW = '#ffffff'
  const EP = '#1a0a00'

  // ── BODY (wide barrel, the capybara shape) ──
  // Very wide and slightly low — signature capybara silhouette
  p(K,  2, 2, 20, 1)     // body top
  p(K,  1, 3, 1, 9)      // body left
  p(K,  22, 2, 1, 9)     // body right
  p(K,  2, 11, 21, 1)    // body bottom
  // Rounding at corners
  p(K,  2, 2, 1, 1); p(K, 21, 2, 1, 1)

  p(CL, 4, 3, 14, 1)     // top highlight strip
  p(C,  2, 3, 19, 3)     // upper body
  p(Cm, 20, 3, 2, 7)     // right shadow
  p(C,  2, 6, 17, 4)     // mid body
  p(CD, 2, 10, 19, 1)    // bottom shadow

  // Belly lighter
  p(CL, 6, 5, 8, 1)
  p(C,  5, 6, 9, 3)

  // ── HEAD (square and low, merges with body) ──
  // Ears (tiny, on top of head)
  p(K,  18, -2, 3, 2); p(K, 22, -2, 3, 2)
  p(C,  19, -2, 2, 1); p(C, 23, -2, 2, 1)
  p(CD, 19, -1, 1, 1); p(CD, 23, -1, 1, 1)

  // Head top and forehead (slightly elevated from body)
  p(K,  16, -1, 10, 1)   // forehead top
  p(K,  15, 0, 1, 3)     // head left
  p(K,  25, 0, 1, 8)     // head right
  p(CL, 17, 0, 7, 1)     // forehead highlight
  p(C,  16, 0, 9, 4)     // head upper fill
  p(Cm, 24, 0, 1, 7)     // head right shadow

  // Eye (dark, cute dot)
  p(K,  20, 1, 3, 3)
  p(EW, 21, 2, 2, 1)
  p(EP, 22, 2, 1, 1)
  p(EW, 21, 2, 1, 1)
  // Blush
  p(Blush, 18, 4, 2, 1)

  // ── SNOUT (dark square — most distinctive capybara feature) ──
  p(K,  22, 3, 7, 1)     // snout top
  p(K,  28, 4, 1, 5)     // snout right
  p(K,  22, 8, 7, 1)     // snout bottom
  p(SN, 23, 4, 5, 4)     // snout fill (dark)
  p(SNl,23, 4, 4, 1)     // snout top lighter
  // Nostrils
  p(CS, 24, 6, 1, 1); p(CS, 26, 6, 1, 1)
  p(K,  24, 5, 1, 1); p(K, 26, 5, 1, 1)

  // ── LEGS (4 short stubby legs) ──
  const bob = (legFrame === 1 || legFrame === 3) ? 0 : -1
  const by  = 11 + bob

  const leg = (x: number, ext: boolean, fwd: boolean, lite: boolean) => {
    const c = lite ? C : Cm, d = lite ? Cm : CD
    p(K,  x, by, 3, 1)
    if (ext) {
      p(c,  x, by+1, 2, 3); p(d, x+2, by+1, 1, 3)
      const fx = fwd ? x+1 : x-1
      p(K,  fx-1, by+4, 5, 1)
      p(SN, fx, by+5, 3, 1)   // dark paw
      p(K,  fx, by+6, 3, 1)
    } else {
      p(c,  x, by+1, 2, 2); p(d, x+2, by+1, 1, 2)
      p(K,  x, by+3, 3, 1)
    }
  }

  if (legFrame === 0) {
    leg(17, true,  true,  true);  leg(14, false, false, true)
    leg(6,  false, true,  false); leg(3,  true,  false, false)
  } else if (legFrame === 2) {
    leg(17, false, false, true);  leg(14, true,  true,  true)
    leg(6,  true,  false, false); leg(3,  false, true,  false)
  } else {
    leg(17, false, true,  true);  leg(14, false, false, true)
    leg(6,  false, false, false); leg(3,  false, true,  false)
  }

  if (hit) {
    p('#ff3333', 20, 2, 3, 1); p('#ff3333', 20, 4, 3, 1)
    p('#ffe820', 28, -1); p('#ffe820', 29, 1)
  }
}

// ── Sheet factory ─────────────────────────────────────────────────────────

function makeSheet(
  drawFn: (p: Px, frame: number, hit: boolean) => void,
  GW: number, GH: number,
): GameSheet {
  const run = (f: 0|1|2|3): GameSprite => ({
    gridW: GW, gridH: GH,
    draw: (ctx, ox, oy, s) => drawFn(mkpx(ctx, ox, oy, s), f, false),
  })
  return {
    frames: [
      run(0), run(1), run(2), run(3),
      // Victory: brief happy pose (no jump, just frame 0)
      {
        gridW: GW, gridH: GH,
        draw: (ctx, ox, oy, s) => {
          const p = mkpx(ctx, ox, oy, s)
          drawFn(p, 0, false)
          // Small stars
          p('#ffe820', GW, 0); p('#ffe820', GW+1, 2)
        },
      },
      // Hit
      {
        gridW: GW, gridH: GH,
        draw: (ctx, ox, oy, s) => drawFn(mkpx(ctx, ox, oy, s), 0, true),
      },
    ],
  }
}

export const OPOS_GAME_SHEET: GameSheet = makeSheet(drawOpossum, 30, 18)
export const DINO_GAME_SHEET: GameSheet = makeSheet(drawDino,    20, 30)
export const CAPI_GAME_SHEET: GameSheet = makeSheet(drawCapybara, 30, 16)

// ── Obstacle sprites ──────────────────────────────────────────────────────

export function drawRock(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number, cracked = false) {
  const p = mkpx(ctx, ox, oy, s)
  p('#0a0a0a', 1, 0, 11, 1); p('#0a0a0a', 0, 1, 1, 7); p('#0a0a0a', 12, 1, 1, 7); p('#0a0a0a', 1, 8, 11, 1)
  p('#d4d4c0', 2, 1, 8, 1)   // top highlight
  p('#b0b0a0', 1, 1, 10, 3)  // upper face
  p('#909085', 1, 4, 9, 3)   // mid
  p('#606055', 10, 1, 2, 6)  // right shadow
  p('#404035', 1, 7, 11, 1)  // bottom
  if (cracked) {
    p('#0a0a0a', 5, 1, 1, 4); p('#0a0a0a', 6, 4, 1, 3)
    p('#404035', 5, 1, 1, 3)
  }
}

export function drawWall(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number) {
  const p = mkpx(ctx, ox, oy, s)
  const K='#0a0a0a', BL='#e06050', B='#c04030', BD='#802010', M='#b09060'
  p(M, 0, 0, 12, 16)
  p(K,0,0,12,1); p(K,0,3,12,1); p(BD,1,1,5,2); p(B,1,1,4,1); p(BL,2,1,3,1); p(BD,7,1,5,2); p(B,7,1,4,1); p(BL,8,1,3,1)
  p(K,0,6,12,1); p(BD,0,4,2,2); p(B,0,4,2,1); p(BD,3,4,4,2); p(B,3,4,3,1); p(BL,4,4,2,1); p(BD,9,4,3,2); p(B,9,4,2,1)
  p(K,0,9,12,1); p(BD,1,7,5,2); p(B,1,7,4,1); p(BL,2,7,3,1); p(BD,7,7,5,2); p(B,7,7,4,1); p(BL,8,7,3,1)
  p(K,0,12,12,1); p(K,0,15,12,1); p(BD,0,10,2,2); p(B,0,10,2,1); p(BD,3,10,4,2); p(B,3,10,3,1); p(BL,4,10,2,1); p(BD,9,10,3,2); p(B,9,10,2,1)
  p(K,0,0,1,16); p(K,11,0,1,16)
}

export function drawCactus(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number) {
  const p = mkpx(ctx, ox, oy, s)
  const K='#0a0a0a', CL='#60ee60', C='#28aa28', Cm='#108810', Sp='#f8e820'
  p(K,4,4,4,1); p(K,4,5,1,14); p(K,7,5,1,14); p(K,4,19,4,1)
  p(CL,5,5,1,13); p(C,5,5,2,13); p(Cm,6,5,1,13)
  p(K,0,9,1,5); p(K,1,8,1,1); p(K,4,7,1,3); p(K,1,13,5,1); p(CL,1,9,1,3); p(C,1,9,2,3); p(Cm,3,9,1,3); p(C,2,8,2,1); p(C,1,12,4,1)
  p(K,11,7,1,5); p(K,10,6,1,1); p(K,8,6,1,2); p(K,7,11,5,1); p(C,8,7,2,3); p(Cm,10,7,1,3); p(C,8,6,3,1); p(C,7,10,4,1)
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
