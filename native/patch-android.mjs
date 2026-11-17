// One-time edits to the android/ project that `npx cap add android` generates. Safe to run again.
// Run from the repo root: node native/patch-android.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const VARS = 'android/variables.gradle';
if (!existsSync(VARS)) { console.error('No android/ project yet. Run: npx cap add android'); process.exit(1); }

let v = await readFile(VARS, 'utf8');
const before = v;
// Health Connect needs Android 8 (API 26) or newer.
v = v.replace(/minSdkVersion\s*=\s*\d+/, m => (+m.match(/\d+/)[0] < 26 ? 'minSdkVersion = 26' : m));
// @capacitor-firebase/authentication: include native Google sign-in.
if (!/rgcfaIncludeGoogle/.test(v)) v = v.replace(/ext\s*\{/, m => `${m}\n    rgcfaIncludeGoogle = true`);
if (v !== before) { await writeFile(VARS, v); console.log('variables.gradle: minSdk 26, Google sign-in on.'); }
else console.log('variables.gradle already patched.');

if (!existsSync('android/app/google-services.json'))
  console.log('\nStill needed: download google-services.json from Firebase (Project settings > Your apps > Android app)\nand put it in android/app/. It is git-ignored.');
