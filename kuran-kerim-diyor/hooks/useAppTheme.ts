import { useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';

export type ThemePreference = 'system' | 'light' | 'dark';

export function useAppTheme() {
    const systemColorScheme = useColorScheme();
    const themePreference = useUserStore((state) => state.themePreference);
    const colorScheme = themePreference === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themePreference;

    return {
        colorScheme,
        theme: Colors[colorScheme],
        themePreference,
    };
}
