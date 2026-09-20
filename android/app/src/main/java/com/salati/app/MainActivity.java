package com.salati.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public static final String ADHAN_CHANNEL_ID = "salati_adhan_channel";
    public static final String AZKAR_CHANNEL_ID = "salati_azkar_channel";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createAdhanNotificationChannel();
        createAzkarNotificationChannel();
    }

    @Override
    public void onPause() {
        super.onPause();
        // When the notification shade or quick settings are pulled down,
        // Android pauses the Activity, which in turn pauses the WebView and its audio.
        // We ensure the WebView timers and media playback resume immediately so Adhan audio continues.
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            webView.post(() -> {
                try {
                    webView.resumeTimers();
                    webView.onResume();
                } catch (Exception ignored) {
                }
            });
        }
    }

    private void createAdhanNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                NotificationChannel channel = new NotificationChannel(
                    ADHAN_CHANNEL_ID,
                    "أذان الصلاة",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("تنبيهات مواقيت الصلاة مع صوت الأذان");
                channel.enableVibration(true);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

                Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/raw/adhan");
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build();

                channel.setSound(soundUri, audioAttributes);
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void createAzkarNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                NotificationChannel channel = new NotificationChannel(
                    AZKAR_CHANNEL_ID,
                    "أذكار المسلم (الصباح والمساء)",
                    NotificationManager.IMPORTANCE_DEFAULT
                );
                channel.setDescription("تذكير يومي بمواعيد أذكار الصباح والمساء");
                channel.enableVibration(true);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                manager.createNotificationChannel(channel);
            }
        }
    }
}

