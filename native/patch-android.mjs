// One-time edits to the android/ project that `npx cap add android` generates. Safe to run again.
// Run from the repo root: node native/patch-android.mjs
import { readFile, writeFile, cp } from 'node:fs/promises';
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

// App icon and launch screen: the Lock In 90 padlock on navy instead of Capacitor's placeholder logo.
// native/res holds the generated PNGs (from icons/maskable-512.png); copied over the defaults every run.
const RES = 'android/app/src/main/res';
if (existsSync(RES)) {
  await cp('native/res', RES, { recursive: true });
  const ST = `${RES}/values/styles.xml`;
  let s = await readFile(ST, 'utf8'); const was = s;
  // Android 12+ draws its own launch screen (icon on a colour) and ignores @drawable/splash: the lime disc on black
  s = s.replace(/\s*<item name="windowSplashScreen(Background|AnimatedIcon)">[^<]*<\/item>/g, '').replace(/\s*<item name="postSplashScreenTheme">[^<]*<\/item>/g, '');
  s = s.replace(/(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)/, `$1
        <item name="windowSplashScreenBackground">@color/launch_background</item>
        <item name="windowSplashScreenAnimatedIcon">@mipmap/splash_icon</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>`);
  if (s !== was) await writeFile(ST, s);
  // the name under the icon (cap add wrote the old one)
  const SX = `${RES}/values/strings.xml`;
  if (existsSync(SX)) { const x = await readFile(SX, 'utf8'), y = x.replace(/(<string name="(app_name|title_activity_main)">)[^<]*(<\/string>)/g, '$1Locked In$3'); if (y !== x) await writeFile(SX, y); }
  console.log('Icons and launch screen copied from native/res.');
}

// The workout notification (native/android/*.java): copied into the app, registered in MainActivity, declared in the manifest.
const PKG = 'android/app/src/main/java/io/github/hassanabdelshafy21/lockin90';
if (existsSync(PKG)) {
  for (const f of ['WorkoutService.java', 'WorkoutActionReceiver.java', 'WorkoutNotifPlugin.java']) await cp(`native/android/${f}`, `${PKG}/${f}`);
  const MA = `${PKG}/MainActivity.java`;
  let a = await readFile(MA, 'utf8');
  if (!a.includes('WorkoutNotifPlugin')) {
    a = a.replace(/public class MainActivity extends BridgeActivity \{\s*\}/, `public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(WorkoutNotifPlugin.class);
        super.onCreate(savedInstanceState);
    }
}`);
    await writeFile(MA, a);
  }
  let m = await readFile(MAN, 'utf8'); const was = m;
  const perms = ['android.permission.POST_NOTIFICATIONS', 'android.permission.VIBRATE', 'android.permission.FOREGROUND_SERVICE', 'android.permission.FOREGROUND_SERVICE_SPECIAL_USE'];
  const add = perms.filter(p => !m.includes(`"${p}"`)).map(p => `    <uses-permission android:name="${p}" />\n`).join('');
  if (add) m = m.replace(/<\/manifest>/, `${add}</manifest>`);
  if (!m.includes('.WorkoutService')) m = m.replace(/<\/application>/, `    <service android:name=".WorkoutService" android:exported="false" android:foregroundServiceType="specialUse">
            <property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" android:value="Rest timer and current set shown in a notification during a gym workout" />
        </service>
        <receiver android:name=".WorkoutActionReceiver" android:exported="false" />
    </application>`);
  if (m !== was) await writeFile(MAN, m);
  console.log('Workout notification wired in.');
}

if (!existsSync('android/app/google-services.json'))
  console.log('\nStill needed: download google-services.json from Firebase (Project settings > Your apps > Android app)\nand put it in android/app/. It is git-ignored.');
