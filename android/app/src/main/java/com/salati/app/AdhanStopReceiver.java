package com.salati.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * BroadcastReceiver for handling the "إيقاف الأذان" (Stop Adhan) action button
 * from the ongoing notification.
 */
public class AdhanStopReceiver extends BroadcastReceiver {
    private static final String TAG = "AdhanStopReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Stop Adhan action received from notification.");
        AdhanAudioPlayer.getInstance().stop(context);
    }
}
