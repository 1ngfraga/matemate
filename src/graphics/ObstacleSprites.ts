// Obstacle kind definitions — visual rendering is handled by GameSprites.ts (PNG).

// obstacles_a.png: rock | lava (was cactus) | crate (was wall)
// obstacles_b.png: bomb | pot | ball | cube
export type ObstacleKind = 'rock' | 'cactus' | 'wall' | 'bomb' | 'pot' | 'ball' | 'cube'

const ALL_KINDS: ObstacleKind[] = ['rock', 'cactus', 'wall', 'bomb', 'pot', 'ball', 'cube']

export function randomObstacleKind(): ObstacleKind {
  return ALL_KINDS[Math.floor(Math.random() * ALL_KINDS.length)]
}
