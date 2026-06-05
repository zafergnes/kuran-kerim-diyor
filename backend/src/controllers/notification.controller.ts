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

  // Test amaçlı manuel tetikleme
  static async testPush(req: Request, res: Response) {
    try {
      const { timezone } = req.query;
      if (timezone) {
        await NotificationService.sendDailyVerseToTimezone(timezone as string);
        return res.json({ message: `Test push sent to ${timezone}` });
      }
      res.status(400).json({ error: 'Timezone required for test' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
