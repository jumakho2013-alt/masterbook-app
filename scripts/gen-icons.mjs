// Генерация иконок из ЧИСТОГО векторного глифа (как в MasterBookLogo):
// книжка + золотая закладка ВРОВЕНЬ с верхом листа (не торчит), изумрудные
// акценты. icon.png — на зелёном фоне (иконка обязана быть непрозрачной);
// splash/adaptive — БЕЗ фона (прозрачный), книжка сама по себе.
//
// Запуск: node scripts/gen-icons.mjs
import sharp from 'sharp';

const DIR = 'assets/images';

// Тугой глиф (viewBox с маленьким полем вокруг книги). Лента сверху на уровне
// верхнего края листа (y=180=card top) → ничего не выпирает.
const glyphSvg = `<svg width="900" height="1031" viewBox="184 164 656 752" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="card" x1="0" y1="164" x2="0" y2="916" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F1ECE4"/>
    </linearGradient>
    <linearGradient id="ribbon" x1="620" y1="0" x2="804" y2="824" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#E6CF9E"/><stop offset="0.5" stop-color="#DBBA7C"/><stop offset="1" stop-color="#B08D57"/>
    </linearGradient>
    <clipPath id="cardClip"><rect x="200" y="180" width="624" height="720" rx="64"/></clipPath>
  </defs>
  <rect x="200" y="180" width="624" height="720" rx="64" fill="url(#card)"/>
  <rect x="280" y="320" width="360" height="22" rx="11" fill="#E2D7E8"/>
  <rect x="280" y="400" width="460" height="22" rx="11" fill="#E2D7E8" opacity="0.88"/>
  <rect x="280" y="480" width="300" height="22" rx="11" fill="#E2D7E8" opacity="0.75"/>
  <rect x="280" y="560" width="380" height="22" rx="11" fill="#E2D7E8" opacity="0.62"/>
  <circle cx="296" cy="720" r="20" fill="#6B4E71"/>
  <rect x="340" y="708" width="180" height="22" rx="11" fill="#6B4E71" opacity="0.7"/>
  <g clip-path="url(#cardClip)">
    <path d="M 620 180 L 620 824 L 712 750 L 804 824 L 804 180 Z" fill="url(#ribbon)"/>
    <rect x="624" y="184" width="6" height="640" rx="3" fill="rgba(255,255,255,0.35)"/>
  </g>
</svg>`;

// Зелёный градиент-фон только для app-icon (нужна непрозрачность).
const bgSvg = (size) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#6B4E71"/><stop offset="1" stop-color="#46384D"/>
  </linearGradient></defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
</svg>`;

async function glyphAt(box) {
  return sharp(Buffer.from(glyphSvg))
    .resize({ width: box, height: box, fit: 'inside' })
    .png()
    .toBuffer();
}

async function transparentWithGlyph(size, ratio, file) {
  const g = await glyphAt(Math.round(size * ratio));
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: g, gravity: 'center' }])
    .png()
    .toFile(`${DIR}/${file}`);
}

async function run() {
  const SIZE = 1024;

  // icon.png — зелёный фон + книжка ~88%.
  const iconGlyph = await glyphAt(Math.round(SIZE * 0.88));
  await sharp(Buffer.from(bgSvg(SIZE)))
    .composite([{ input: iconGlyph, gravity: 'center' }])
    .png()
    .toFile(`${DIR}/icon.png`);

  // adaptive-icon.png — книжка на прозрачном (Android фон даёт config) ~72%.
  await transparentWithGlyph(SIZE, 0.72, 'adaptive-icon.png');

  // splash-icon.png — книжка на прозрачном (на тёмном сплеше) ~96%.
  await transparentWithGlyph(512, 0.96, 'splash-icon.png');

  console.log('done: icon (plum bg) / adaptive / splash — clean glyph, ribbon flush');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
