package kr.zipand.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.SystemClock;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 화면이 꺼지거나 다른 앱으로 넘어가도 이어지는 녹음.
 * 녹음은 앱 프로세스의 MediaRecorder가 하고, RecordingService(포그라운드 서비스)가 프로세스를 살려 둔다.
 * 결과 파일은 캐시 폴더에 m4a(AAC 64kbps, 모노)로 저장되며 웹에서 업로드 후 discard로 지운다.
 */
@CapacitorPlugin(
    name = "ZipandRecorder",
    permissions = {
        @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO }),
        @Permission(alias = "notifications", strings = { "android.permission.POST_NOTIFICATIONS" })
    }
)
public class RecorderPlugin extends Plugin {

    private static final Object lock = new Object();
    private static MediaRecorder recorder;
    private static File outputFile;
    private static long startedElapsed;
    private static long startedAtEpoch;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void load() {
        executor.execute(() -> RecordingService.ensureChannel(getContext()));
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (recorder != null) {
            call.reject("이미 녹음 중이에요.", "ALREADY_RECORDING");
            return;
        }
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            String[] aliases = Build.VERSION.SDK_INT >= 33 ? new String[] { "microphone", "notifications" } : new String[] { "microphone" };
            requestPermissionForAliases(aliases, call, "permissionCallback");
            return;
        }
        executor.execute(() -> begin(call));
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        // 권한 콜백은 메인 스레드에서 오므로 녹음 시작은 백그라운드로 넘긴다
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            executor.execute(() -> begin(call));
        } else {
            call.reject("마이크 권한이 필요해요. 설정 > 앱 > 집앤에서 마이크를 허용해 주세요.", "PERMISSION_DENIED");
        }
    }

    private void begin(PluginCall call) {
        synchronized (lock) {
            beginLocked(call);
        }
    }

    private void beginLocked(PluginCall call) {
        if (recorder != null) {
            call.reject("이미 녹음 중이에요.", "ALREADY_RECORDING");
            return;
        }
        Context context = getContext();
        RecordingService.ensureChannel(context);
        File dir = new File(context.getCacheDir(), "recordings");
        if (!dir.exists() && !dir.mkdirs()) {
            call.reject("녹음 파일을 만들 수 없어요.");
            return;
        }
        File file = new File(dir, "rec-" + System.currentTimeMillis() + ".m4a");
        MediaRecorder r = Build.VERSION.SDK_INT >= 31 ? new MediaRecorder(context) : new MediaRecorder();
        try {
            r.setAudioSource(MediaRecorder.AudioSource.MIC);
            r.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            r.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            r.setAudioChannels(1);
            r.setAudioSamplingRate(44100);
            r.setAudioEncodingBitRate(64000);
            r.setOutputFile(file.getAbsolutePath());
            r.prepare();
            r.start();
        } catch (Exception e) {
            r.release();
            file.delete();
            call.reject("녹음을 시작하지 못했어요. 다른 앱이 마이크를 사용 중인지 확인해 주세요.", e);
            return;
        }
        recorder = r;
        outputFile = file;
        startedElapsed = SystemClock.elapsedRealtime();
        startedAtEpoch = System.currentTimeMillis();
        ContextCompat.startForegroundService(context, new Intent(context, RecordingService.class));

        JSObject ret = new JSObject();
        ret.put("startedAt", startedAtEpoch);
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        synchronized (lock) {
            stopLocked(call);
        }
    }

    private void stopLocked(PluginCall call) {
        if (recorder == null) {
            call.reject("녹음 중이 아니에요.", "NOT_RECORDING");
            return;
        }
        long durationMs = SystemClock.elapsedRealtime() - startedElapsed;
        File file = outputFile;
        boolean ok = true;
        try {
            recorder.stop();
        } catch (RuntimeException e) {
            // 시작 직후 멈추면 유효한 데이터가 없어 stop()이 실패한다
            ok = false;
        }
        recorder.release();
        recorder = null;
        outputFile = null;
        getContext().stopService(new Intent(getContext(), RecordingService.class));

        if (!ok || file == null || !file.exists()) {
            if (file != null) file.delete();
            call.reject("녹음이 너무 짧아요. 다시 녹음해 주세요.", "TOO_SHORT");
            return;
        }
        JSObject ret = new JSObject();
        ret.put("path", file.getAbsolutePath());
        ret.put("name", file.getName());
        ret.put("mimeType", "audio/mp4");
        ret.put("size", file.length());
        ret.put("durationMs", durationMs);
        call.resolve(ret);
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("recording", recorder != null);
        if (recorder != null) ret.put("startedAt", startedAtEpoch);
        call.resolve(ret);
    }

    /** 업로드가 끝난 녹음 파일 삭제 (캐시 녹음 폴더 안의 파일만) */
    @PluginMethod
    public void discard(PluginCall call) {
        String path = call.getString("path");
        File dir = new File(getContext().getCacheDir(), "recordings");
        if (path != null) {
            File file = new File(path);
            if (dir.getAbsolutePath().equals(file.getParent())) file.delete();
        }
        call.resolve();
    }
}
