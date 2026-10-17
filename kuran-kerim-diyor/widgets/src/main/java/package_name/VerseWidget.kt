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

class VerseWidget : AppWidgetProvider() {
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

            var text = "Şüphesiz her zorlukla beraber bir kolaylık vardır."
            var reference = "İnşirah 94:5"
            var surahNumber = 94
            var startAyah = 5
            var title = "GÜNÜN AYETİ"
            var streakBadge = ""
            var todayStatus = ""
            var streakCount = 0
            var todayCompleted = false
            var cachedDate = ""
            var apiLang = "tr"

            if (!cachedJson.isNullOrEmpty()) {
                try {
                    val payload = JSONObject(cachedJson)
                    cachedDate = payload.optString("cachedDate", "")
                    val lastActiveDate = payload.optString("lastActiveDate", "")
                    val savedStreak = payload.optInt("streak", 0)

                    val optText = payload.optString("text", "")
                    if (optText.isNotEmpty()) {
                        text = optText
                    }
                    val optRef = payload.optString("reference", "")
                    if (optRef.isNotEmpty()) {
                        reference = optRef
                    }
                    surahNumber = payload.optInt("surahNumber", 94)
                    startAyah = payload.optInt("startAyah", 5)

                    val lang = payload.optString("language", Locale.getDefault().language)
                    val supportedLangs = listOf("tr", "en", "de", "fr", "es", "ar")
                    apiLang = if (supportedLangs.contains(lang)) lang else "tr"

                    val labels = payload.optJSONObject("labels")
                    if (labels != null) {
                        title = labels.optString("title", title)
                        streakBadge = labels.optString("streakBadge", "")
                        todayStatus = labels.optString("todayStatus", "")
                    }

                    // Calculate streak vitality based on lastActiveDate (never wipe streak prematurely!)
                    if (lastActiveDate.isNotEmpty()) {
                        if (lastActiveDate == today) {
                            streakCount = savedStreak
                            todayCompleted = true
                            if (todayStatus.isEmpty()) todayStatus = "Bugün Okundu ✓"
                        } else if (lastActiveDate == yesterday) {
                            streakCount = savedStreak
                            todayCompleted = false
                            todayStatus = "Serini Koru"
                        } else {
                            streakCount = 0
                            todayCompleted = false
                            todayStatus = "Bugün Oku"
                        }
                    } else if (savedStreak > 0) {
                        streakCount = savedStreak
                    }

                    if (streakBadge.isEmpty() && streakCount > 0) {
                        val suffix = if (apiLang == "en") "Days" else if (apiLang == "ar") "يوم" else "Gün"
                        streakBadge = "🔥 $streakCount $suffix"
                    } else if (streakCount == 0) {
                        streakBadge = ""
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            // If it's a new day, fetch the fresh verse from API while keeping the user's streak intact!
            if (cachedDate != today) {
                try {
                    val conn = URL("https://api.kurannediyor.com.tr/api/daily-context?lang=$apiLang").openConnection()
                    conn.connectTimeout = 4000
                    conn.readTimeout = 4000
                    val jsonText = conn.getInputStream().bufferedReader().use { it.readText() }
                    val data = JSONObject(jsonText)
                    
                    val freshText = data.optString("text", "")
                    val freshRef = data.optString("reference", "")
                    if (freshText.isNotEmpty()) {
                        text = freshText
                        reference = freshRef
                        surahNumber = data.optInt("surahNumber", 94)
                        startAyah = data.optInt("startAyah", 5)
                    }
                } catch (_: Exception) {
                    // Retain existing text & reference on network failure
                }
            }

            val views = RemoteViews(context.packageName, R.layout.verse_widget)
            views.setTextViewText(R.id.widget_title, title)
            views.setTextViewText(R.id.widget_streak, streakBadge)
            views.setTextViewText(R.id.widget_text, "“$text”")
            views.setTextViewText(R.id.widget_reference, reference)
            views.setTextViewText(R.id.widget_status, todayStatus)

            // Deep link Intent to the verse
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

            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
