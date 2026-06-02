import { Sprite, SpriteSheet } from './SpriteFactory'
import { Animal } from '../core/Types'

// ── DINOSAUR ──────────────────────────────────────────────────────────────
// 12 cols × 11 rows, faces right

const DINO_PAL: Record<string, string> = {
  G: '#5ad45a',   // green body
  D: '#2a8c2a',   // dark green shadow
  W: '#8aec8a',   // light belly
  Y: '#f0c040',   // yellow spikes
  E: '#111111',   // eye
  e: '#ffffff',   // eye highlight
  T: '#1e7a1e',   // tail tip
}

// Run frame A — left leg forward
const DINO_RUN_A: Sprite = {
  palette: DINO_PAL,
  pixels: [
    '..YYY.......',
    '.YGYGGG.....',
    'TGGGGGGGG...',
    'TGGWWWWGGGE.',
    'TGGWWWWGGGG.',
    '.GGGGGGGGGe.',
    '..GGGGGGG...',
    '...DD..DD...',
    '...DD...D...',
    '...D........',
    '............',
  ],
}

// Run frame B — right leg forward
const DINO_RUN_B: Sprite = {
  palette: DINO_PAL,
  pixels: [
    '..YYY.......',
    '.YGYGGG.....',
    'TGGGGGGGG...',
    'TGGWWWWGGGE.',
    'TGGWWWWGGGG.',
    '.GGGGGGGGGe.',
    '..GGGGGGG...',
    '...DD..DD...',
    '....D..DD...',
    '........D...',
    '............',
  ],
}

// Victory — jumping, arms raised
const DINO_VICTORY: Sprite = {
  palette: DINO_PAL,
  pixels: [
    '..YYY.......',
    '.YGYGGG.....',
    'TGGGGGGGG...',
    'TGGWWWWGGGE.',
    'TGGWWWWGGGG.',
    '.GGGGGGGGGe.',
    '..GGGGGGG...',
    '...GGGGG....',
    '....GG......',
    '...D..D.....',
    '............',
  ],
}

// Hit — dazed stars
const DINO_HIT: Sprite = {
  palette: { ...DINO_PAL, S: '#ff4444', s: '#ffaaaa' },
  pixels: [
    '.S.Y.S......',
    '.YGYGGG.....',
    'TGGGGGGGG...',
    'TGGsssGGGE.',
    'TGGsssGGGG.',
    '.GGGGGGGGGe.',
    '..GGGGGGG...',
    '...DD..DD...',
    '...DD..DD...',
    '............',
    '............',
  ],
}

export const DINO_SHEET: SpriteSheet = {
  frames: [DINO_RUN_A, DINO_RUN_B, DINO_VICTORY, DINO_HIT],
}

// ── OPOSSUM / TLACUACHE ───────────────────────────────────────────────────
// 13 cols × 11 rows, faces right

const OPOS_PAL: Record<string, string> = {
  G: '#b0b0b0',   // grey body
  D: '#606060',   // dark grey
  P: '#ffaaaa',   // pink ear inner / nose
  W: '#f0f0f0',   // white face/belly
  E: '#222222',   // eye
  e: '#ffffff',   // eye highlight
  T: '#888888',   // tail
}

const OPOS_RUN_A: Sprite = {
  palette: OPOS_PAL,
  pixels: [
    '.GG...GG.....',
    '.GPG.GPG.....',  // ears with pink inside
    'DGGWWWGGGGG..',  // head + body, snout extends right
    'DGPWWWGGGGGEP',  // face belly, eye E, nose P
    'DGGWWWGGGGG..',
    '.GGGGGGGGG...',
    '..GGGGGG.....',
    '...DD..DD....',
    '...DD...D....',
    '...D.........',
    'T............',  // tail on left ground
  ],
}

const OPOS_RUN_B: Sprite = {
  palette: OPOS_PAL,
  pixels: [
    '.GG...GG.....',
    '.GPG.GPG.....',
    'DGGWWWGGGGG..',
    'DGPWWWGGGGGEP',
    'DGGWWWGGGGG..',
    '.GGGGGGGGG...',
    '..GGGGGG.....',
    '...DD..DD....',
    '....D..DD....',
    '........D....',
    '.T...........',
  ],
}

const OPOS_VICTORY: Sprite = {
  palette: OPOS_PAL,
  pixels: [
    '.GG...GG.....',
    '.GPG.GPG.....',
    'DGGWWWGGGGG..',
    'DGPWWWGGGGGEP',
    'DGGWWWGGGGG..',
    '.GGGGGGGGG...',
    '..GGGGGG.....',
    '...GGGGGG....',
    '....GG.......',
    '...D..D......',
    '.............',
  ],
}

const OPOS_HIT: Sprite = {
  palette: { ...OPOS_PAL, S: '#ff4444' },
  pixels: [
    'S.GG.S.GG....',
    '.GPG.GPG.....',
    'DGGWWWGGGGG..',
    'DGSWWWGGGGGEP',
    'DGGWWWGGGGG..',
    '.GGGGGGGGG...',
    '..GGGGGG.....',
    '...DD..DD....',
    '...DD..DD....',
    '.............',
    '.............',
  ],
}

export const OPOS_SHEET: SpriteSheet = {
  frames: [OPOS_RUN_A, OPOS_RUN_B, OPOS_VICTORY, OPOS_HIT],
}

// ── CAPYBARA ──────────────────────────────────────────────────────────────
// 14 cols × 10 rows, faces right (round, squat, big square snout)

const CAPI_PAL: Record<string, string> = {
  B: '#c8843c',   // brown body
  D: '#7a4a18',   // dark brown
  T: '#e8c890',   // tan/light belly
  N: '#3a2010',   // nostril / dark detail
  E: '#1a1008',   // eye
  e: '#ffffff',   // eye highlight
}

const CAPI_RUN_A: Sprite = {
  palette: CAPI_PAL,
  pixels: [
    '..BB....BB....',
    '.BBBBBBBBBBB..',
    'DBBTTTBBBBBBE.',  // body, belly T, eye E
    'DBBTTTBBBBBBE.',
    'DBBBBBBBBBBBNN',  // snout with nostrils N
    '.BBBBBBBBBBB..',
    '..BBBBBBBBB...',
    '...BB...BB....',
    '...BB....B....',
    '...B..........',
  ],
}

const CAPI_RUN_B: Sprite = {
  palette: CAPI_PAL,
  pixels: [
    '..BB....BB....',
    '.BBBBBBBBBBB..',
    'DBBTTTBBBBBBE.',
    'DBBTTTBBBBBBE.',
    'DBBBBBBBBBBBNN',
    '.BBBBBBBBBBB..',
    '..BBBBBBBBB...',
    '...BB...BB....',
    '....B...BB....',
    '.........B....',
  ],
}

const CAPI_VICTORY: Sprite = {
  palette: CAPI_PAL,
  pixels: [
    '..BB....BB....',
    '.BBBBBBBBBBB..',
    'DBBTTTBBBBBBE.',
    'DBBTTTBBBBBBE.',
    'DBBBBBBBBBBBNN',
    '.BBBBBBBBBBB..',
    '..BBBBBBBBB...',
    '...BBBBBBB....',
    '....BBBBB.....',
    '...B.....B....',
  ],
}

const CAPI_HIT: Sprite = {
  palette: { ...CAPI_PAL, S: '#ff4444' },
  pixels: [
    'S.BB..S.BB....',
    '.BBBBBBBBBBB..',
    'DBBTTTBBBBBBE.',
    'DBBTTTBBBBBBE.',
    'DBBBBBBBBBBBNN',
    '.BBBBBBBBBBB..',
    '..BBBBBBBBB...',
    '...BB...BB....',
    '...BB...BB....',
    '.............',
  ],
}

export const CAPI_SHEET: SpriteSheet = {
  frames: [CAPI_RUN_A, CAPI_RUN_B, CAPI_VICTORY, CAPI_HIT],
}

// ── Sprite index constants ────────────────────────────────────────────────

export const FRAME_RUN_A   = 0
export const FRAME_RUN_B   = 1
export const FRAME_VICTORY = 2
export const FRAME_HIT     = 3

/** Get the SpriteSheet for a given animal */
export function getAnimalSheet(animal: Animal): SpriteSheet {
  switch (animal) {
    case Animal.Dinosaur: return DINO_SHEET
    case Animal.Opossum:  return OPOS_SHEET
    case Animal.Capybara: return CAPI_SHEET
  }
}
