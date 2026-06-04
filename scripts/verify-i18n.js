/* Verifies every tr('ns.key') literal referenced in code exists in the merged RU locale.
 * tsc does NOT catch missing i18n keys, so this guards against raw-key leakage. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const core = require(path.join(root, 'src/i18n/locales/ru.json'));
const extraNames = ['clientDetail', 'appt', 'settings', 'misc', 'components'];
const extra = extraNames.map((n) => require(path.join(root, 'src/i18n/locales/extra', n + '.ru.json')));
const merged = Object.assign({}, core, ...extra);

function has(key) {
  let o = merged;
  for (const p of key.split('.')) {
    if (o && typeof o === 'object' && p in o) o = o[p];
    else return false;
  }
  return typeof o === 'string';
}

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      walk(fp, acc);
    } else if (/\.tsx?$/.test(e.name)) {
      acc.push(fp);
    }
  }
  return acc;
}

const files = [...walk(path.join(root, 'app'), []), ...walk(path.join(root, 'src/components'), [])];
const re = /\btr\(\s*['"`]([a-zA-Z0-9_.]+)['"`]/g;
const keys = new Set();
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(src))) keys.add(m[1]);
}
const missing = [...keys].filter((k) => !has(k));
console.log('referenced literal keys:', keys.size);
console.log('MISSING:', missing.length);
missing.sort().forEach((k) => console.log('  MISSING ' + k));

// Also check ru/en parity for each extra namespace.
console.log('--- ru/en parity ---');
for (const n of extraNames) {
  const ru = require(path.join(root, 'src/i18n/locales/extra', n + '.ru.json'))[n] || {};
  const en = require(path.join(root, 'src/i18n/locales/extra', n + '.en.json'))[n] || {};
  const ruK = Object.keys(ru), enK = Object.keys(en);
  const onlyRu = ruK.filter((k) => !(k in en));
  const onlyEn = enK.filter((k) => !(k in ru));
  console.log(`${n}: ru=${ruK.length} en=${enK.length}` + (onlyRu.length || onlyEn.length ? ` MISMATCH onlyRu=[${onlyRu}] onlyEn=[${onlyEn}]` : ' OK'));
}
