// Copies the web app into www/ for Capacitor, and bundles the Firebase SDK so the APK starts offline.
// Run from the repo root: node native/build-www.mjs   (add --cdn to skip the Firebase download)
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd(), OUT = join(ROOT, 'www');
const FILES = ['index.html', 'coach.html', 'privacy.html', 'styles.css', 'manifest.webmanifest',
  'app.js', 'brands.js', 'coach.js', 'core.js', 'data.js', 'health.js', 'i18n.js', 'program.js', 'train.js'];
const DIRS = ['icons', 'fonts', 'ex'];
const CDN = /https:\/\/www\.gstatic\.com\/firebasejs\/([\d.]+)\/([\w-]+\.js)/g;

if (!existsSync(join(ROOT, 'app.js'))) { console.error('Run this from the repo root.'); process.exit(1); }
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const f of FILES) await cp(join(ROOT, f), join(OUT, f));
for (const d of DIRS) await cp(join(ROOT, d), join(OUT, d), { recursive: true });

// Firebase: download every module the app imports (and what those import), then point imports at the local copies.
const useCdn = process.argv.includes('--cdn');
const js = (await readdir(OUT)).filter(f => f.endsWith('.js'));
const want = new Map(); // file -> url
for (const f of js) for (const m of (await readFile(join(OUT, f), 'utf8')).matchAll(CDN)) want.set(m[2], m[0]);

let vendored = false;
if (!useCdn && want.size) {
  try {
    const dir = join(OUT, 'vendor', 'firebase'); await mkdir(dir, { recursive: true });
    const done = new Set();
    while ([...want.keys()].some(k => !done.has(k))) {
      for (const [name, url] of [...want]) {
        if (done.has(name)) continue;
        const r = await fetch(url); if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
        let src = await r.text();
        for (const m of src.matchAll(CDN)) if (!want.has(m[2])) want.set(m[2], m[0]);
        src = src.replace(CDN, (_, v, file) => `./${file}`);
        await writeFile(join(dir, name), src); done.add(name);
      }
    }
    for (const f of js) {
      const p = join(OUT, f), s = await readFile(p, 'utf8');
      await writeFile(p, s.replace(CDN, (_, v, file) => `./vendor/firebase/${file}`));
    }
    vendored = true;
  } catch (e) {
    console.warn(`Firebase download failed (${e.message}). Keeping the CDN links: the app will need internet the first time it opens.`);
    await rm(join(OUT, 'vendor'), { recursive: true, force: true });
  }
}
console.log(`www/ ready: ${FILES.length} files, ${DIRS.join(', ')}; Firebase ${vendored ? `bundled (${want.size} modules)` : 'from CDN'}.`);
