import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Localization from 'expo-localization';
import { Platform } from 'react-native';
import apiClient from './apiClient';
import { useUserStore } from '../store/userStore';

export class NotificationService {
  /**
   * Bildirim izinlerini ister ve token'ı sunucuya kaydeder
   */
  static async registerForPushNotifications() {
    let token;

    const isDevice = Constants.executionEnvironment !== ExecutionEnvironment.Bare && 
                    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

    if (isDevice || Platform.OS !== 'web') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('[NotificationService] Project ID not found. Remote notifications will not work without EAS project setup.');
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;
    } else {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (token) {
      const timezone = Localization.getCalendars()[0].timeZone || 'Europe/Istanbul';
      const language = useUserStore.getState().language || 'tr';
      const userId = useUserStore.getState().userId;

      try {
        await apiClient.post('/notifications/register', {
          token,
          timezone,
          language,
          userId
        });
        console.log('[NotificationService] Registered with token:', token);
      } catch (error) {
        console.error('[NotificationService] Registration failed:', error);
      }
    }

    return token;
  }
}
