// Generates every icon from the Locked In logo (R6: black ring and bolt on neon lime).
// Run once after changing the logo (needs `sharp`, not a project dependency):
//   npm i --no-save sharp && node native/make-icons.mjs
// Writes icons/ (website + PWA) and native/res/ (Android: launcher icons, launch screen), which are committed.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

export const LIME = '#A3E635', INK = '#0B0F14';
const BOLT = 'M290 92L166 286h82l-30 134 128-200h-84l28-128z';
const T = 'translate(256 256) scale(1.32) translate(-256 -256)';
// the mark alone (transparent), on a 512 canvas; gap = the colour cut around the bolt where it crosses the ring
const mark = (fg, gap) => `<circle cx="256" cy="256" r="170" fill="none" stroke="${fg}" stroke-width="34"/><path d="${BOLT}" transform="${T}" fill="${gap}" stroke="${gap}" stroke-width="34" stroke-linejoin="round"/><path d="${BOLT}" transform="${T}" fill="${fg}" stroke="${fg}" stroke-width="8" stroke-linejoin="round"/>`;
export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${LIME}"/>${mark(INK, LIME)}</svg>`;
// art scaled around the centre (k < 1 adds padding)
const svg = (inner, k = 1, bg = null, round = false) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${round ? '<defs><clipPath id="c"><circle cx="256" cy="256" r="256"/></clipPath></defs><g clip-path="url(#c)">' : '<g>'}${bg ? `<rect width="512" height="512" fill="${bg}"/>` : ''}<g transform="translate(256 256) scale(${k}) translate(-256 -256)">${inner}</g></g></svg>`);
const png = (buf, size) => sharp(buf, { density: 300 }).resize(size, size).png().toBuffer();

// website / PWA
mkdirSync('icons', { recursive: true });
writeFileSync('icons/logo.svg', LOGO_SVG + '\n');
writeFileSync('icons/icon-192.png', await png(svg(mark(INK, LIME), 0.86, LIME), 192));
writeFileSync('icons/icon-512.png', await png(svg(mark(INK, LIME), 0.86, LIME), 512));
writeFileSync('icons/maskable-192.png', await png(svg(mark(INK, LIME), 0.7, LIME), 192)); // maskable: keep inside the 80% safe circle
writeFileSync('icons/maskable-512.png', await png(svg(mark(INK, LIME), 0.7, LIME), 512));
writeFileSync('icons/apple-touch-icon.png', await png(svg(mark(INK, LIME), 0.86, LIME), 180));
writeFileSync('icons/favicon.png', await png(svg(mark(INK, LIME), 0.92, LIME, true), 64));

// Android launcher icons: legacy square + round (48dp), adaptive foreground (108dp canvas, mark inside the 66dp circle)
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(dens)) {
  const dir = `native/res/mipmap-${d}`; mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/ic_launcher.png`, await png(svg(mark(INK, LIME), 0.82, LIME), Math.round(48 * k)));
  writeFileSync(`${dir}/ic_launcher_round.png`, await png(svg(mark(INK, LIME), 0.78, LIME, true), Math.round(48 * k)));
  writeFileSync(`${dir}/ic_launcher_foreground.png`, await png(svg(mark(INK, LIME), 0.56, LIME), Math.round(108 * k)));
  // Android 12+ launch screen icon: a lime disc with the mark, on the black launch background (icon area 240dp, disc 160dp)
  writeFileSync(`${dir}/splash_icon.png`, await png(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="170" fill="${LIME}"/><g transform="translate(256 256) scale(.56) translate(-256 -256)">${mark(INK, LIME)}</g></svg>`), Math.round(240 * k)));
}
writeFileSync('native/res/values/ic_launcher_background.xml', `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${LIME}</color>\n    <color name="launch_background">${INK}</color>\n</resources>\n`);
// pre-Android-12 launch screen: the same disc on black
mkdirSync('native/res/drawable', { recursive: true });
const disc = await png(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="256" fill="${LIME}"/><g transform="translate(256 256) scale(.82) translate(-256 -256)">${mark(INK, LIME)}</g></svg>`), 320);
writeFileSync('native/res/drawable/splash.png', await sharp({ create: { width: 1080, height: 1920, channels: 4, background: INK } }).composite([{ input: disc, gravity: 'center' }]).png().toBuffer());
console.log('icons done');
