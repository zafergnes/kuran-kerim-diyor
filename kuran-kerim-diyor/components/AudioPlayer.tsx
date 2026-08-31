import React, { useState, useEffect } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useUserStore } from '../store/userStore';
import { useTranslation } from 'react-i18next';
import { GlobalAudioController } from '../services/globalAudioController';

interface AudioPlayerProps {
    globalAyahNumber: number;
}

export function AudioPlayer({ globalAyahNumber }: AudioPlayerProps) {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [playProgress, setPlayProgress] = useState(0);
    const { selectedReciter } = useUserStore();
    const { t } = useTranslation();

    const { theme } = useAppTheme();
    const reciterKey = selectedReciter.replace('.', '_');
    const reciterName = t(`reciters.${reciterKey}_name`);

    const ownerId = `ayah_${globalAyahNumber}`;

    // Clean up sound on unmount
    useEffect(() => {
        return () => {
            GlobalAudioController.stop(ownerId);
        };
    }, []);

    // Force unload sound if reciter changes
    useEffect(() => {
        if (sound) {
            GlobalAudioController.stop(ownerId);
        }
    }, [selectedReciter]);

    const handlePlayPause = async () => {
        if (isLoading) return;

        if (sound) {
            if (isPlaying) {
                await GlobalAudioController.stop(ownerId);
            } else {
                await GlobalAudioController.play(sound, ownerId, () => {
                    setIsPlaying(false);
                    setPlayProgress(0);
                    setSound(null);
                });
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
                if (status.isLoaded) {
                    if (status.durationMillis) {
                        setPlayProgress(status.positionMillis / status.durationMillis);
                    }
                    if (status.didJustFinish) {
                        setIsPlaying(false);
                        setPlayProgress(0);
                        setSound(null);
                        GlobalAudioController.stop(ownerId);
                    }
                }
            });

            await GlobalAudioController.play(newSound, ownerId, () => {
                setIsPlaying(false);
                setPlayProgress(0);
                setSound(null);
            });
        } catch (e) {
            console.error("Audio playback error:", e);
            setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResponderGrantOrMove = (evt: any) => {
        const { locationX } = evt.nativeEvent;
        const width = 120;
        const percentage = Math.min(1, Math.max(0, locationX / width));
        
        setPlayProgress(percentage);

        if (sound) {
            sound.getStatusAsync().then(status => {
                if (status.isLoaded && status.durationMillis) {
                    const targetPos = percentage * status.durationMillis;
                    sound.setPositionAsync(targetPos).catch(() => {});
                }
            });
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
                <View style={styles.playbackContainer}>
                    <View 
                        style={styles.progressBarContainer}
                        onStartShouldSetResponder={() => true}
                        onMoveShouldSetResponder={() => true}
                        onResponderGrant={handleResponderGrantOrMove}
                        onResponderMove={handleResponderGrantOrMove}
                    >
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${playProgress * 100}%`, backgroundColor: theme.primary }]} />
                            <View style={[styles.progressThumb, { left: `${playProgress * 100}%`, backgroundColor: theme.primary }]} />
                        </View>
                    </View>
                    <Text style={[styles.reciterText, { color: theme.muted }]} numberOfLines={1}>
                        🎙️ {reciterName.split(' ').pop()}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 50,
    },
    button: {
        padding: 8,
    },
    playbackContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginLeft: 8,
        justifyContent: 'center',
        width: 120,
    },
    progressBarContainer: {
        width: 120,
        height: 24,
        justifyContent: 'center',
        marginBottom: 2,
    },
    progressBarBg: {
        width: 120,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(182, 154, 115, 0.2)',
        position: 'relative',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressThumb: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        top: -3,
        marginLeft: -6,
    },
    reciterText: {
        fontSize: 10,
        fontWeight: '500',
    }
});
