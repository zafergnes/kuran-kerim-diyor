import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import cron from 'node-cron';
import webpush from 'web-push';
import { prisma } from '../utils/prisma';
import { DailyService } from './daily.service';
const expo = new Expo();

const vapidEmail = process.env.VAPID_EMAIL || 'mailto:info@kuran-kerim-diyor.com';
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  const keys = webpush.generateVAPIDKeys();
  console.log('===================================================');
  console.log('[WebPush] Generated VAPID Keys (Add to your .env):');
  console.log(`VAPID_PUBLIC_KEY="${keys.publicKey}"`);
  console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"`);
  console.log(`VAPID_EMAIL="mailto:info@kuran-kerim-diyor.com"`);
  console.log('===================================================');
  webpush.setVapidDetails('mailto:info@kuran-kerim-diyor.com', keys.publicKey, keys.privateKey);
} else {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

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
   * Web push aboneliği kaydeder veya günceller
   */
  static async registerWebSubscription(data: { endpoint: string; p256dh: string; auth: string; timezone: string; language: string; userId?: string }) {
    // @ts-ignore - Prisma Client generator delay
    return prisma.webPushSubscription.upsert({
      where: { endpoint: data.endpoint },
      update: {
        p256dh: data.p256dh,
        auth: data.auth,
        timezone: data.timezone,
        language: data.language,
        userId: data.userId || null,
      },
      create: {
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        timezone: data.timezone,
        language: data.language,
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
                console.error(`Push token ${pushToken} is not a valid Expo push token`);
                continue;
              }

              messages.push({
                to: pushToken,
                sound: 'default',
                title: lang === 'tr' ? 'Günün Ayeti' : 'Verse of the Day',
                body: `${dailyContext.reference}\n${dailyContext.text.substring(0, 100)}...`,
                data: { 
                  reference: dailyContext.reference
                },
              });
            }

            const chunks = expo.chunkPushNotifications(messages);
            for (const chunk of chunks) {
              await expo.sendPushNotificationsAsync(chunk);
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
              title: lang === 'tr' ? 'Günün Ayeti' : 'Verse of the Day',
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
                  console.error('[WebPush] Error sending push to endpoint:', sub.endpoint, err);
                  if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log('[WebPush] Deleting expired subscription:', sub.endpoint);
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
      const allTimezones = await prisma.pushDevice.findMany({
        distinct: ['timezone'],
        select: { timezone: true }
      });

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
            if (localHour === 12) {
              await this.sendDailyVerseToTimezone(tz.timezone);
            }
          }
        } catch (error) {
          console.error(`[Cron] Error checking timezone ${tz.timezone}:`, error);
        }
      }
    });

    console.log('[Notification] Cron job initialized.');
  }
}
