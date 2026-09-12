const path = require('path');
const sharp = require('sharp');

const SOURCE = path.join(
  __dirname,
  '../assets/skillmedha-logo-source.jpg'
);
const OUT = path.join(__dirname, '../assets');

async function logoOnCanvas(size, { background = '#FFFFFF', padding = 0.12, transparent = false } = {}) {
  const meta = await sharp(SOURCE).metadata();
  const inner = Math.round(size * (1 - padding * 2));
  const scale = Math.min(inner / meta.width, inner / meta.height);
  const w = Math.round(meta.width * scale);
  const h = Math.round(meta.height * scale);
  const x = Math.round((size - w) / 2);
  const y = Math.round((size - h) / 2);

  const logo = await sharp(SOURCE).resize(w, h, { fit: 'inside' }).png().toBuffer();
  const base = transparent
    ? sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    : sharp({ create: { width: size, height: size, channels: 3, background } });

  return base.composite([{ input: logo, left: x, top: y }]).png();
}

async function main() {
  await (await logoOnCanvas(1024, { background: '#FFFFFF' })).toFile(path.join(OUT, 'icon.png'));
  await (await logoOnCanvas(1024, { transparent: true, padding: 0.18 })).toFile(
    path.join(OUT, 'android-icon-foreground.png')
  );
  await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: '#FFFFFF' },
  })
    .png()
    .toFile(path.join(OUT, 'android-icon-background.png'));
  await (await logoOnCanvas(48, { background: '#FFFFFF', padding: 0.08 })).toFile(path.join(OUT, 'favicon.png'));
  await (await logoOnCanvas(512, { background: '#FFFFFF', padding: 0.1 })).toFile(path.join(OUT, 'splash-icon.png'));
  await sharp(SOURCE).png().toFile(path.join(OUT, 'skillmedha-logo.png'));

  console.log('Generated SkillMedha icon assets in assets/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
