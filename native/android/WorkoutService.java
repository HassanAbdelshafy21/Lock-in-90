package io.github.hassanabdelshafy21.lockin90;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

/**
 * The workout notification (Lock In 90). Stays up for the whole workout: the next set with a "Set done" button,
 * then a rest countdown that Android draws itself (keeps running with the screen off), then "Rest over" with a
 * vibration. A foreground service so the rest end fires on time and the app's process stays alive mid-workout.
 * State lives in static fields: the JS side sets it through WorkoutNotifPlugin.show(), the buttons through
 * WorkoutActionReceiver (which works even when the WebView is paused).
 */
public class WorkoutService extends Service {
    static final String CH = "workout";
    static final int ID = 9071;

    static String mode = "";          // work | rest | over
    static String title = "", body = "";
    static long endAt = 0;            // rest end (epoch ms)
    static int restSec = 0;           // rest after the set shown in "work" mode (lets "Set done" start it at once)
    static long alertedFor = 0;       // the endAt we already buzzed for
    static boolean appVisible = false;

    static WorkoutService inst;
    private final Handler h = new Handler(Looper.getMainLooper());
    private final Runnable over = this::restOver;

    /** Push the current state to the notification (starts the service the first time). */
    static void apply(Context c) {
        if (inst != null) { inst.refresh(); return; }
        try { ContextCompat.startForegroundService(c, new Intent(c, WorkoutService.class)); }
        catch (Exception e) { NotificationManagerCompat nm = NotificationManagerCompat.from(c); try { nm.notify(ID, build(c)); } catch (SecurityException ignored) { } }
    }

    static void stop(Context c) {
        mode = ""; endAt = 0;
        if (inst != null) { inst.h.removeCallbacks(inst.over); ServiceCompat.stopForeground(inst, ServiceCompat.STOP_FOREGROUND_REMOVE); inst.stopSelf(); }
        NotificationManagerCompat.from(c).cancel(ID);
    }

    @Override public void onCreate() {
        super.onCreate();
        inst = this;
        channel(this);
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        int type = Build.VERSION.SDK_INT >= 34 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE : 0;
        ServiceCompat.startForeground(this, ID, build(this), type);
        if (mode.isEmpty()) { stop(this); return START_NOT_STICKY; }
        refresh();
        return START_NOT_STICKY;
    }

    @Override public void onDestroy() { h.removeCallbacks(over); if (inst == this) inst = null; super.onDestroy(); }
    @Override public IBinder onBind(Intent intent) { return null; }

    void refresh() {
        h.removeCallbacks(over);
        if ("rest".equals(mode)) h.postDelayed(over, Math.max(0, endAt - System.currentTimeMillis()));
        try { NotificationManagerCompat.from(this).notify(ID, build(this)); } catch (SecurityException ignored) { }
    }

    private void restOver() {
        if (!"rest".equals(mode)) return;
        mode = "over"; title = "Rest over · Go"; // body keeps the next set the app sent with the rest
        if (alertedFor != endAt) { alertedFor = endAt; if (!appVisible) alert(); } // the open app beeps itself
        refresh();
    }

    private void alert() {
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            long[] p = { 0, 250, 120, 250, 120, 400 };
            if (v != null) { if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createWaveform(p, -1)); else v.vibrate(p, -1); }
        } catch (Exception ignored) { }
        try { Ringtone r = RingtoneManager.getRingtone(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)); if (r != null) r.play(); } catch (Exception ignored) { }
    }

    static void channel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationChannel ch = new NotificationChannel(CH, "Workout", NotificationManager.IMPORTANCE_LOW);
        ch.setDescription("Your current set and the rest countdown during a workout");
        ch.setShowBadge(false);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        c.getSystemService(NotificationManager.class).createNotificationChannel(ch);
    }

    private static PendingIntent act(Context c, String id, int code) {
        Intent i = new Intent(c, WorkoutActionReceiver.class).setAction("lockin.wo." + id);
        return PendingIntent.getBroadcast(c, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    static Notification build(Context c) {
        channel(c);
        Intent open = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (open != null) open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        PendingIntent tap = open == null ? null : PendingIntent.getActivity(c, 1, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CH)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setColor(0xFF283A58)
            .setContentTitle(title.isEmpty() ? "Lock In 90" : title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setOngoing(true).setOnlyAlertOnce(true).setSilent(true)
            .setCategory("workout")
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(tap);
        if ("rest".equals(mode)) {
            b.setUsesChronometer(true).setChronometerCountDown(true).setWhen(endAt).setShowWhen(true);
            b.addAction(0, "+30 s", act(c, "add30", 2));
            b.addAction(0, "Skip rest", act(c, "skip", 3));
        } else {
            b.setShowWhen(false);
            b.addAction(0, "✓ Set done", act(c, "done", 4));
            if ("over".equals(mode)) b.addAction(0, "+30 s", act(c, "add30", 2));
        }
        return b.build();
    }
}
