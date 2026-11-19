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

// Health Connect permissions the Capgo plugin doesn't declare itself (it covers steps, active calories, heart rate,
// sleep, SpO2, resting HR and HRV). Read-only, as everywhere in this app. Plus the <queries> entry Health Connect needs.
const MAN = 'android/app/src/main/AndroidManifest.xml';
if (existsSync(MAN)) {
  let m = await readFile(MAN, 'utf8'); const was = m;
  const perms = ['READ_BODY_TEMPERATURE', 'READ_TOTAL_CALORIES_BURNED', 'READ_EXERCISE', 'READ_HEALTH_DATA_HISTORY'];
  const add = perms.filter(p => !m.includes(`android.permission.health.${p}`)).map(p => `    <uses-permission android:name="android.permission.health.${p}" />\n`).join('');
  if (add) m = m.replace(/<\/manifest>/, `${add}</manifest>`);
  if (!m.includes('com.google.android.apps.healthdata')) m = m.replace(/<\/manifest>/, `    <queries>\n        <package android:name="com.google.android.apps.healthdata" />\n    </queries>\n</manifest>`);
  if (m !== was) { await writeFile(MAN, m); console.log('AndroidManifest.xml: Health Connect read permissions added.'); }
  else console.log('AndroidManifest.xml already patched.');
}

if (!existsSync('android/app/google-services.json'))
  console.log('\nStill needed: download google-services.json from Firebase (Project settings > Your apps > Android app)\nand put it in android/app/. It is git-ignored.');
