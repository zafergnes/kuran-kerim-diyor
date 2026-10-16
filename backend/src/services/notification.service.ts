import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import cron from 'node-cron';
import webpush from 'web-push';
import { prisma } from '../utils/prisma';
import { DailyService } from './daily.service';
import { HadithService, hadithExcerpt, hadithReference, normalizeHadithLanguage } from './hadith.service';
const expo = new Expo();

const NOTIFICATION_TITLES: Record<string, string> = {
  tr: 'Günün Ayeti',
  en: 'Verse of the Day',
  de: 'Vers des Tages',
  fr: 'Verset du jour',
  es: 'Versículo del día',
  ar: 'آية اليوم'
};

const HADITH_TITLES: Record<string, string> = {
  tr: 'Günün Hadisi',
  en: 'Hadith of the Day',
  de: 'Hadith des Tages',
  fr: 'Hadith du jour',
  es: 'Hadiz del día',
  ar: 'حديث اليوم'
};

const VERSE_HOUR = 12;
const HADITH_HOUR = 19;
// Akşam hadis bildirimi, hadis ekranını içeren mobil sürüm mağazalara çıkana kadar kapalı tutulur.
const dailyHadithPushEnabled = () => process.env.DAILY_HADITH_PUSH_ENABLED === 'true';

const vapidEmail = process.env.VAPID_EMAIL || 'https://kurannediyor.com.tr/support';
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const webPushConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('[WebPush] VAPID keys are not configured; web push delivery is disabled.');
}

export class NotificationService {
  /**
   * Cihaz kaydı yapar veya günceller
   */
  static async registerDevice(data: { token: string; timezone: string; language: string; dailyHadith?: boolean; userId?: string }) {
    // @ts-ignore - Prisma IDE sync issue, model exists in DB and runtime
    return prisma.pushDevice.upsert({
      where: { token: data.token },
      update: {
        timezone: data.timezone,
        language: data.language,
        ...(data.dailyHadith !== undefined && { dailyHadith: data.dailyHadith }),
        userId: data.userId || null,
      },
      create: {
        token: data.token,
        timezone: data.timezone,
        language: data.language,
        dailyHadith: data.dailyHadith ?? true,
        userId: data.userId || null,
      },
    });
  }

  /**
   * Web push aboneliği kaydeder veya günceller
   */
  static async registerWebSubscription(data: { endpoint: string; p256dh: string; auth: string; timezone: string; language: string; dailyHadith?: boolean; userId?: string }) {
    if (!webPushConfigured) throw new Error('WEB_PUSH_NOT_CONFIGURED');
    // @ts-ignore - Prisma Client generator delay
    return prisma.webPushSubscription.upsert({
      where: { endpoint: data.endpoint },
      update: {
        p256dh: data.p256dh,
        auth: data.auth,
        timezone: data.timezone,
        language: data.language,
        ...(data.dailyHadith !== undefined && { dailyHadith: data.dailyHadith }),
        userId: data.userId || null,
      },
      create: {
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        timezone: data.timezone,
        language: data.language,
        dailyHadith: data.dailyHadith ?? true,
        userId: data.userId || null,
      },
    });
  }

  static async sendDailyVerseToTimezone(timezoneOffset: string) {
    console.log(`[Notification] Sending daily verse to timezone offset: ${timezoneOffset}`);
    
    // 1. MOBILE PUSH DEVICES
    try {
      // @ts-ignore - Prisma IDE sync issue
      const devices = await prisma.pushDevice.findMany({
        where: {
          timezone: {
            contains: timezoneOffset
          }
        }
      });

      if (devices.length > 0) {
        const languageGroups: Record<string, string[]> = {};
        devices.forEach((d: any) => {
          if (!languageGroups[d.language]) languageGroups[d.language] = [];
          languageGroups[d.language].push(d.token);
        });

        for (const [lang, tokens] of Object.entries(languageGroups)) {
          try {
            const dailyContext = await DailyService.getDailyContext(lang as any);
            const messages: ExpoPushMessage[] = [];
            for (const pushToken of tokens) {
              if (!Expo.isExpoPushToken(pushToken)) {
                console.error('[Notification] Skipping an invalid Expo push token.');
                continue;
              }

              messages.push({
                to: pushToken,
                sound: 'default',
                priority: 'high',
                channelId: 'default',
                title: NOTIFICATION_TITLES[lang] || NOTIFICATION_TITLES['en'],
                body: `${dailyContext.reference}\n${dailyContext.text.substring(0, 100)}...`,
                data: { 
                  showDaily: 'true',
                  surah: dailyContext.surahNumber.toString(),
                  ayah: dailyContext.startAyah.toString()
                },
              });
            }

            const chunks = expo.chunkPushNotifications(messages);
            for (const chunk of chunks) {
              const tickets = await expo.sendPushNotificationsAsync(chunk);
              for (let i = 0; i < chunk.length; i++) {
                const ticket = tickets[i];
                // Check if the recipient is a single string or an array of strings (chunk[i].to)
                const recipient = chunk[i].to;
                const tokens = Array.isArray(recipient) ? recipient : [recipient];
                
                if (ticket.status === 'error') {
                  console.error(`[Notification] Push delivery failed for ${tokens.length} recipient(s):`, ticket.details?.error || ticket.message);
                  if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
                    for (const token of tokens) {
                      console.log('[Notification] Removing an unregistered device token.');
                      // @ts-ignore
                      await prisma.pushDevice.delete({ where: { token } }).catch((err: any) => {
                        console.error('[Notification] Failed to delete an unregistered token:', err);
                      });
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error sending mobile notifications for lang ${lang}:`, error);
          }
        }
      }
    } catch (mobileError) {
      console.error('[Notification] Error in mobile push notifications:', mobileError);
    }

    // 2. WEB PUSH SUBSCRIPTIONS
    if (!webPushConfigured) return;
    try {
      // @ts-ignore
      const webSubscriptions = await prisma.webPushSubscription.findMany({
        where: {
          timezone: {
            contains: timezoneOffset
          }
        }
      });

      if (webSubscriptions.length > 0) {
        const webLanguageGroups: Record<string, any[]> = {};
        webSubscriptions.forEach((sub: any) => {
          if (!webLanguageGroups[sub.language]) webLanguageGroups[sub.language] = [];
          webLanguageGroups[sub.language].push(sub);
        });

        for (const [lang, subs] of Object.entries(webLanguageGroups)) {
          try {
            const dailyContext = await DailyService.getDailyContext(lang as any);
            const payload = JSON.stringify({
              title: NOTIFICATION_TITLES[lang] || NOTIFICATION_TITLES['en'],
              body: `${dailyContext.reference}\n${dailyContext.text.substring(0, 100)}...`,
              data: {
                url: `/`
              }
            });

            for (const sub of subs) {
              const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth
                }
              };

              webpush.sendNotification(pushSubscription, payload)
                .catch((err: any) => {
                  console.error('[WebPush] Delivery failed:', err.statusCode || err.message);
                  if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log('[WebPush] Removing an expired subscription.');
                    // @ts-ignore
                    prisma.webPushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
                  }
                });
            }
          } catch (error) {
            console.error(`[WebPush] Error sending web push for lang ${lang}:`, error);
          }
        }
      }
    } catch (webError) {
      console.error('[WebPush] General web push error:', webError);
    }
  }

  /**
   * Günün hadisini, o saat diliminde tercihi açık olan cihazlara ve web abonelerine gönderir.
   * Her saat diliminin kendi takvim günü kullanılır; böylece bildirimdeki hadis uygulamadaki ile aynıdır.
   */
  static async sendDailyHadithToTimezone(timezone: string) {
    const hadith = HadithService.getDaily(timezone);
    const message = (rawLang: string) => {
      const lang = normalizeHadithLanguage(rawLang);
      return {
        title: HADITH_TITLES[lang],
        body: `${hadithExcerpt(hadith.text[lang], 150)}\n— ${hadithReference(hadith, lang)}`,
      };
    };

    try {
      const devices = await prisma.pushDevice.findMany({ where: { timezone, dailyHadith: true } });
      const messages: ExpoPushMessage[] = devices
        .filter((device) => Expo.isExpoPushToken(device.token))
        .map((device) => ({
          to: device.token,
          sound: 'default',
          priority: 'high',
          channelId: 'default',
          ...message(device.language),
          data: { showHadith: 'true', hadithId: hadith.id },
        }));

      for (const chunk of expo.chunkPushNotifications(messages)) {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        for (let i = 0; i < chunk.length; i++) {
          const ticket = tickets[i];
          if (ticket.status !== 'error') continue;
          console.error('[Notification] Hadith push delivery failed:', ticket.details?.error || ticket.message);
          if (ticket.details?.error === 'DeviceNotRegistered') {
            const recipients = Array.isArray(chunk[i].to) ? chunk[i].to : [chunk[i].to];
            await prisma.pushDevice.deleteMany({ where: { token: { in: recipients as string[] } } }).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('[Notification] Daily hadith mobile push failed:', error);
    }

    if (!webPushConfigured) return;
    try {
      const subscriptions = await prisma.webPushSubscription.findMany({ where: { timezone, dailyHadith: true } });
      for (const sub of subscriptions) {
        const payload = JSON.stringify({ ...message(sub.language), data: { url: `/hadis?id=${hadith.id}` } });
        webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
          .catch((err: any) => {
            console.error('[WebPush] Hadith delivery failed:', err.statusCode || err.message);
            if (err.statusCode === 410 || err.statusCode === 404) {
              prisma.webPushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            }
          });
      }
    } catch (error) {
      console.error('[WebPush] Daily hadith web push failed:', error);
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
      
      // Daha gelismis: Her cihazin yerel saatini hesapla
      // @ts-ignore - Prisma IDE sync issue
      const [mobileTimezones, webTimezones] = await Promise.all([
        prisma.pushDevice.findMany({ distinct: ['timezone'], select: { timezone: true } }),
        prisma.webPushSubscription.findMany({ distinct: ['timezone'], select: { timezone: true } }),
      ]);
      const allTimezones = [...new Set([...mobileTimezones, ...webTimezones].map((item) => item.timezone))].map((timezone) => ({ timezone }));

      for (const tz of allTimezones) {
        try {
          if (!tz.timezone) continue;

          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz.timezone,
            hour: 'numeric',
            hourCycle: 'h23'
          });
          const parts = formatter.formatToParts(now);
          const hourVal = parts.find(p => p.type === 'hour')?.value;
          
          if (hourVal) {
            const localHour = parseInt(hourVal, 10);
            if (localHour === VERSE_HOUR) {
              await this.sendDailyVerseToTimezone(tz.timezone);
            } else if (localHour === HADITH_HOUR && dailyHadithPushEnabled()) {
              await this.sendDailyHadithToTimezone(tz.timezone);
            }
          }
        } catch (error) {
          console.error(`[Cron] Error checking timezone ${tz.timezone}:`, error);
        }
      }
    });

    // Her gün gece 03:00'te çalışan kalıcı silme Cron Job'ı
    cron.schedule('0 3 * * *', async () => {
      console.log('[Cron] Checking for expired soft-deleted accounts...');
      try {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const expiredUsers = await prisma.user.findMany({
          where: {
            isDeleted: true,
            deletedAt: {
              lte: fourteenDaysAgo
            }
          },
          select: { id: true, email: true }
        });

        if (expiredUsers.length > 0) {
          console.log(`[Cron] Found ${expiredUsers.length} expired accounts to delete permanently.`);
          for (const user of expiredUsers) {
            await prisma.user.delete({
              where: { id: user.id }
            });
            console.log(`[Cron] Permanently deleted user: ${user.email} (${user.id})`);
          }
        }
      } catch (error) {
        console.error('[Cron] Error permanently deleting expired accounts:', error);
      }
    });

    // Privacy retention: anonymous/product analytics 13 months, reported AI excerpts 180 days.
    cron.schedule('30 3 * * *', async () => {
      try {
        const analyticsCutoff = new Date(Date.now() - 395 * 24 * 60 * 60 * 1000);
        const aiFeedbackCutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        const [analytics, aiFeedback] = await Promise.all([
          prisma.appEvent.deleteMany({ where: { createdAt: { lt: analyticsCutoff } } }),
          prisma.aiFeedback.deleteMany({ where: { createdAt: { lt: aiFeedbackCutoff } } }),
        ]);
        console.log(`[Cron] Retention cleanup removed ${analytics.count} analytics and ${aiFeedback.count} AI feedback rows.`);
      } catch (error) {
        console.error('[Cron] Retention cleanup failed:', error);
      }
    });

    console.log('[Notification] Cron job initialized.');
  }
}
