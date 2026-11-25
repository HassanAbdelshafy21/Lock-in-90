package io.github.hassanabdelshafy21.lockin90;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * The notification's buttons. Updates the notification straight away (rest starts the moment you tap
 * "Set done", even if the app is paused), then hands the tap to the app, which logs the set and sends
 * back the exact next set and rest. If the app isn't running, the tap waits until it is.
 */
public class WorkoutActionReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent intent) {
        String a = intent.getAction(); if (a == null || !a.startsWith("lockin.wo.")) return;
        String id = a.substring("lockin.wo.".length());
        long now = System.currentTimeMillis();
        switch (id) {
            case "done":
                if (WorkoutService.restSec > 0) { WorkoutService.mode = "rest"; WorkoutService.endAt = now + WorkoutService.restSec * 1000L; WorkoutService.title = "Rest"; WorkoutService.body = "Set logged"; }
                else { WorkoutService.title = "Set logged"; WorkoutService.body = "Next set coming up"; }
                break;
            case "add30":
                if ("rest".equals(WorkoutService.mode)) WorkoutService.endAt += 30000;
                else { WorkoutService.mode = "rest"; WorkoutService.endAt = now + 30000; WorkoutService.title = "Rest"; }
                break;
            case "skip":
                WorkoutService.mode = "over"; WorkoutService.alertedFor = WorkoutService.endAt; WorkoutService.title = "Go";
                break;
            default: return;
        }
        WorkoutService.apply(c);
        WorkoutNotifPlugin.emit(c, id, now);
    }
}
