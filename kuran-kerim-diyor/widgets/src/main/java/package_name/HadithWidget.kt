package com.kurankerimdiyor

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import java.net.URL
import java.net.URLEncoder
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import org.json.JSONObject
import kotlin.concurrent.thread

/**
 * Günün Hadisi widget'ı. Uygulama her senkronda önümüzdeki günlerin hadislerini yazar;
 * böylece uygulama açılmasa da widget internetsiz olarak doğru günün hadisini gösterir.
 */
class HadithWidget : AppWidgetProvider() {
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

    private data class DailyHadith(val id: String, val text: String, val reference: String, val grade: String)

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        try {
            val prefs = context.getSharedPreferences(context.packageName + ".widgetdata", Context.MODE_PRIVATE)
            val payload = prefs.getString("widgetdata", null)?.let { runCatching { JSONObject(it) }.getOrNull() }
            val hadithData = payload?.optJSONObject("hadith")
            val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
            val language = payload?.optString("language", "tr")?.takeIf { it in SUPPORTED } ?: "tr"

            val title = hadithData?.optString("title", "")?.takeIf { it.isNotEmpty() } ?: "GÜNÜN HADİSİ"
            var hadith: DailyHadith? = null
            var latestPast: DailyHadith? = null

            val days = hadithData?.optJSONArray("days")
            if (days != null) {
                for (i in 0 until days.length()) {
                    val day = days.optJSONObject(i) ?: continue
                    val date = day.optString("date", "")
                    val entry = DailyHadith(
                        day.optString("id", ""),
                        day.optString("text", ""),
                        day.optString("reference", ""),
                        day.optString("grade", "")
                    )
                    if (entry.id.isEmpty() || entry.text.isEmpty()) continue
                    if (date == today) hadith = entry
                    if (date <= today) latestPast = entry
                }
            }

            // Uygulama uzun süre açılmadıysa günün hadisini sunucudan al; olmazsa son bilinen hadiste kal.
            if (hadith == null) {
                hadith = fetchDailyHadith(language) ?: latestPast
            }

            val gradeLabels = hadithData?.optJSONObject("gradeLabels")
            val views = RemoteViews(context.packageName, R.layout.hadith_widget)
            views.setTextViewText(R.id.hadith_widget_title, title)
            if (hadith != null) {
                views.setTextViewText(R.id.hadith_widget_text, "“${hadith.text}”")
                views.setTextViewText(R.id.hadith_widget_reference, hadith.reference)
                views.setTextViewText(
                    R.id.hadith_widget_grade,
                    gradeLabels?.optString(hadith.grade, "")?.takeIf { it.isNotEmpty() } ?: hadith.grade.replaceFirstChar { it.uppercase() }
                )
            }

            val target = if (hadith != null) "kuran-kerim-diyor://hadith?id=${Uri.encode(hadith.id)}" else "kuran-kerim-diyor://hadith"
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(target)).apply {
                setPackage(context.packageName)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                // Ayet widget'ının PendingIntent'leriyle çakışmaması için ayrı istek kodu aralığı.
                100_000 + appWidgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.hadith_widget_container, pendingIntent)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun fetchDailyHadith(language: String): DailyHadith? {
        return try {
            val tz = URLEncoder.encode(TimeZone.getDefault().id, "UTF-8")
            val conn = URL("https://api.kurannediyor.com.tr/api/hadith/daily?lang=$language&tz=$tz").openConnection()
            conn.connectTimeout = 4000
            conn.readTimeout = 4000
            val data = JSONObject(conn.getInputStream().bufferedReader().use { it.readText() })
            val id = data.optString("id", "")
            val excerpt = data.optString("excerpt", "")
            if (id.isEmpty() || excerpt.isEmpty()) null
            else DailyHadith(id, excerpt, data.optString("reference", ""), data.optString("grade", ""))
        } catch (_: Exception) {
            null
        }
    }

    companion object {
        private val SUPPORTED = setOf("tr", "en", "de", "fr", "es", "ar")
    }
}
