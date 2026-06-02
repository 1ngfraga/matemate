import { Sprite } from './SpriteFactory'

// ── ROCK ─────────────────────────────────────────────────────────────────
// 10 cols × 8 rows — grey boulder

export const ROCK_SPRITE: Sprite = {
  palette: {
    G: '#888888',  // grey
    L: '#aaaaaa',  // light highlight
    D: '#444444',  // dark shadow
    K: '#333333',  // darkest edge
  },
  pixels: [
    '..LLGG....',
    '.LLLGGGG..',
    'LLGGGGGGD.',
    'LGGGGGGGDK',
    'LGGGGGGGDK',
    'DGGGGGGDKK',
    '.DGGGGDKK.',
    '..DDDDKK..',
  ],
}

// Cracked rock (used for breaking animation frame 1)
export const ROCK_CRACK_SPRITE: Sprite = {
  palette: {
    G: '#888888',
    L: '#aaaaaa',
    D: '#444444',
    K: '#333333',
    C: '#222222',  // crack line
  },
  pixels: [
    '..LLGG....',
    '.LLLCGGG..',
    'LLGCGGGGD.',
    'LGGCGGGGDK',
    'LGGGCGGGDK',
    'DGGGGCGDKK',
    '.DGGGGDKK.',
    '..DDDDKK..',
  ],
}

// ── WALL / BRICK ──────────────────────────────────────────────────────────
// 10 cols × 10 rows — brick wall obstacle

export const WALL_SPRITE: Sprite = {
  palette: {
    B: '#c04040',  // brick red
    M: '#d06060',  // lighter brick
    D: '#802020',  // dark mortar shadow
    J: '#604040',  // mortar
  },
  pixels: [
    'JJJJJJJJJJ',
    'JMMMBJBMMJ',
    'JMMMBJBMMJ',
    'JJJJJJJJJJ',
    'JBBJMMMBMJ',
    'JBBJMMMBMJ',
    'JJJJJJJJJJ',
    'JMMMBJBMMJ',
    'JMMMBJBMMJ',
    'JJJJJJJJJJ',
  ],
}

// ── CACTUS ────────────────────────────────────────────────────────────────
// 8 cols × 12 rows — spiky cactus

export const CACTUS_SPRITE: Sprite = {
  palette: {
    G: '#2a8a2a',  // cactus green
    L: '#4ab44a',  // light edge
    D: '#186018',  // shadow
    S: '#f0c040',  // spine/spike tips
  },
  pixels: [
    '...LG......',
    '...GGS.....',
    'SGL GGS....',   // side arm left
    '.GG GGS....',
    '.GG GG.....',
    '..GGGGG....',
    '...GGG.....',
    '...LGS.....',
    '...GGS.....',
    '...GG......',
    '..DGDD.....',
    '..D..D.....',
  ],
}

// ── Obstacle kinds ────────────────────────────────────────────────────────

export type ObstacleKind = 'rock' | 'wall' | 'cactus'

export function getObstacleSprite(kind: ObstacleKind, cracked = false): Sprite {
  if (kind === 'rock') return cracked ? ROCK_CRACK_SPRITE : ROCK_SPRITE
  if (kind === 'wall') return WALL_SPRITE
  return CACTUS_SPRITE
}

export function randomObstacleKind(): ObstacleKind {
  const kinds: ObstacleKind[] = ['rock', 'wall', 'cactus']
  return kinds[Math.floor(Math.random() * kinds.length)]
}
