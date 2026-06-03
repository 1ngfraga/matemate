const cache = new Map<string, HTMLImageElement>()

export function loadSprite(path: string): HTMLImageElement {
  const cached = cache.get(path)
  if (cached) return cached
  const img = new Image()
  img.src = path
  cache.set(path, img)
  return img
}

export function preloadSprites(): void {
  const paths = [
    // Characters
    'sprites/capybara.png',
    'sprites/dino.png',
    'sprites/opossum.png',
    // Obstacles (individual)
    'sprites/rock.png',
    'sprites/lava.png',
    'sprites/crate.png',
    'sprites/bomb.png',
    'sprites/pot.png',
    'sprites/ball.png',
    'sprites/cube.png',
    // Sky elements
    'sprites/sun.png',
    'sprites/cloud_a.png',
    'sprites/cloud_b.png',
    'sprites/cloud_c.png',
    // Plants (individual, uniform size)
    'sprites/plant_0.png', 'sprites/plant_1.png',
    'sprites/plant_2.png', 'sprites/plant_3.png',
    'sprites/plant_4.png', 'sprites/plant_5.png',
    'sprites/plant_6.png', 'sprites/plant_7.png',
    // Ground tiles (3 variants)
    'sprites/ground_0.png', 'sprites/ground_1.png', 'sprites/ground_2.png',
  ]
  paths.forEach(loadSprite)
}
