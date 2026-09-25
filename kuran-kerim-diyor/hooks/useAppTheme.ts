import { useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';

export type ThemePreference = 'system' | 'light' | 'dark' | 'sepia';
export type AppColorScheme = 'light' | 'dark' | 'sepia';

export function useAppTheme() {
    const systemColorScheme = useColorScheme();
    const themePreference = useUserStore((state) => state.themePreference);
    const colorScheme: AppColorScheme = themePreference === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : (systemColorScheme === 'light' ? 'light' : 'sepia'))
        : (themePreference || 'sepia');

    return {
        colorScheme,
        theme: Colors[colorScheme] || Colors.sepia,
        themePreference,
    };
}

