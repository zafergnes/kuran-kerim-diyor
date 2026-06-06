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
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        thread {
            try {
                // API'den veri cek (Gunun Ayeti)
                val jsonText = URL("https://api.kurannediyor.com.tr/api/daily-context?lang=tr").readText()
                val data = JSONObject(jsonText)
                
                val text = data.getString("text")
                val reference = data.getString("reference")
                
                // surahNumber ve startAyah bilgilerini al
                val surahNumber = data.optInt("surahNumber", 1)
                val startAyah = data.optInt("startAyah", 1)

                val views = RemoteViews(context.packageName, R.layout.verse_widget)
                views.setTextViewText(R.id.widget_text, "“$text”")
                views.setTextViewText(R.id.widget_reference, reference)

                // Derin baglanti (Deep Link) Intent yapilandirmasi
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    this.data = Uri.parse("kuran-kerim-diyor://ayet?id=$surahNumber:$startAyah")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                
                // PendingIntent ile widget tiklandiginda tetiklenecek eylem
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
}
