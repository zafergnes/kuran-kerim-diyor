import { Tabs } from 'expo-router';
import { Home, BookOpen, Search, User, Heart } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function TabLayout() {
    const { theme } = useAppTheme();
    const { t } = useTranslation();

    return (
        <Tabs
            backBehavior="history"
            screenOptions={{
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.muted,
                tabBarStyle: {
                    backgroundColor: theme.background,
                    borderTopColor: theme.border,
                },
                headerStyle: {
                    backgroundColor: theme.background,
                },
                headerTintColor: theme.text,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: t('tabs.quran'),
                    // @ts-ignore
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="surahs"
                options={{
                    title: t('tabs.surahs'),
                    // @ts-ignore
                    tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: "", // No title to keep it clean, just the center button
                    tabBarIcon: ({ focused }) => (
                        <View style={[
                            styles.centerButton,
                            { backgroundColor: focused ? theme.primary : theme.background }
                        ]}>
                            {/* @ts-ignore */}
                            <Heart size={26} color={focused ? '#fff' : theme.muted} fill={focused ? '#fff' : 'transparent'} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: t('tabs.search'),
                    // @ts-ignore
                    tabBarIcon: ({ color }) => <Search size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('tabs.profile'),
                    // @ts-ignore
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    centerButton: {
        top: -10,
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    }
});
