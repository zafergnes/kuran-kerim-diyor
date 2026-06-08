import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  static async register(req: Request, res: Response) {
    try {
      const { token, timezone, language, userId } = req.body;

      if (!token || !timezone) {
        return res.status(400).json({ error: 'Token and timezone are required' });
      }

      await NotificationService.registerDevice({
        token,
        timezone,
        language: language || 'tr',
        userId
      });

      res.status(200).json({ message: 'Device registered successfully' });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async registerWeb(req: Request, res: Response) {
    try {
      const { endpoint, p256dh, auth, timezone, language, userId } = req.body;

      if (!endpoint || !p256dh || !auth || !timezone) {
        return res.status(400).json({ error: 'Endpoint, p256dh, auth and timezone are required' });
      }

      await NotificationService.registerWebSubscription({
        endpoint,
        p256dh,
        auth,
        timezone,
        language: language || 'tr',
        userId
      });

      res.status(200).json({ message: 'Web subscription registered successfully' });
    } catch (error: any) {
      console.error('Web registration error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Test amaçlı manuel tetikleme (debug bilgili)
  static async testPush(req: Request, res: Response) {
    try {
      const { timezone } = req.query;
      if (!timezone) {
        return res.status(400).json({ error: 'Timezone required for test' });
      }

      // Debug: Veritabanındaki kayıtları kontrol et
      const { prisma } = require('../utils/prisma');
      
      // @ts-ignore
      const allMobileDevices = await prisma.pushDevice.findMany();
      // @ts-ignore
      const allWebSubs = await prisma.webPushSubscription.findMany();
      
      // @ts-ignore
      const matchingMobile = await prisma.pushDevice.findMany({
        where: { timezone: { contains: timezone as string } }
      });
      // @ts-ignore
      const matchingWeb = await prisma.webPushSubscription.findMany({
        where: { timezone: { contains: timezone as string } }
      });

      const vapidPublic = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

      const debugInfo = {
        query_timezone: timezone,
        vapid_keys_loaded: {
          public_key_exists: !!vapidPublic,
          public_key_preview: vapidPublic ? vapidPublic.substring(0, 20) + '...' : 'NOT SET',
          private_key_exists: !!vapidPrivate,
        },
        database: {
          total_mobile_devices: allMobileDevices.length,
          total_web_subscriptions: allWebSubs.length,
          matching_mobile_for_timezone: matchingMobile.length,
          matching_web_for_timezone: matchingWeb.length,
          all_mobile_timezones: allMobileDevices.map((d: any) => d.timezone),
          all_web_timezones: allWebSubs.map((s: any) => s.timezone),
        }
      };

      // Bildirimleri göndermeyi dene
      try {
        await NotificationService.sendDailyVerseToTimezone(timezone as string);
        return res.json({ 
          message: `Test push attempted for ${timezone}`,
          debug: debugInfo,
          result: 'sendDailyVerseToTimezone completed without error'
        });
      } catch (sendError: any) {
        return res.json({ 
          message: `Test push FAILED for ${timezone}`,
          debug: debugInfo,
          error: sendError.message
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  }
}
