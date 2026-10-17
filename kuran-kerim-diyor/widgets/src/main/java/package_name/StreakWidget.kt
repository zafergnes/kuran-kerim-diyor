package com.kurankerimdiyor

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import org.json.JSONObject
import kotlin.concurrent.thread

/**
 * Compact 2x2 Android Widget focused on Reading Streak & Daily Verse
 */
class StreakWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val pendingResult = goAsync()
        thread {
            try {
                for (appWidgetId in appWidgetIds) {
                    updateAppWidget(context, appWidgetManager, appWidgetId)
                }
            } finally {
                pendingResult.finish()
            }
        }
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        try {
            val prefs = context.getSharedPreferences(context.packageName + ".widgetdata", Context.MODE_PRIVATE)
            val cachedJson = prefs.getString("widgetdata", null)

            val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
            val cal = Calendar.getInstance()
            cal.add(Calendar.DAY_OF_YEAR, -1)
            val yesterday = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time)

            var streakCount = 1
            var todayCompleted = false
            var reference = "İnşirah 94:5"
            var surahNumber = 94
            var startAyah = 5
            var statusLabel = "Serini Koru"
            var cachedDate = ""
            var apiLang = "tr"

            if (!cachedJson.isNullOrEmpty()) {
                try {
                    val payload = JSONObject(cachedJson)
                    cachedDate = payload.optString("cachedDate", "")
                    val lastActiveDate = payload.optString("lastActiveDate", "")
                    val savedStreak = payload.optInt("streak", 1)

                    val optRef = payload.optString("reference", "")
                    if (optRef.isNotEmpty()) {
                        reference = optRef
                    }
                    surahNumber = payload.optInt("surahNumber", 94)
                    startAyah = payload.optInt("startAyah", 5)

                    val lang = payload.optString("language", Locale.getDefault().language)
                    val supportedLangs = listOf("tr", "en", "de", "fr", "es", "ar")
                    apiLang = if (supportedLangs.contains(lang)) lang else "tr"

                    if (lastActiveDate.isNotEmpty()) {
                        if (lastActiveDate == today) {
                            streakCount = savedStreak
                            todayCompleted = true
                            statusLabel = "Bugün Okundu ✓"
                        } else if (lastActiveDate == yesterday) {
                            streakCount = savedStreak
                            todayCompleted = false
                            statusLabel = "Serini Koru"
                        } else {
                            streakCount = 0
                            todayCompleted = false
                            statusLabel = "Bugün Oku"
                        }
                    } else {
                        streakCount = savedStreak
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            // Fresh verse info check if date rolled over
            if (cachedDate != today) {
                try {
                    val conn = URL("https://api.kurannediyor.com.tr/api/daily-context?lang=$apiLang").openConnection()
                    conn.connectTimeout = 4000
                    conn.readTimeout = 4000
                    val jsonText = conn.getInputStream().bufferedReader().use { it.readText() }
                    val data = JSONObject(jsonText)
                    val freshRef = data.optString("reference", "")
                    if (freshRef.isNotEmpty()) {
                        reference = freshRef
                        surahNumber = data.optInt("surahNumber", 94)
                        startAyah = data.optInt("startAyah", 5)
                    }
                } catch (_: Exception) {}
            }

            val views = RemoteViews(context.packageName, R.layout.streak_widget)
            views.setTextViewText(R.id.streak_count, streakCount.toString())
            views.setTextViewText(R.id.streak_verse_ref, reference)
            views.setTextViewText(R.id.streak_status, statusLabel)
            
            if (todayCompleted) {
                views.setTextColor(R.id.streak_status, android.graphics.Color.parseColor("#2E7D32"))
            } else {
                views.setTextColor(R.id.streak_status, android.graphics.Color.parseColor("#9E7D47"))
            }

            // Click opens daily verse in app
            val intent = Intent(Intent.ACTION_VIEW).apply {
                this.data = Uri.parse("kuran-kerim-diyor://ayet?id=$surahNumber:$startAyah")
                setPackage(context.packageName)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }

            val pendingIntent = PendingIntent.getActivity(
                context, 
                appWidgetId, 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            views.setOnClickPendingIntent(R.id.streak_widget_container, pendingIntent)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
