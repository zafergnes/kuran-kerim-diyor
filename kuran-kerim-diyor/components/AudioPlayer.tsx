import React, { useState, useEffect } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';
import { useTranslation } from 'react-i18next';

interface AudioPlayerProps {
    globalAyahNumber: number;
}

export function AudioPlayer({ globalAyahNumber }: AudioPlayerProps) {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { selectedReciter } = useUserStore();
    const { t } = useTranslation();

    const theme = Colors.light;

    const reciterKey = selectedReciter.replace('.', '_');
    const reciterName = t(`reciters.${reciterKey}_name`);

    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    // Force unload sound if reciter changes
    useEffect(() => {
        if (sound) {
            sound.unloadAsync();
            setSound(null);
            setIsPlaying(false);
        }
    }, [selectedReciter]);

    const handlePlayPause = async () => {
        if (isLoading) return;

        if (sound) {
            if (isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
            return;
        }

        setIsLoading(true);
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });

            const url = `https://cdn.islamic.network/quran/audio/64/${selectedReciter}/${globalAyahNumber}.mp3`;

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );

            setSound(newSound);
            setIsPlaying(true);

            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });
        } catch (e) {
            console.error("Audio playback error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={handlePlayPause}>
                {isLoading ? (
                    <ActivityIndicator color={theme.primary} />
                ) : isPlaying ? (
                    <Pause size={28} color={theme.primary} />
                ) : (
                    <Play size={28} color={theme.primary} />
                )}
            </TouchableOpacity>
            {isPlaying && (
                <Text style={[styles.reciterText, { color: theme.muted }]} numberOfLines={1}>
                    🎙️ {reciterName.split(' ').pop()}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 50,
    },
    button: {
        padding: 8,
    },
    reciterText: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: -2,
    }
});
