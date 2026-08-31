import { Stack } from 'expo-router';
import { useFonts, Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { NotoNaskhArabic_400Regular, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import '../services/i18n'; // i18n'i uygulama baslarken baslat
import i18n, { applyRTL, detectDeviceLanguage } from '../services/i18n';
import { CelebrationModal } from '../components/CelebrationModal';

import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AnalyticsService } from '../services/analyticsService';
import { useAppTheme } from '../hooks/useAppTheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { colorScheme } = useAppTheme();
    const [loaded, error] = useFonts({
        Amiri_400Regular,
        Amiri_700Bold,
        NotoNaskhArabic_400Regular,
        NotoNaskhArabic_700Bold,
    });
    const router = useRouter();
    const segments = useSegments();
    const currentScreen = segments.join('/') || 'root';
    const currentScreenRef = useRef(currentScreen);

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

        // Bildirim Kaydi ve Dinleyiciler (Sadece Expo Go disindaki ortamlarda)
        const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
        let notificationListener: any = null;

        if (!isExpoGo) {
            try {
                const Notifications = require('expo-notifications');
                Notifications.setNotificationHandler({
                    handleNotification: async () => ({
                        shouldShowAlert: true,
                        shouldPlaySound: true,
                        shouldSetBadge: false,
                        shouldShowBanner: true,
                        shouldShowList: true,
                    }),
                });

                notificationListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
                    const data = response.notification.request.content.data;
                    if (data?.showDaily === 'true') {
                        if (data?.surah && data?.ayah) {
                            import('../store/userStore').then(({ useUserStore }) => {
                                useUserStore.getState().setProgress(Number(data.surah), Number(data.ayah));
                                router.replace('/(tabs)?showDaily=true');
                            });
                        } else {
                            router.replace('/(tabs)?showDaily=true');
                        }
                    } else if (data?.surah && data?.ayah) {
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
            } catch (e: any) {
                // Sadece yetkilendirme hatası durumunda (HTTP 401 veya 403) veya 
                // token SecureStore'dan silinmişse (örneğin yenileme başarısız olup interceptor silmişse) oturumu temizle.
                // Bağlantı hatası, sunucu çökmesi vb. durumlarda yerel oturumu koru.
                const isAuthError = e.response && (e.response.status === 401 || e.response.status === 403);
                const tokenStillExists = await SecureStore.getItemAsync('userToken');
                
                if (isAuthError || !tokenStillExists) {
                    await SecureStore.deleteItemAsync('userToken');
                    await SecureStore.deleteItemAsync('refreshToken');
                    useUserStore.getState().setAuth(null, false, null, null);
                } else {
                    console.log('[checkAuth] Network or server error, keeping offline session active.');
                }
            }
        };

        checkAuth();

        return () => {
            if (notificationListener) {
                notificationListener.remove();
            }
        };
    }, [loaded, error]);

    useEffect(() => {
        if (!loaded) return;
        void AnalyticsService.track('APP_OPEN', { screen: currentScreenRef.current });
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'background' || state === 'inactive') {
                void AnalyticsService.track('APP_BACKGROUND', { screen: currentScreenRef.current, throttleMs: 5000 });
            }
        });
        return () => subscription.remove();
    }, [loaded]);

    useEffect(() => {
        currentScreenRef.current = currentScreen;
        if (loaded) void AnalyticsService.track('SCREEN_VIEW', { screen: currentScreen, throttleMs: 1000 });
    }, [loaded, currentScreen]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
            </Stack>
            <CelebrationModal />
        </>
    );
}
