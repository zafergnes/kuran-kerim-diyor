package com.kurankerimdiyor

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import java.net.URL
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
                // 1. Önce uygulamadan senkronize edilmiş yerel veriyi kontrol et (anında, internetsiz)
                val prefs = context.getSharedPreferences(context.packageName + ".widgetdata", Context.MODE_PRIVATE)
                val cachedJson = prefs.getString("widgetdata", null)

                var text = ""
                var reference = ""
                var surahNumber = 94
                var startAyah = 5
                var title = "GÜNÜN AYETİ"
                var streakBadge = ""
                var todayStatus = ""

                if (!cachedJson.isNullOrEmpty()) {
                    try {
                        val payload = JSONObject(cachedJson)
                        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
                        text = payload.optString("text", "")
                        reference = payload.optString("reference", "")
                        surahNumber = payload.optInt("surahNumber", 94)
                        startAyah = payload.optInt("startAyah", 5)

                        val labels = payload.optJSONObject("labels")
                        if (labels != null) {
                            title = labels.optString("title", title)
                            streakBadge = labels.optString("streakBadge", streakBadge)
                            todayStatus = labels.optString("todayStatus", todayStatus)
                        }
                        if (payload.optString("cachedDate") != today) {
                            text = ""
                            streakBadge = ""
                            todayStatus = ""
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                // 2. Eğer yerel veri boşsa API'den çek
                if (text.isEmpty()) {
                    try {
                        val lang = try { JSONObject(cachedJson ?: "{}").optString("language", java.util.Locale.getDefault().language) } catch (_: Exception) { java.util.Locale.getDefault().language }
                        val supportedLangs = listOf("tr", "en", "de", "fr", "es", "ar")
                        val apiLang = if (supportedLangs.contains(lang)) lang else "tr"
                        title = when (apiLang) {
                            "en" -> "VERSE OF THE DAY"
                            "de" -> "VERS DES TAGES"
                            "fr" -> "VERSET DU JOUR"
                            "es" -> "VERSÍCULO DEL DÍA"
                            "ar" -> "آية اليوم"
                            else -> "GÜNÜN AYETİ"
                        }

                        val conn = URL("https://api.kurannediyor.com.tr/api/daily-context?lang=$apiLang").openConnection()
                        conn.connectTimeout = 4000
                        conn.readTimeout = 4000
                        val jsonText = conn.getInputStream().bufferedReader().use { it.readText() }
                        val data = JSONObject(jsonText)
                        
                        text = data.optString("text", "Şüphesiz her zorlukla beraber bir kolaylık vardır.")
                        reference = data.optString("reference", "İnşirah 94:5")
                        surahNumber = data.optInt("surahNumber", 94)
                        startAyah = data.optInt("startAyah", 5)
                    } catch (netErr: Exception) {
                        if (text.isEmpty()) {
                            text = "Şüphesiz her zorlukla beraber bir kolaylık vardır."
                            reference = "İnşirah 94:5"
                        }
                    }
                }

                // 3. RemoteViews oluştur ve elemanları bağla
                val views = RemoteViews(context.packageName, R.layout.verse_widget)
                views.setTextViewText(R.id.widget_title, title)
                views.setTextViewText(R.id.widget_streak, streakBadge)
                views.setTextViewText(R.id.widget_text, "“$text”")
                views.setTextViewText(R.id.widget_reference, reference)
                views.setTextViewText(R.id.widget_status, todayStatus)

                // 4. Derin bağlantı (Deep Link) Intent yapılandırması
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    this.data = Uri.parse("kuran-kerim-diyor://ayet?id=$surahNumber:$startAyah")
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
