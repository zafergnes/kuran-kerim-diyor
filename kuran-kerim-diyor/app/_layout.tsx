import { Stack } from 'expo-router';
import { useFonts, Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { NotoNaskhArabic_400Regular, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import '../services/i18n'; // i18n'i uygulama baslarken baslat
import i18n, { applyRTL, detectDeviceLanguage } from '../services/i18n';

import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        Amiri_400Regular,
        Amiri_700Bold,
        NotoNaskhArabic_400Regular,
        NotoNaskhArabic_700Bold,
    });
    const router = useRouter();

    useEffect(() => {
        if (!loaded && !error) return;

        const checkFirstLaunch = async () => {
            const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
            if (hasOnboarded !== 'true') {
                router.replace('/onboarding');
            }
            
            // Favorileri ve dil tercihini yukle
            const { useUserStore } = await import('../store/userStore');
            await useUserStore.getState().loadFavorites();

            // Kayitli dil tercihi varsa i18n'e uygula, yoksa cihaz dilini kullan
            const storedLang = await AsyncStorage.getItem('@app_language');
            const language = storedLang ?? detectDeviceLanguage();
            i18n.changeLanguage(language);
            applyRTL(language as any);
            // Store'u da guncelle
            useUserStore.getState().setLanguage(language as any);
            
            SplashScreen.hideAsync();
        };

        const handleDeepLink = (url: string | null) => {
            if (!url) return;
            const parsed = Linking.parse(url);
            
            let surah: string | null = null;
            let ayah: string | null = null;

            if (parsed.path === 'ayet' && parsed.queryParams?.id) {
                const id = parsed.queryParams.id as string;
                [surah, ayah] = id.split(':');
            } else if (parsed.path && parsed.path.startsWith('ayet/')) {
                const id = parsed.path.substring(5); // e.g. "36:9"
                [surah, ayah] = id.split(':');
            }

            if (surah && ayah) {
                // Store'u dogrudan guncelle
                import('../store/userStore').then(({ useUserStore }) => {
                    useUserStore.getState().setProgress(Number(surah), Number(ayah));
                    router.replace('/(tabs)');
                });
            }
        };

        checkFirstLaunch();

        // Uygulama acikken gelen linkler
        const subscription = Linking.addEventListener('url', (event) => handleDeepLink(event.url));
        
        // Uygulama kapaliyken acilan link
        Linking.getInitialURL().then(handleDeepLink);

        // Bildirim Kaydi ve Dinleyiciler (Sadece Expo Go disindaki ortamlarda)
        const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
        let notificationListener: any = null;

        if (!isExpoGo) {
            try {
                const Notifications = require('expo-notifications');
                const { NotificationService } = require('../services/notificationService');

                Notifications.setNotificationHandler({
                    handleNotification: async () => ({
                        shouldShowAlert: true,
                        shouldPlaySound: true,
                        shouldSetBadge: false,
                        shouldShowBanner: true,
                        shouldShowList: true,
                    }),
                });

                NotificationService.registerForPushNotifications();

                notificationListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
                    const data = response.notification.request.content.data;
                    if (data?.surah && data?.ayah) {
                        import('../store/userStore').then(({ useUserStore }) => {
                            useUserStore.getState().setProgress(Number(data.surah), Number(data.ayah));
                            router.replace('/(tabs)');
                        });
                    }
                });
            } catch (e) {
                console.error('Failed to initialize dynamic notifications:', e);
            }
        } else {
            console.log('[RootLayout] Running inside Expo Go. Skipping push notification service.');
        }

        return () => {
            subscription.remove();
            if (notificationListener) {
                notificationListener.remove();
            }
        };


        checkFirstLaunch();

        // Listen to Auth State Globally using our API
        const checkAuth = async () => {
            const { useUserStore } = await import('../store/userStore');
            const { default: apiClient } = await import('../services/apiClient');
            const SecureStore = await import('expo-secure-store');
            
            try {
                const token = await SecureStore.getItemAsync('userToken');
                if (token) {
                    // Fetch real user info from backend
                    const res = await apiClient.get('/auth/me');
                    const { user } = res.data;
                    useUserStore.getState().setAuth(user.id, user.isGuest, user.email, user.email);
                    if (!user.isGuest) {
                        useUserStore.getState().syncAllLocalData();
                    }
                } else {
                    useUserStore.getState().setAuth(null, false, null, null);
                }
            } catch (e) {
                // If token is invalid or expired, clear it
                await SecureStore.deleteItemAsync('userToken');
                useUserStore.getState().setAuth(null, false, null, null);
            }
        };

        checkAuth();
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
    );
}
