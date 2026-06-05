const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.join(__dirname, '../reference/info/logo512.png');
const DEST = path.join(__dirname, '../public/icons');

if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

const sizes = [
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 120, name: 'apple-touch-icon-120.png' },
  { size: 152, name: 'apple-touch-icon-152.png' },
  { size: 167, name: 'apple-touch-icon-167.png' },
  { size: 180, name: 'apple-touch-icon-180.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 32,  name: 'favicon-32.png' },
  { size: 16,  name: 'favicon-16.png' },
];

async function generate() {
  const img = await Jimp.read(SOURCE);
  for (const { size, name } of sizes) {
    const clone = img.clone();
    clone.resize({ w: size, h: size });
    await clone.write(path.join(DEST, name));
    console.log(`✓ ${name} (${size}x${size})`);
  }
  console.log('Done.');
}

generate().catch(err => { console.error(err); process.exit(1); });
