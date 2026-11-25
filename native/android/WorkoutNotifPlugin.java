package io.github.hassanabdelshafy21.lockin90;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/** JS bridge for the workout notification: show(state), clear(), ask() for permission, and "action" events. */
@CapacitorPlugin(name = "WorkoutNotif", permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications") })
public class WorkoutNotifPlugin extends Plugin {
    static WorkoutNotifPlugin inst;
    private static final String PREFS = "lockin_wo", KEY = "queue";

    @Override public void load() { inst = this; WorkoutService.appVisible = true; remindersChannel(getContext()); drain(); }
    @Override protected void handleOnResume() { super.handleOnResume(); WorkoutService.appVisible = true; drain(); }
    @Override protected void handleOnPause() { super.handleOnPause(); WorkoutService.appVisible = false; }
    @Override protected void handleOnDestroy() { if (inst == this) inst = null; super.handleOnDestroy(); }

    /** A button was tapped: tell the app now, or keep it until the app runs again. */
    static void emit(Context c, String id, long at) {
        if (inst != null && inst.getBridge() != null) { inst.send(id, at); return; }
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        p.edit().putString(KEY, p.getString(KEY, "") + id + ":" + at + ";").apply();
    }

    private void send(String id, long at) { JSObject o = new JSObject(); o.put("id", id); o.put("at", at); notifyListeners("action", o, true); }

    private void drain() {
        SharedPreferences p = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String q = p.getString(KEY, ""); if (q.isEmpty()) return;
        p.edit().remove(KEY).apply();
        for (String it : q.split(";")) { String[] kv = it.split(":"); if (kv.length == 2) try { send(kv[0], Long.parseLong(kv[1])); } catch (NumberFormatException ignored) { } }
    }

    @PluginMethod public void show(PluginCall call) {
        JSObject d = call.getData();
        WorkoutService.mode = d.optString("mode", "work");
        WorkoutService.title = d.optString("title", "");
        WorkoutService.body = d.optString("body", "");
        if (d.has("endAt")) WorkoutService.endAt = d.optLong("endAt", 0);
        WorkoutService.restSec = d.optInt("restSec", 0);
        WorkoutService.apply(getContext());
        call.resolve();
    }

    @PluginMethod public void clear(PluginCall call) { WorkoutService.stop(getContext()); call.resolve(); }

    // status and navigation bar icons: dark on the light theme, light on the dark one (the app draws edge to edge)
    @PluginMethod public void bars(PluginCall call) {
        final boolean light = Boolean.TRUE.equals(call.getBoolean("light", false));
        getActivity().runOnUiThread(() -> {
            android.view.Window w = getActivity().getWindow();
            androidx.core.view.WindowInsetsControllerCompat c = androidx.core.view.WindowCompat.getInsetsController(w, w.getDecorView());
            c.setAppearanceLightStatusBars(light);
            c.setAppearanceLightNavigationBars(light);
            call.resolve();
        });
    }

    /** Reminders (sent by the tick job through Firebase) use the "reminders" channel; this creates it. */
    static void remindersChannel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        android.app.NotificationChannel ch = new android.app.NotificationChannel("reminders", "Reminders", android.app.NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Water, meals, streak and coach messages");
        c.getSystemService(android.app.NotificationManager.class).createNotificationChannel(ch);
    }

    /** "Send a test": a local notification that looks like a real reminder. */
    @PluginMethod public void ping(PluginCall call) {
        Context c = getContext(); remindersChannel(c);
        android.content.Intent open = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        android.app.PendingIntent tap = open == null ? null : android.app.PendingIntent.getActivity(c, 5, open, android.app.PendingIntent.FLAG_IMMUTABLE | android.app.PendingIntent.FLAG_UPDATE_CURRENT);
        androidx.core.app.NotificationCompat.Builder b = new androidx.core.app.NotificationCompat.Builder(c, "reminders")
            .setSmallIcon(R.drawable.ic_stat_notify).setColor(0xFF283A58)
            .setContentTitle(call.getString("title", "Locked In")).setContentText(call.getString("body", ""))
            .setAutoCancel(true).setContentIntent(tap);
        try { androidx.core.app.NotificationManagerCompat.from(c).notify(9072, b.build()); } catch (SecurityException e) { call.reject("not allowed"); return; }
        call.resolve();
    }

    @PluginMethod public void ask(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) { JSObject r = new JSObject(); r.put("granted", true); call.resolve(r); return; }
        requestPermissionForAlias("notifications", call, "askDone");
    }

    @PermissionCallback private void askDone(PluginCall call) {
        JSObject r = new JSObject(); r.put("granted", getPermissionState("notifications") == PermissionState.GRANTED); call.resolve(r);
    }
}
