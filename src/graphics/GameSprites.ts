// Sprites recreated faithfully from the reference PNG images.
// Colors extracted directly from the reference files in /reference/.
// Each draw function maps to one animation frame.

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
    ctx.fillRect(Math.round(ox + x * s), Math.round(oy + y * s), Math.round(w * s), Math.round(h * s))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PALETTE CONSTANTS — extracted from reference images
// ─────────────────────────────────────────────────────────────────────────────

// OPOSSUM palette
const OK  = '#151018'  // near-black outline
const OB  = '#3A3250'  // dark body (blue-gray)
const OBm = '#5C5478'  // mid body
const OBl = '#808098'  // body highlight
const OW  = '#EDEDEA'  // white face
const OWg = '#C8C4C0'  // face shadow
const OPk = '#CC6878'  // pink (ears, nose)
const OPl = '#E898B0'  // light pink
const OT  = '#CC9098'  // tail salmon
const OTs = '#A87080'  // tail shadow
const OE  = '#FFFFFF'  // eye white
const OEp = '#101010'  // eye pupil
const OFp = '#E0B0A8'  // foot/paw flesh

// DINO palette
const DK  = '#2C1808'  // dark brown outline
const DO  = '#CC8828'  // warm orange-brown main
const DOl = '#E8AA40'  // orange highlight
const DOd = '#8A4A10'  // orange shadow
const DOs = '#4A2808'  // very dark shadow
const DCR = '#ECD898'  // cream belly
const DCl = '#F8ECC0'  // cream light
const DCs = '#C8B070'  // cream shadow
const DBl = '#F0A8A8'  // blush pink
const DEW = '#FFFFFF'
const DEp = '#101010'

// CAPYBARA palette
const CK  = '#2C1408'  // dark brown
const CC  = '#C89038'  // sandy tan main
const CCl = '#E4B860'  // tan highlight
const CCm = '#A07020'  // tan mid-shadow
const CCd = '#7A4810'  // dark shadow
const CCs = '#4A2808'  // very dark
const CSN = '#583010'  // snout dark
const CSd = '#3A1808'  // snout very dark
const CBl = '#F0A888'  // blush
const CEW = '#FFFFFF'
const CEp = '#101010'

// ─────────────────────────────────────────────────────────────────────────────
// OPOSSUM  (42 wide × 30 tall)
// Reference: dark gray-blue body, white face mask, large pink-inside ears,
//            long salmon tail, 4 legs with flesh-pink paws
// ─────────────────────────────────────────────────────────────────────────────

function drawOpossumBody(p: Px) {
  // TAIL — long trailing left & down
  p(OK, 0, 12, 1, 9)
  p(OT, 0, 12, 1, 8); p(OTs, 0, 15, 1, 4)
  p(OK, 1, 12, 1, 1); p(OT, 1, 13, 2, 6); p(OTs, 1, 16, 2, 3)
  p(OK, 0, 20, 4, 1)       // tail bottom curve
  p(OK, 2, 21, 1, 6)       // tail goes down
  p(OT, 2, 21, 1, 5); p(OTs, 2, 23, 1, 2)
  p(OK, 2, 27, 3, 1)       // tail tip

  // EARS — dark rounded with bright pink inside
  // Left ear
  p(OK, 24, 0, 6, 1)
  p(OK, 24, 1, 1, 4); p(OK, 29, 1, 1, 4)
  p(OB, 25, 0, 4, 5)
  p(OPk, 25, 1, 3, 3); p(OPl, 25, 1, 2, 1)
  p(OK, 24, 5, 6, 1)
  // Right ear
  p(OK, 31, -1, 6, 1)
  p(OK, 31, 0, 1, 4); p(OK, 36, 0, 1, 4)
  p(OB, 32, -1, 4, 5)
  p(OPk, 32, 0, 3, 3); p(OPl, 32, 0, 2, 1)
  p(OK, 31, 4, 6, 1)

  // BODY — main dark gray-blue oval
  p(OK, 4, 5, 28, 1)       // body top
  p(OK, 3, 6, 1, 14)       // body left
  p(OK, 31, 5, 1, 14)      // body right
  p(OK, 4, 20, 28, 1)      // body bottom
  // Body fill
  p(OBl, 6, 6, 22, 1)      // top highlight
  p(OBm, 4, 6, 5, 13)      // left/belly side lighter
  p(OB, 9, 6, 21, 13)      // main dark body
  p(OB, 4, 7, 5, 2)        // upper-left
  // Subtle belly lighter strip
  p(OBm, 5, 13, 8, 5)      // belly area

  // HEAD — extends right from body, dark→white transition
  p(OK, 31, 4, 11, 1)      // head top
  p(OK, 41, 5, 1, 13)      // head right
  p(OK, 31, 17, 11, 1)     // head bottom
  // Fill: dark at neck, white face forward
  p(OB, 32, 5, 3, 12)      // neck/back of head dark
  p(OBm, 35, 5, 2, 12)     // transition
  p(OW, 37, 5, 4, 10)      // white face mask
  p(OWg, 37, 14, 4, 3)     // face lower shadow

  // EYE — on white face area
  p(OK, 37, 7, 4, 4)
  p(OE, 38, 8, 2, 2)
  p(OEp, 39, 9, 1, 1)
  p(OE, 38, 8, 1, 1)       // highlight

  // NOSE tip — small pink at snout end
  p(OK, 40, 11, 2, 1)
  p(OK, 41, 12, 1, 4)
  p(OK, 40, 16, 2, 1)
  p(OW, 40, 12, 1, 4)      // snout white
  p(OPk, 41, 13, 1, 2)     // pink nose
  p(OK, 41, 12, 1, 1)      // nostril
}

function drawOpossumLegs(p: Px, frame: number) {
  const bob = (frame === 0 || frame === 2) ? -1 : 0
  const by  = 20 + bob

  // back legs (further = darker)
  const blx = frame === 0 ? 6  : frame === 2 ? 10 : 7   // back-left x
  const brx = frame === 0 ? 12 : frame === 2 ? 8  : 11  // back-right x
  // front legs (nearer = lighter)
  const flx = frame === 0 ? 22 : frame === 2 ? 26 : 22  // front-left x
  const frx = frame === 0 ? 28 : frame === 2 ? 24 : 26  // front-right x

  const ext0 = frame === 0, ext2 = frame === 2

  const leg = (x: number, ext: boolean, lite: boolean) => {
    const c = lite ? OBm : OB, d = lite ? OB : OK
    p(OK, x, by, 3, 1)
    if (ext) {
      p(c, x, by+1, 2, 4); p(d, x+2, by+1, 1, 4)
      p(OK, x-1, by+5, 5, 1)
      p(OFp, x-1, by+6, 4, 1)
      p(OK, x-1, by+7, 4, 1)
    } else {
      p(c, x, by+1, 2, 3); p(d, x+2, by+1, 1, 3)
      p(OK, x, by+4, 3, 1)
      p(OFp, x, by+5, 2, 1)
      p(OK, x, by+6, 2, 1)
    }
  }

  leg(blx, ext0, false); leg(brx, ext2, false)   // back pair
  leg(flx, ext2, true);  leg(frx, ext0, true)    // front pair
}

function makeOpossum(frame: 0|1|2|3, hit: boolean): GameSprite {
  return {
    gridW: 43, gridH: 30,
    draw(ctx, ox, oy, s) {
      const p = mkpx(ctx, ox, oy, s)
      drawOpossumBody(p)
      drawOpossumLegs(p, frame)
      if (hit) {
        p('#FF2222', 37, 8, 2, 1); p('#FF2222', 37, 10, 2, 1)
        p('#FFE820', 42, 5); p('#FFE820', 43, 7)
      }
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DINOSAUR  (26 wide × 40 tall) — bipedal T-rex baby
// Reference: warm orange-brown, cream belly, huge round head, pink blush,
//            tiny arms, 2 big legs with 3-toed feet
// ─────────────────────────────────────────────────────────────────────────────

function drawDinoBody(p: Px) {
  // TAIL — thick at body, tapers left and down
  p(DK, 0, 20, 1, 9)
  p(DOd, 1, 20, 2, 7); p(DO, 1, 20, 1, 6)
  p(DK, 1, 27, 4, 1)
  p(DK, 3, 28, 1, 5)
  p(DOd, 3, 28, 1, 4); p(DO, 3, 29, 1, 3)
  p(DK, 3, 33, 3, 1)

  // BODY — round chest barrel
  p(DK, 4, 15, 17, 1)      // body top
  p(DK, 3, 16, 1, 15)      // body left
  p(DK, 20, 16, 1, 14)     // body right
  p(DK, 4, 31, 17, 1)      // body bottom
  // Body fill
  p(DOl, 6, 16, 12, 1)     // top highlight
  p(DO, 4, 16, 15, 7)      // upper body
  p(DOd, 18, 16, 2, 14)    // right shadow
  p(DO, 4, 23, 13, 7)      // lower body
  p(DOd, 4, 30, 14, 1)     // bottom shadow
  // Cream belly oval
  p(DCl, 9, 18, 6, 1)
  p(DCR, 8, 19, 8, 7)
  p(DCs, 8, 25, 8, 4)
  p(DCl, 9, 19, 5, 1)

  // NECK
  p(DK, 9, 12, 8, 1)
  p(DK, 9, 13, 1, 3); p(DK, 16, 13, 1, 3)
  p(DOl, 10, 13, 5, 1)
  p(DO, 10, 13, 6, 3)
  p(DOd, 15, 13, 1, 3)

  // HEAD — very large and round (ref shows big cute head)
  p(DK, 5, 2, 18, 1)       // head top
  p(DK, 4, 3, 1, 10)       // head left
  p(DK, 22, 3, 1, 10)      // head right
  p(DK, 5, 13, 18, 1)      // head bottom
  // Head fill
  p(DOl, 6, 3, 14, 1)      // head top highlight
  p(DO, 5, 3, 16, 9)       // head main fill
  p(DOd, 20, 3, 2, 10)     // head right shadow
  p(DOd, 5, 12, 16, 1)     // head bottom shadow

  // Snout/jaw (right side of head)
  p(DK, 20, 8, 5, 1)       // snout top
  p(DK, 24, 9, 1, 5)       // snout right
  p(DK, 20, 14, 5, 1)      // jaw bottom
  p(DO, 21, 9, 3, 5)       // snout orange
  p(DCR, 20, 13, 4, 1)     // jaw crease

  // EYES — large, cute, with white and highlight
  p(DK, 8, 4, 7, 6)        // eye socket outline
  p(DEW, 9, 5, 5, 4)       // eye white
  p(DEp, 12, 7, 3, 2)      // pupil center
  p(DEp, 11, 6, 2, 2)      // pupil upper
  p(DEW, 9, 5, 3, 1)       // top highlight
  p(DEW, 9, 5, 1, 3)       // left highlight

  // BLUSH — pink ovals on cheeks (very visible in reference)
  p(DBl, 6, 9, 3, 2)       // left cheek blush
  p(DBl, 18, 9, 3, 2)      // right cheek blush (near snout)

  // Nostril
  p(DOs, 22, 9, 1, 1)

  // ARMS — tiny, at chest level
  p(DK, 17, 19, 4, 2)
  p(DO, 18, 19, 2, 1); p(DOd, 18, 20, 2, 1)
  p(DOs, 19, 20); p(DOs, 20, 20)             // claws
}

function drawDinoLegs(p: Px, frame: number) {
  const bob = (frame === 0 || frame === 2) ? -1 : 0
  const by  = 31 + bob

  const leg = (x: number, fwd: boolean, lite: boolean) => {
    const c = lite ? DO : DOd, d = lite ? DOd : DOs
    // Upper leg
    p(DK, x, by, 5, 1)
    p(c, x, by+1, 4, 4); p(d, x+4, by+1, 1, 4)
    // Knee joint
    p(DK, x, by+5, 6, 1)
    // Lower leg (shin)
    const sx = fwd ? x + 1 : x - 1
    p(c, sx, by+6, 4, 4); p(d, sx+4, by+6, 1, 4)
    // 3-toed foot
    p(DK, sx-1, by+10, 7, 1)
    p(c, sx, by+11, 5, 1)
    p(DOs, sx, by+11); p(DOs, sx+2, by+11); p(DOs, sx+4, by+11)
    p(DK, sx-1, by+12, 7, 1)
  }

  if (frame === 0) {
    leg(9, false, false)   // far leg (back)
    leg(5, true, true)     // near leg (forward)
  } else if (frame === 2) {
    leg(9, true, false)
    leg(5, false, true)
  } else {
    leg(9, false, false)
    leg(5, false, true)
  }
}

function makeDino(frame: 0|1|2|3, hit: boolean): GameSprite {
  return {
    gridW: 26, gridH: 44,
    draw(ctx, ox, oy, s) {
      const p = mkpx(ctx, ox, oy, s)
      drawDinoBody(p)
      drawDinoLegs(p, frame)
      if (hit) {
        p('#FF2222', 9, 6, 5, 1); p('#FF2222', 9, 8, 5, 1)
        p('#FFE820', 23, 2); p('#FFE820', 25, 4)
      }
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPYBARA  (50 wide × 28 tall) — barrel body, dark square snout, short legs
// Reference: sandy tan, wide low body, distinctive dark muzzle, tiny ears,
//            pink blush, small dark eyes
// ─────────────────────────────────────────────────────────────────────────────

function drawCapybaraBody(p: Px) {
  // BODY — very wide and slightly tall oval
  p(CK, 2, 4, 28, 1)       // body top
  p(CK, 1, 5, 1, 14)       // body left
  p(CK, 30, 4, 1, 14)      // body right
  p(CK, 2, 19, 29, 1)      // body bottom
  // Body fill
  p(CCl, 4, 5, 22, 1)      // top highlight strip
  p(CC, 2, 5, 27, 5)       // upper body
  p(CCm, 28, 5, 2, 13)     // right shadow
  p(CC, 2, 10, 24, 8)      // main body
  p(CCd, 26, 10, 4, 8)     // right-lower shadow
  p(CCd, 2, 18, 27, 1)     // bottom shadow
  // Belly lighter area
  p(CCl, 7, 7, 12, 1)
  p(CC, 6, 8, 14, 6)

  // EARS — tiny nubs on top of head area
  p(CK, 22, 1, 4, 1); p(CK, 22, 2, 1, 3); p(CK, 25, 2, 1, 3)
  p(CC, 23, 1, 2, 4); p(CCd, 23, 2, 1, 1)
  p(CK, 27, 0, 4, 1); p(CK, 27, 1, 1, 3); p(CK, 30, 1, 1, 3)
  p(CC, 28, 0, 2, 4); p(CCd, 28, 1, 1, 1)

  // EYE — small dark circle with white highlight
  p(CK, 25, 7, 4, 4)
  p(CEW, 26, 8, 2, 2)
  p(CEp, 27, 9, 1, 1)
  p(CEW, 26, 8, 1, 1)

  // BLUSH
  p(CBl, 22, 12, 3, 2)
  p(CBl, 29, 12, 3, 2)

  // HEAD (top-right area, extends body into face)
  // The head visually merges with the body - mainly defined by snout

  // SNOUT — dark large square, most distinctive feature
  p(CK, 30, 5, 10, 1)      // snout top
  p(CK, 39, 6, 1, 9)       // snout right
  p(CK, 30, 15, 10, 1)     // snout bottom
  p(CSN, 31, 6, 8, 9)      // snout fill
  p(CSd, 31, 6, 7, 1)      // snout top-front (even darker)
  // Nostrils
  p(CK, 33, 10, 2, 1); p(CK, 36, 10, 2, 1)
  p(CSd, 33, 11, 2, 1); p(CSd, 36, 11, 2, 1)
}

function drawCapybaraLegs(p: Px, frame: number) {
  const bob = (frame === 1 || frame === 3) ? 0 : -1
  const by  = 19 + bob

  // frame 0: FR+BL extended; frame 2: FL+BR extended; 1,3: neutral
  type LegDef = { x: number; ext: boolean; lite: boolean }

  let legs: LegDef[]
  if (frame === 0) {
    legs = [
      { x: 3,  ext: false, lite: false }, // BL tucked
      { x: 8,  ext: true,  lite: false }, // BR extended
      { x: 20, ext: false, lite: true  }, // FL tucked
      { x: 25, ext: true,  lite: true  }, // FR extended
    ]
  } else if (frame === 2) {
    legs = [
      { x: 3,  ext: true,  lite: false },
      { x: 8,  ext: false, lite: false },
      { x: 20, ext: true,  lite: true  },
      { x: 25, ext: false, lite: true  },
    ]
  } else {
    legs = [
      { x: 3,  ext: false, lite: false },
      { x: 9,  ext: false, lite: false },
      { x: 21, ext: false, lite: true  },
      { x: 26, ext: false, lite: true  },
    ]
  }

  for (const { x, ext, lite } of legs) {
    const c = lite ? CC : CCd, d = lite ? CCd : CCs
    p(CK, x, by, 4, 1)
    if (ext) {
      p(c, x, by+1, 3, 3); p(d, x+3, by+1, 1, 3)
      p(CK, x-1, by+4, 6, 1)
      p(CSN, x, by+5, 4, 1)     // dark paw
      p(CK, x, by+6, 4, 1)
    } else {
      p(c, x, by+1, 3, 2); p(d, x+3, by+1, 1, 2)
      p(CK, x, by+3, 4, 1)
      p(CSN, x, by+4, 3, 1)
      p(CK, x, by+5, 3, 1)
    }
  }
}

function makeCapybara(frame: 0|1|2|3, hit: boolean): GameSprite {
  return {
    gridW: 40, gridH: 28,
    draw(ctx, ox, oy, s) {
      const p = mkpx(ctx, ox, oy, s)
      drawCapybaraBody(p)
      drawCapybaraLegs(p, frame)
      if (hit) {
        p('#FF2222', 25, 8, 3, 1); p('#FF2222', 25, 10, 3, 1)
        p('#FFE820', 39, 4); p('#FFE820', 41, 6)
      }
    },
  }
}

// ── Sheet builders ────────────────────────────────────────────────────────

function makeSheet<F extends 0|1|2|3>(
  run: (f: F, hit: boolean) => GameSprite,
  GW: number, GH: number,
): GameSheet {
  return {
    frames: [
      run(0 as F, false), run(1 as F, false),
      run(2 as F, false), run(3 as F, false),
      // Victory: frame 0 + small star
      {
        gridW: GW, gridH: GH,
        draw(ctx, ox, oy, s) {
          run(0 as F, false).draw(ctx, ox, oy, s)
          const p = mkpx(ctx, ox, oy, s)
          p('#FFE820', GW, 0); p('#FFE820', GW + 2, 2)
        },
      },
      // Hit
      run(0 as F, true),
    ],
  }
}

export const OPOS_GAME_SHEET: GameSheet = makeSheet(makeOpossum, 43, 30)
export const DINO_GAME_SHEET: GameSheet = makeSheet(makeDino, 26, 44)
export const CAPI_GAME_SHEET: GameSheet = makeSheet(makeCapybara, 40, 28)

// ── Obstacles ─────────────────────────────────────────────────────────────

export function drawRock(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number, cracked = false) {
  const p = mkpx(ctx, ox, oy, s)
  p('#0a0a0a', 1, 0, 11, 1); p('#0a0a0a', 0, 1, 1, 7); p('#0a0a0a', 12, 1, 1, 7); p('#0a0a0a', 1, 8, 11, 1)
  p('#d4d4c0', 2, 1, 8, 1)
  p('#b0b0a0', 1, 1, 10, 3)
  p('#909085', 1, 4, 9, 3)
  p('#606055', 10, 1, 2, 6)
  p('#404035', 1, 7, 11, 1)
  if (cracked) {
    p('#0a0a0a', 5, 1, 1, 4); p('#0a0a0a', 6, 4, 1, 3)
    p('#404035', 5, 1, 1, 3)
  }
}

export function drawWall(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: number) {
  const p = mkpx(ctx, ox, oy, s)
  const BL='#e06050', B='#c04030', BD='#802010', M='#b09060', K='#0a0a0a'
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
