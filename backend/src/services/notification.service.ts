import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { DailyService } from './daily.service';
const expo = new Expo();

export class NotificationService {
  /**
   * Cihaz kaydı yapar veya günceller
   */
  static async registerDevice(data: { token: string; timezone: string; language: string; userId?: string }) {
    // @ts-ignore - Prisma IDE sync issue, model exists in DB and runtime
    return prisma.pushDevice.upsert({
      where: { token: data.token },
      update: {
        timezone: data.timezone,
        language: data.language,
        userId: data.userId || null,
      },
      create: {
        token: data.token,
        timezone: data.timezone,
        language: data.language,
        userId: data.userId || null,
      },
    });
  }

  /**
   * Belirli bir zaman dilimi grubuna bildirim gönderir
   */
  static async sendDailyVerseToTimezone(timezoneOffset: string) {
    console.log(`[Notification] Sending daily verse to timezone offset: ${timezoneOffset}`);
    
    // Bu zaman dilimindeki cihazları bul
    // @ts-ignore - Prisma IDE sync issue
    const devices = await prisma.pushDevice.findMany({
      where: {
        timezone: {
          contains: timezoneOffset // Basit kontrol: UTC+3 gibi
        }
      }
    });

    if (devices.length === 0) return;

    // Dillerine göre grupla (Her dile kendi dilinde ayet gitsin)
    const languageGroups: Record<string, string[]> = {};
    devices.forEach((d: any) => {
      if (!languageGroups[d.language]) languageGroups[d.language] = [];
      languageGroups[d.language].push(d.token);
    });

    for (const [lang, tokens] of Object.entries(languageGroups)) {
      try {
        // O günün ayetini bu dilde al
        const dailyContext = await DailyService.getDailyContext(lang as any);
        
        const messages: ExpoPushMessage[] = [];
        for (const pushToken of tokens) {
          if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
          }

          messages.push({
            to: pushToken,
            sound: 'default',
            title: lang === 'tr' ? 'Günün Ayeti' : 'Verse of the Day',
            body: `${dailyContext.reference}\n${dailyContext.text.substring(0, 100)}...`,
            data: { 
              // Referanstan veya dailyContext'ten surah/ayah bilgisini ayrıştırmak gerekebilir 
              // ama şimdilik sadece referansı gönderiyoruz veya DailyService'i genişletiyoruz
              reference: dailyContext.reference
            },
          });
        }

        // Parçalı gönderim (Expo limitleri için)
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          await expo.sendPushNotificationsAsync(chunk);
        }
      } catch (error) {
        console.error(`Error sending notifications for lang ${lang}:`, error);
      }
    }
  }

  /**
   * Her saat başı çalışan Cron Job'ı başlatır
   */
  static initCron() {
    // Her saat başı çalışır (Örn: 10:00, 11:00, 12:00)
    cron.schedule('0 * * * *', async () => {
      const now = new Date();
      console.log(`[Cron] Checking notifications for hour: ${now.getUTCHours()}:00 UTC`);

      // 12:00 local time = 12 - Offset UTC
      // Örn: Istanbul (UTC+3) için saat 12 iken UTC saati 09'dur.
      // 12 - 9 = +3.
      const targetOffset = 12 - now.getUTCHours();
      const offsetStr = targetOffset >= 0 ? `+${targetOffset}` : `${targetOffset}`;
      
      // Basit bir arama mantığı: Timezone string'i içinde "+3" veya "/Istanbul" gibi ifadeler aranabilir.
      // En garantisi cihazdan gelen tam Timezone string'ini eşleştirmektir.
      // Şimdilik offset bazlı veya direkt timezone string bazlı kontrol yapabiliriz.
      
      // Daha gelişmiş: Her cihazın yerel saatini hesapla
      // @ts-ignore - Prisma IDE sync issue
      const allTimezones = await prisma.pushDevice.findMany({
        distinct: ['timezone'],
        select: { timezone: true }
      });

      for (const tz of allTimezones) {
        const localHour = new Date(now.toLocaleString('en-US', { timeZone: tz.timezone })).getHours();
        if (localHour === 12) {
          await this.sendDailyVerseToTimezone(tz.timezone);
        }
      }
    });

    console.log('[Notification] Cron job initialized.');
  }
}
