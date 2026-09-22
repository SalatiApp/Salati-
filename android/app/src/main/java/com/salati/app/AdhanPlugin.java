package com.salati.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

/**
 * Capacitor Plugin exposing native Adhan playback and exact alarm scheduling to JavaScript.
 */
@CapacitorPlugin(name = "AdhanNative")
public class AdhanPlugin extends Plugin {
    private static final String TAG = "AdhanPlugin";

    @PluginMethod
    public void playAdhan(PluginCall call) {
        String prayerName = call.getString("prayerName", "الصلاة");
        String adhanType = call.getString("adhanType", "full");
        boolean isTest = Boolean.TRUE.equals(call.getBoolean("isTest"));
        Context context = getContext();

        AdhanAudioPlayer.getInstance().play(context, prayerName, adhanType, isTest);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopAdhan(PluginCall call) {
        Context context = getContext();
        AdhanAudioPlayer.getInstance().stop(context);

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void isAdhanPlaying(PluginCall call) {
        boolean playing = AdhanAudioPlayer.getInstance().isAdhanPlaying();
        String prayerName = AdhanAudioPlayer.getInstance().getCurrentPrayerName();

        JSObject ret = new JSObject();
        ret.put("isPlaying", playing);
        ret.put("prayerName", prayerName != null ? prayerName : "");
        call.resolve(ret);
    }

    @PluginMethod
    public void schedulePrayerAlarms(PluginCall call) {
        JSArray prayersArray = call.getArray("prayers");
        if (prayersArray == null || prayersArray.length() == 0) {
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("count", 0);
            call.resolve(ret);
            return;
        }

        Context context = getContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            call.reject("AlarmManager not available on this device");
            return;
        }

        int scheduledCount = 0;
        long now = System.currentTimeMillis();

        for (int i = 0; i < prayersArray.length(); i++) {
            try {
                JSONObject prayer = prayersArray.getJSONObject(i);
                long triggerTime = prayer.optLong("time", 0);
                String prayerName = prayer.optString("nameAr", "الصلاة");
                String adhanType = prayer.optString("adhanType", "full");
                int alarmId = prayer.optInt("id", 2000 + i);

                if (triggerTime > now) {
                    Intent intent = new Intent(context, AdhanAlarmReceiver.class);
                    intent.putExtra("prayerName", prayerName);
                    intent.putExtra("adhanType", adhanType);
                    intent.putExtra("alarmId", alarmId);

                    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        flags |= PendingIntent.FLAG_IMMUTABLE;
                    }

                    PendingIntent pendingIntent = PendingIntent.getBroadcast(
                        context,
                        alarmId,
                        intent,
                        flags
                    );

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        alarmManager.setExactAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP,
                            triggerTime,
                            pendingIntent
                        );
                    } else {
                        alarmManager.setExact(
                            AlarmManager.RTC_WAKEUP,
                            triggerTime,
                            pendingIntent
                        );
                    }
                    scheduledCount++;
                }
            } catch (Exception e) {
                Log.w(TAG, "Failed to schedule alarm for prayer at index " + i, e);
            }
        }

        Log.d(TAG, "Successfully scheduled " + scheduledCount + " native exact Adhan alarms via AlarmManager.");
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("count", scheduledCount);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelAllAlarms(PluginCall call) {
        Context context = getContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            for (int id = 2000; id < 2500; id++) {
                try {
                    Intent intent = new Intent(context, AdhanAlarmReceiver.class);
                    int flags = PendingIntent.FLAG_NO_CREATE;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        flags |= PendingIntent.FLAG_IMMUTABLE;
                    }
                    PendingIntent pi = PendingIntent.getBroadcast(context, id, intent, flags);
                    if (pi != null) {
                        alarmManager.cancel(pi);
                        pi.cancel();
                    }
                } catch (Exception ignored) {}
            }
        }

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}
