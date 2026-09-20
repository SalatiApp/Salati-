package com.salati.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.util.Log;

/**
 * BroadcastReceiver triggered by Android AlarmManager at the exact prayer time.
 * Wakes up the device and triggers native Adhan audio playback via AdhanAudioPlayer.
 */
public class AdhanAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AdhanAlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Exact alarm received for Adhan!");

        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Salati:AdhanAlarmReceiverWakeLock");
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire(15 * 1000L); // 15 seconds to start media playback
        }

        try {
            String prayerName = intent.getStringExtra("prayerName");
            if (prayerName == null || prayerName.trim().isEmpty()) {
                prayerName = "الصلاة";
            }
            String adhanType = intent.getStringExtra("adhanType");
            if (adhanType == null || adhanType.trim().isEmpty()) {
                adhanType = "full";
            }

            Log.d(TAG, "Triggering native Adhan playback for: " + prayerName + " (type=" + adhanType + ")");
            AdhanAudioPlayer.getInstance().play(context, prayerName, adhanType);
        } catch (Exception e) {
            Log.e(TAG, "Error handling Adhan alarm broadcast", e);
        } finally {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        }
    }
}
