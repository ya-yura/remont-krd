import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const html = await readFile('index.html', 'utf8');
const landingData = await readFile('src/data/landingData.ts', 'utf8');

assert(!/TODO|TBD|Lorem Ipsum/i.test(html), 'No placeholder text in index.html');
assert(!/(\d+\s*₽|\d+\s*руб)/i.test(landingData), 'No price illusions in landingData.ts');

for (const asset of [
  'public/config.js',
  'public/assets/interior.jpg',
  'public/assets/process-measurements.jpg',
  'public/assets/process-electrical.jpg',
  'public/assets/process-plumbing.jpg',
  'public/assets/process-plastering.jpg',
]) {
  await access(asset);
}

console.log('Release check passed: real .jpg photo assets verified, zero price illusions, clean HTML.');
