package io.github.hassanabdelshafy21.lockin90.health

import android.app.Activity
import android.os.Bundle
import android.webkit.WebView

/** Shows the bundled privacy page (www/privacy.html). Health Connect requires this screen. */
class PrivacyActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val web = WebView(this)
        web.settings.javaScriptEnabled = false
        // Capacitor copies the web folder to assets/public; asset URLs are readable without file access.
        web.loadUrl("file:///android_asset/public/privacy.html")
        setContentView(web)
    }
}
