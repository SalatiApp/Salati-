package com.salati.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;

/**
 * Singleton native Android audio player for Adhan.
 * Uses MediaPlayer with USAGE_ALARM to ensure:
 * 1. Playback continues when phone is unlocked (e.g. with fingerprint).
 * 2. Playback continues when Notification Shade / Quick Settings are pulled down.
 * 3. Playback is NOT cancelled by Android's NotificationManager upon user interaction.
 * 4. Ignores transient audio focus loss (such as fingerprint click or haptic sounds).
 * 5. Exactly one Adhan audio playback at any time (no duplicate playback).
 */
public class AdhanAudioPlayer {
    private static final String TAG = "AdhanAudioPlayer";
    public static final String ACTION_STOP_ADHAN = "com.salati.app.ACTION_STOP_ADHAN";
    public static final String ADHAN_ACTIVE_CHANNEL_ID = "salati_adhan_active_channel_v2";
    private static final int NOTIFICATION_ID = 8888;

    private static AdhanAudioPlayer instance;

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean isPlaying = false;
    private String currentPrayerName = "";

    private AdhanAudioPlayer() {}

    public static synchronized AdhanAudioPlayer getInstance() {
        if (instance == null) {
            instance = new AdhanAudioPlayer();
        }
        return instance;
    }

    public synchronized boolean isAdhanPlaying() {
        return isPlaying && mediaPlayer != null && mediaPlayer.isPlaying();
    }

    public synchronized String getCurrentPrayerName() {
        return currentPrayerName;
    }

    public synchronized void play(Context context, String prayerName, String adhanType) {
        if ("silent".equalsIgnoreCase(adhanType)) {
            Log.d(TAG, "Adhan type is silent, skipping audio playback.");
            return;
        }

        // If already playing, do NOT restart from the beginning. Keep the current playback running.
        if (isAdhanPlaying()) {
            Log.d(TAG, "Adhan is already actively playing for " + currentPrayerName + ", ignoring redundant play call.");
            return;
        }

        stopPlaybackInternal(context);

        try {
            currentPrayerName = (prayerName != null && !prayerName.trim().isEmpty()) ? prayerName : "الصلاة";

            // 1. Acquire WakeLock to keep CPU awake while Adhan plays
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Salati:AdhanAudioWakeLock");
                wakeLock.setReferenceCounted(false);
                // Safety limit of 5 minutes
                wakeLock.acquire(5 * 60 * 1000L);
            }

            // 2. Setup AudioFocus with USAGE_ALARM
            audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
                .build();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(audioAttributes)
                    .setAcceptsDelayedFocusGain(true)
                    .setOnAudioFocusChangeListener(focusChange -> {
                        // CRITICAL: Transient focus changes (like fingerprint unlock tone, haptics,
                        // or notification chimes) MUST NOT stop or pause the Adhan!
                        // We only stop on permanent AUDIOFOCUS_LOSS (e.g. an active incoming telephone call).
                        if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
                            Log.d(TAG, "Permanent AudioFocus loss detected, stopping Adhan.");
                            stop(context);
                        } else {
                            Log.d(TAG, "Transient AudioFocus event (" + focusChange + ") ignored to prevent Adhan cutoff.");
                        }
                    })
                    .build();

                if (audioManager != null) {
                    audioManager.requestAudioFocus(audioFocusRequest);
                }
            } else if (audioManager != null) {
                audioManager.requestAudioFocus(focusChange -> {
                    if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
                        stop(context);
                    }
                }, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN);
            }

            // 3. Initialize MediaPlayer with local raw resource
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(audioAttributes);
            mediaPlayer.setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK);

            AssetFileDescriptor afd = context.getResources().openRawResourceFd(R.raw.adhan);
            if (afd != null) {
                mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                afd.close();
            } else {
                mediaPlayer = MediaPlayer.create(context, R.raw.adhan);
            }

            mediaPlayer.setOnPreparedListener(mp -> {
                try {
                    mp.start();
                    synchronized (AdhanAudioPlayer.this) {
                        isPlaying = true;
                    }
                    Log.d(TAG, "Native Adhan playback started successfully for: " + currentPrayerName);
                    showOngoingAdhanNotification(context, currentPrayerName);
                } catch (Exception e) {
                    Log.e(TAG, "Error starting MediaPlayer in onPrepared", e);
                    stop(context);
                }
            });

            mediaPlayer.setOnCompletionListener(mp -> {
                Log.d(TAG, "Adhan playback completed naturally to the end.");
                stop(context);
            });

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error occurred: what=" + what + ", extra=" + extra);
                stop(context);
                return true;
            });

            mediaPlayer.prepareAsync();

        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize and play native Adhan", e);
            stop(context);
        }
    }

    public synchronized void stop(Context context) {
        stopPlaybackInternal(context);
        cancelOngoingAdhanNotification(context);
    }

    private synchronized void stopPlaybackInternal(Context context) {
        isPlaying = false;
        currentPrayerName = "";

        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.reset();
                mediaPlayer.release();
            } catch (Exception e) {
                Log.w(TAG, "Exception while stopping and releasing MediaPlayer", e);
            }
            mediaPlayer = null;
        }

        if (wakeLock != null) {
            try {
                if (wakeLock.isHeld()) {
                    wakeLock.release();
                }
            } catch (Exception ignored) {}
            wakeLock = null;
        }

        if (audioManager != null) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                    audioManager.abandonAudioFocusRequest(audioFocusRequest);
                    audioFocusRequest = null;
                }
            } catch (Exception ignored) {}
        }
    }

    private void showOngoingAdhanNotification(Context context, String prayerName) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    ADHAN_ACTIVE_CHANNEL_ID,
                    "تشغيل الأذان الحالي",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("إشعار نشط يتيح إيقاف الأذان أثناء تشغيله");
                channel.setSound(null, null); // Sound is played by MediaPlayer
                channel.enableVibration(false);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                nm.createNotificationChannel(channel);
            }

            // Intent to bring app to foreground without restarting
            Intent openIntent = new Intent(context, MainActivity.class);
            openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent openPendingIntent = PendingIntent.getActivity(context, 100, openIntent, pendingFlags);

            // Intent for the "Stop Adhan" button
            Intent stopIntent = new Intent(context, AdhanStopReceiver.class);
            stopIntent.setAction(ACTION_STOP_ADHAN);
            PendingIntent stopPendingIntent = PendingIntent.getBroadcast(context, 101, stopIntent, pendingFlags);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, ADHAN_ACTIVE_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("حان الآن موعد أذان " + prayerName)
                .setContentText("الله أكبر، الله أكبر — صوت الأذان يعمل الآن")
                .setSubText("صلاتي")
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(openPendingIntent)
                .addAction(android.R.drawable.ic_media_pause, "إيقاف الأذان", stopPendingIntent)
                .setAutoCancel(false);

            nm.notify(NOTIFICATION_ID, builder.build());
        } catch (Exception e) {
            Log.w(TAG, "Error displaying ongoing Adhan notification", e);
        }
    }

    private void cancelOngoingAdhanNotification(Context context) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(NOTIFICATION_ID);
            }
        } catch (Exception ignored) {}
    }
}
