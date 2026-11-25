// Generates every icon from the Locked In logo (A6 "Big beat": a dumbbell whose bar is a heartbeat, the spike in a
// lime-to-cyan gradient, white plates, on near-black).
// Run once after changing the logo (needs `sharp`, not a project dependency):
//   npm i --no-save sharp && node native/make-icons.mjs
// Writes icons/ (website + PWA) and native/res/ (Android: launcher icons, launch screen, notification icon), which are committed.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

export const INK = '#0B0F14', DISC = '#131922', LIME = '#A3E635', CYAN = '#22D3EE';
const SPIKE = 'M160 256h40l24-70 30 150 30-210 24 160 16-30h28';
const GRAD = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${LIME}"/><stop offset="1" stop-color="${CYAN}"/></linearGradient></defs>`;
const PLATES = c => `<rect x="70" y="170" width="46" height="172" rx="18" fill="${c}"/><rect x="124" y="204" width="36" height="104" rx="14" fill="${c}"/><rect x="396" y="170" width="46" height="172" rx="18" fill="${c}"/><rect x="352" y="204" width="36" height="104" rx="14" fill="${c}"/>`;
// the mark alone (transparent background) on a 512 canvas
const mark = (w = 26) => PLATES('#FFFFFF') + `<path d="${SPIKE}" fill="none" stroke="url(#g)" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${GRAD}<rect width="512" height="512" rx="116" fill="${INK}"/><g transform="translate(256 256) scale(.86) translate(-256 -256)">${mark()}</g></svg>`;
// art scaled around the centre (k < 1 adds padding)
const svg = (inner, k = 1, bg = null, round = false) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${GRAD}${round ? '<defs><clipPath id="c"><circle cx="256" cy="256" r="256"/></clipPath></defs><g clip-path="url(#c)">' : '<g>'}${bg ? `<rect width="512" height="512" fill="${bg}"/>` : ''}<g transform="translate(256 256) scale(${k}) translate(-256 -256)">${inner}</g></g></svg>`);
const png = (buf, size) => sharp(buf, { density: 300 }).resize(size, size).png().toBuffer();

// website / PWA
mkdirSync('icons', { recursive: true });
writeFileSync('icons/logo.svg', LOGO_SVG + '\n');
writeFileSync('icons/icon-192.png', await png(svg(mark(), 0.86, INK), 192));
writeFileSync('icons/icon-512.png', await png(svg(mark(), 0.86, INK), 512));
writeFileSync('icons/maskable-192.png', await png(svg(mark(), 0.7, INK), 192)); // maskable: keep inside the 80% safe circle
writeFileSync('icons/maskable-512.png', await png(svg(mark(), 0.7, INK), 512));
writeFileSync('icons/apple-touch-icon.png', await png(svg(mark(), 0.86, INK), 180));
writeFileSync('icons/favicon.png', await png(svg(mark(30), 0.92, INK, true), 64));

// Android launcher icons: legacy square + round (48dp), adaptive foreground (108dp canvas; the spike's tip and the
// plates' corners stay inside the 66dp safe circle, so no launcher shape cuts them)
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(dens)) {
  const dir = `native/res/mipmap-${d}`; mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/ic_launcher.png`, await png(svg(mark(), 0.84, INK), Math.round(48 * k)));
  writeFileSync(`${dir}/ic_launcher_round.png`, await png(svg(mark(), 0.76, INK, true), Math.round(48 * k)));
  writeFileSync(`${dir}/ic_launcher_foreground.png`, await png(svg(mark(), 0.72), Math.round(108 * k)));
  // Android 12+ launch screen icon: a dark disc with the mark, on the near-black launch background (icon area 240dp)
  writeFileSync(`${dir}/splash_icon.png`, await png(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${GRAD}<circle cx="256" cy="256" r="170" fill="${DISC}"/><g transform="translate(256 256) scale(.5) translate(-256 -256)">${mark(28)}</g></svg>`), Math.round(240 * k)));
}
writeFileSync('native/res/values/ic_launcher_background.xml', `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${INK}</color>\n    <color name="launch_background">${INK}</color>\n</resources>\n`);
// pre-Android-12 launch screen: the same disc on near-black
mkdirSync('native/res/drawable', { recursive: true });
const disc = await png(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${GRAD}<circle cx="256" cy="256" r="256" fill="${DISC}"/><g transform="translate(256 256) scale(.74) translate(-256 -256)">${mark(28)}</g></svg>`), 320);
writeFileSync('native/res/drawable/splash.png', await sharp({ create: { width: 1080, height: 1920, channels: 4, background: INK } }).composite([{ input: disc, gravity: 'center' }]).png().toBuffer());
// notification icon: white silhouette (Android tints it), plates filled, the heartbeat as a stroke
const rr = (x, y, w, h) => `M${x},${y}h${w}v${h}h-${w}z`;
writeFileSync('native/res/drawable/ic_stat_notify.xml', `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="512" android:viewportHeight="512">
    <path android:fillColor="#FFFFFFFF" android:pathData="${rr(60, 160, 56, 192)} ${rr(124, 196, 40, 120)} ${rr(396, 160, 56, 192)} ${rr(348, 196, 40, 120)}"/>
    <path android:fillColor="#00000000" android:strokeColor="#FFFFFFFF" android:strokeWidth="34" android:strokeLineCap="round" android:strokeLineJoin="round" android:pathData="${SPIKE.replace(/([a-z])/g, ' $1').trim()}"/>
</vector>
`);
console.log('icons done');
