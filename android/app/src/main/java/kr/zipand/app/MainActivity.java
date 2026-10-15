package kr.zipand.app;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RecorderPlugin.class);
        super.onCreate(savedInstanceState);
        // 안드로이드 12+ 늘어나는 오버스크롤 효과가 하단 탭까지 늘리지 않게 끈다
        getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
    }
}
