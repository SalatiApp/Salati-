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
 * 1. Playback continues uninterrupted when phone is moved, tilted, or shaken.
 * 2. Playback is NOT cancelled by Android motion gestures, shake-to-silence, or AudioFocus changes.
 * 3. Playback continues when phone is unlocked (e.g. with fingerprint) or screen turns on.
 * 4. Playback continues when Notification Shade / Quick Settings are pulled down.
 * 5. Exactly ONE Adhan audio playback at any time (no duplicate playback, no restarting from 0:00).
 * 6. Playback stops ONLY when the user explicitly taps "إيقاف الأذان" in the notification, or upon natural completion.
 */
public class AdhanAudioPlayer {
    private static final String TAG = "AdhanAudioPlayer";
    public static final String ACTION_STOP_ADHAN = "com.salati.app.ACTION_STOP_ADHAN";
    public static final String ADHAN_ACTIVE_CHANNEL_ID = "salati_adhan_active_channel_v2";
    private static final int NOTIFICATION_ID = 8888;
    private static final long COOLDOWN_MS = 180 * 1000L; // 3 minutes cooldown for the same prayer

    private static AdhanAudioPlayer instance;

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private volatile boolean isPlaying = false;
    private volatile boolean isPreparing = false;
    private long lastPlayStartTimeMs = 0;
    private String currentPrayerName = "";

    private AdhanAudioPlayer() {}

    public static synchronized AdhanAudioPlayer getInstance() {
        if (instance == null) {
            instance = new AdhanAudioPlayer();
        }
        return instance;
    }

    public synchronized boolean isAdhanPlaying() {
        if (isPreparing || isPlaying) {
            return true;
        }
        try {
            return mediaPlayer != null && mediaPlayer.isPlaying();
        } catch (Exception ignored) {
            return false;
        }
    }

    public synchronized String getCurrentPrayerName() {
        return currentPrayerName;
    }

    public synchronized void play(Context context, String prayerName, String adhanType) {
        play(context, prayerName, adhanType, false);
    }

    public synchronized void play(Context context, String prayerName, String adhanType, boolean isTest) {
        if ("silent".equalsIgnoreCase(adhanType)) {
            Log.d(TAG, "Adhan type is silent, skipping audio playback.");
            return;
        }

        long now = System.currentTimeMillis();
        String effectivePrayerName = (prayerName != null && !prayerName.trim().isEmpty()) ? prayerName : "الصلاة";

        // Automatic prayer adhan duplicate protection (kept strictly unchanged for real scheduled adhans)
        if (!isTest) {
            // If already playing or preparing, do NOT restart from the beginning. Keep the current playback running.
            if (isAdhanPlaying()) {
                Log.d(TAG, "Adhan is already actively playing for " + currentPrayerName + ", ignoring redundant play call.");
                return;
            }

            // Prevent repeat triggers for the same prayer within cooldown window
            if (now - lastPlayStartTimeMs < COOLDOWN_MS && effectivePrayerName.equals(currentPrayerName)) {
                Log.d(TAG, "Adhan for " + effectivePrayerName + " was started within the last 3 minutes, ignoring repeat call.");
                return;
            }
        }

        // For manual test playback (or new prayer), stop any existing playback completely and start fresh from 0:00
        stopPlaybackInternal(context);

        try {
            isPreparing = true;
            if (!isTest) {
                lastPlayStartTimeMs = now;
            }
            currentPrayerName = effectivePrayerName;

            // 1. Acquire WakeLock to keep CPU awake while Adhan plays
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Salati:AdhanAudioWakeLock");
                wakeLock.setReferenceCounted(false);
                // Safety limit of 6 minutes (Adhan length is ~3-4 minutes)
                wakeLock.acquire(6 * 60 * 1000L);
            }

            // 2. Setup AudioFocus with USAGE_ALARM
            audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                    .setAudioAttributes(audioAttributes)
                    .setAcceptsDelayedFocusGain(true)
                    .setWillPauseWhenDucked(false)
                    .setOnAudioFocusChangeListener(focusChange -> {
                        // Under user requirements: Phone movement, shake, or transient focus changes
                        // must NOT cause pause, resume, or restart of Adhan.
                        // Playback continues steadily until completion or manual stop from notification.
                        Log.d(TAG, "AudioFocus change received: " + focusChange + " - preserving continuous playback.");
                    })
                    .build();

                if (audioManager != null) {
                    audioManager.requestAudioFocus(audioFocusRequest);
                }
            } else if (audioManager != null) {
                audioManager.requestAudioFocus(
                    focusChange -> Log.d(TAG, "AudioFocus change received (pre-O): " + focusChange),
                    AudioManager.STREAM_ALARM,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
                );
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
                    synchronized (AdhanAudioPlayer.this) {
                        isPreparing = false;
                        isPlaying = true;
                    }
                    mp.setVolume(1.0f, 1.0f);
                    mp.start();
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
        isPreparing = false;
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
