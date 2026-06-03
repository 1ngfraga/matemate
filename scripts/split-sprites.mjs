// One-time sprite extraction script.
// Crops sprite sheets from reference/ into individual PNG files in public/sprites/.
// Run with: node scripts/split-sprites.mjs

import { Jimp } from 'jimp'
import { mkdirSync } from 'fs'

mkdirSync('public/sprites', { recursive: true })

function trim(img) {
  // Remove fully-transparent rows/cols from edges
  img.autocrop({ tolerance: 0.005, cropOnlyFrames: false })
  return img
}

async function cropHorizontal(src, outNames) {
  const img  = await Jimp.read(src)
  const cols = outNames.length
  const fw   = Math.floor(img.width / cols)
  const fh   = img.height
  for (let i = 0; i < cols; i++) {
    const cropped = trim(img.clone().crop({ x: i * fw, y: 0, w: fw, h: fh }))
    await cropped.write(`public/sprites/${outNames[i]}`)
    console.log(`  ✓ ${outNames[i]}  (${cropped.width}×${cropped.height})`)
  }
}

async function cropGrid(src, rows, cols, outNames) {
  const img = await Jimp.read(src)
  const fw  = Math.floor(img.width  / cols)
  const fh  = Math.floor(img.height / rows)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx     = r * cols + c
      const cropped = trim(img.clone().crop({ x: c * fw, y: r * fh, w: fw, h: fh }))
      await cropped.write(`public/sprites/${outNames[idx]}`)
      console.log(`  ✓ ${outNames[idx]}  (${cropped.width}×${cropped.height})`)
    }
  }
}

// Crop a grid, autocrop each cell, then pad all cells to the same max size (centered)
async function cropGridUniform(src, rows, cols, outNames) {
  const img = await Jimp.read(src)
  const fw  = Math.floor(img.width  / cols)
  const fh  = Math.floor(img.height / rows)

  // Step 1 — collect all trimmed crops
  const crops = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cropped = trim(img.clone().crop({ x: c * fw, y: r * fh, w: fw, h: fh }))
      crops.push(cropped)
    }
  }

  // Step 2 — find the max width and height across all crops
  const maxW = Math.max(...crops.map(c => c.width))
  const maxH = Math.max(...crops.map(c => c.height))
  console.log(`  canvas size: ${maxW}×${maxH}`)

  // Step 3 — pad each crop to maxW×maxH (transparent background, centered)
  for (let i = 0; i < crops.length; i++) {
    const padded = new Jimp({ width: maxW, height: maxH, color: 0x00000000 })
    const dx = Math.floor((maxW - crops[i].width)  / 2)
    const dy = Math.floor((maxH - crops[i].height) / 2)
    padded.composite(crops[i], dx, dy)
    await padded.write(`public/sprites/${outNames[i]}`)
    console.log(`  ✓ ${outNames[i]}`)
  }
}

console.log('\n── Obstacles A (rock | lava | crate) ──')
await cropHorizontal('reference/obstaculos.png', ['rock.png', 'lava.png', 'crate.png'])

console.log('\n── Obstacles B (bomb | pot | ball | cube) ──')
await cropGrid('reference/obstaculos 2.png', 2, 2, ['bomb.png', 'pot.png', 'ball.png', 'cube.png'])

console.log('\n── Sky elements (sun | cloud_a | cloud_b | cloud_c) ──')
await cropGrid('reference/nubes y sol.png', 2, 2, ['sun.png', 'cloud_a.png', 'cloud_b.png', 'cloud_c.png'])

console.log('\n── Ground tiles (3 variants, uniform size) ──')
await cropGridUniform('reference/patron_piso.png', 1, 3, [
  'ground_0.png', 'ground_1.png', 'ground_2.png',
])

console.log('\n── Plants (8 varieties, uniform size) ──')
await cropGridUniform('reference/plantas.png', 2, 4, [
  'plant_0.png', 'plant_1.png', 'plant_2.png', 'plant_3.png',
  'plant_4.png', 'plant_5.png', 'plant_6.png', 'plant_7.png',
])

console.log('\nDone!\n')
