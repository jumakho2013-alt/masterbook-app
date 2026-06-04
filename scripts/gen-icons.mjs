// Регенерация иконок: тот же глиф (книжка+закладка), но КРУПНЕЕ на зелёном фоне.
// Источник глифа — adaptive-icon.png (глиф на прозрачном, максимальное разрешение).
// Заодно меняются хэши файлов → Expo Go перестаёт показывать старый кэш.
//
// Запуск: node scripts/gen-icons.mjs
import sharp from 'sharp';

const DIR = 'assets/images';
const SIZE = 1024;

// Эмеральд-градиент фона (как в текущей иконке: светлее сверху-слева).
const bgSvg = (size) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2FCB8E"/>
      <stop offset="1" stop-color="#0A7F54"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
</svg>`;

// Тугой глиф без прозрачных полей (trim), чтобы контролировать его размер точно.
async function tightGlyph() {
  return sharp(`${DIR}/adaptive-icon.png`)
    .trim({ threshold: 10 })
    .toBuffer();
}

async function fitGlyph(glyph, box) {
  return sharp(glyph)
    .resize({ width: box, height: box, fit: 'inside', withoutEnlargement: false })
    .toBuffer();
}

async function run() {
  const glyph = await tightGlyph();
  const gm = await sharp(glyph).metadata();
  console.log('tight glyph:', gm.width + 'x' + gm.height);

  // icon.png — полноформатный зелёный квадрат, глиф ~88% (крупно).
  const iconGlyph = await fitGlyph(glyph, Math.round(SIZE * 0.88));
  await sharp(Buffer.from(bgSvg(SIZE)))
    .composite([{ input: iconGlyph, gravity: 'center' }])
    .png()
    .toFile(`${DIR}/icon.png`);

  // adaptive-icon.png — глиф на прозрачном, ~72% (safe-zone Android), фон даёт config.
  const adaptiveGlyph = await fitGlyph(glyph, Math.round(SIZE * 0.72));
  await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: adaptiveGlyph, gravity: 'center' }])
    .png()
    .toFile(`${DIR}/adaptive-icon.png`);

  // splash-icon.png — глиф почти во весь холст (~94%), чтобы на сплеше был крупным.
  const SPLASH = 512;
  const splashGlyph = await fitGlyph(glyph, Math.round(SPLASH * 0.94));
  await sharp({
    create: { width: SPLASH, height: SPLASH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: splashGlyph, gravity: 'center' }])
    .png()
    .toFile(`${DIR}/splash-icon.png`);

  console.log('done: icon / adaptive-icon / splash-icon regenerated');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
