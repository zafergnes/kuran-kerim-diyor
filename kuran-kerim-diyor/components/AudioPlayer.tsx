import React, { useState, useEffect } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { Audio, CompatSound as AudioSound } from '../services/audioCompat';
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useUserStore } from '../store/userStore';
import { useTranslation } from 'react-i18next';
import { GlobalAudioController } from '../services/globalAudioController';
import { getAyahAudioUrl } from '../services/quranAudioTimingService';

interface AudioPlayerProps {
    globalAyahNumber: number;
    onProgressChange?: (progress: number) => void;
    seekProgress?: number | null;
    onPlayingChange?: (isPlaying: boolean) => void;
    onScrubbingChange?: (isScrubbing: boolean) => void;
}

export function AudioPlayer({
    globalAyahNumber,
    onProgressChange,
    seekProgress,
    onPlayingChange,
    onScrubbingChange,
}: AudioPlayerProps) {
    const [sound, setSound] = useState<AudioSound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [playProgress, setPlayProgress] = useState(0);
    const [durationMillis, setDurationMillis] = useState(0);
    const [positionMillis, setPositionMillis] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const { selectedReciter } = useUserStore();
    const { t } = useTranslation();

    const { theme } = useAppTheme();
    const reciterKey = selectedReciter.replace('.', '_');
    const reciterName = t(`reciters.${reciterKey}_name`);

    const ownerId = `ayah_${globalAyahNumber}`;

    const updateProgress = (progress: number) => {
        const normalizedProgress = Math.min(1, Math.max(0, progress));
        setPlayProgress(normalizedProgress);
        onProgressChange?.(normalizedProgress);
    };

    const formatTime = (milliseconds: number) => {
        const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
        return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
    };

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

    useEffect(() => {
        if (seekProgress === null || seekProgress === undefined || !sound) return;

        sound.getStatusAsync().then((status) => {
            if (status.isLoaded && status.durationMillis) {
                const normalizedProgress = Math.min(1, Math.max(0, seekProgress));
                updateProgress(normalizedProgress);
                const nextPosition = normalizedProgress * status.durationMillis;
                setPositionMillis(nextPosition);
                sound.setPositionAsync(nextPosition).catch(() => {});
            }
        }).catch(() => {});
    }, [seekProgress, sound]);

    useEffect(() => {
        onPlayingChange?.(isPlaying);
    }, [isPlaying, onPlayingChange]);

    const handlePlayPause = async () => {
        if (isLoading) return;

        if (sound) {
            if (isPlaying) {
                await GlobalAudioController.pause(ownerId);
                setIsPlaying(false);
            } else {
                await GlobalAudioController.play(sound, ownerId, () => {
                    setIsPlaying(false);
                    updateProgress(0);
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
                playsInSilentMode: true,
                shouldPlayInBackground: false,
            });

            const url = getAyahAudioUrl(selectedReciter, globalAyahNumber);

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: false }
            );

            await newSound.setRateAsync(playbackRate);
            await GlobalAudioController.play(newSound, ownerId, () => {
                setIsPlaying(false);
                updateProgress(0);
                setPositionMillis(0);
                setDurationMillis(0);
                setSound(null);
            });

            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded) {
                    setDurationMillis(status.durationMillis || 0);
                    setPositionMillis(status.positionMillis || 0);
                    if (status.durationMillis) {
                        updateProgress(status.positionMillis / status.durationMillis);
                    }
                    if (status.didJustFinish) {
                        setIsPlaying(false);
                        updateProgress(0);
                        setPositionMillis(0);
                        newSound.setPositionAsync(0).catch(() => {});
                    }
                }
            });

            setSound(newSound);
            await newSound.playAsync();
            setIsPlaying(true);
        } catch (e) {
            console.error("Audio playback error:", e);
            setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    };

    const seekBy = async (seconds: number) => {
        if (!sound) return;
        const status = await sound.getStatusAsync();
        if (!status.isLoaded || !status.durationMillis) return;
        const nextPosition = Math.min(
            status.durationMillis,
            Math.max(0, status.positionMillis + seconds * 1000),
        );
        await sound.setPositionAsync(nextPosition);
        setPositionMillis(nextPosition);
        updateProgress(nextPosition / status.durationMillis);
    };

    const cyclePlaybackRate = async () => {
        const rates = [0.75, 1, 1.25];
        const currentIndex = rates.indexOf(playbackRate);
        const nextRate = rates[(currentIndex + 1) % rates.length];
        setPlaybackRate(nextRate);
        if (sound) await sound.setRateAsync(nextRate);
    };

    const handleResponderGrantOrMove = (evt: any) => {
        const { locationX } = evt.nativeEvent;
        const width = 190;
        const percentage = Math.min(1, Math.max(0, locationX / width));
        
        updateProgress(percentage);

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
            {sound && (
                <View style={styles.playbackContainer}>
                    <View style={styles.transportRow}>
                        <TouchableOpacity onPress={() => void seekBy(-5)} style={styles.smallControl} accessibilityLabel="5 saniye geri">
                            <RotateCcw size={15} color={theme.primary} />
                            <Text style={[styles.seekLabel, { color: theme.primary }]}>5</Text>
                        </TouchableOpacity>
                        <Text style={[styles.timeText, { color: theme.muted }]}>
                            {formatTime(positionMillis)} / {formatTime(durationMillis)}
                        </Text>
                        <TouchableOpacity onPress={() => void seekBy(5)} style={styles.smallControl} accessibilityLabel="5 saniye ileri">
                            <RotateCw size={15} color={theme.primary} />
                            <Text style={[styles.seekLabel, { color: theme.primary }]}>5</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => void cyclePlaybackRate()} style={[styles.rateButton, { borderColor: theme.border }]} accessibilityLabel="Okuma hızı">
                            <Text style={[styles.rateText, { color: theme.primary }]}>{playbackRate}×</Text>
                        </TouchableOpacity>
                    </View>
                    <View 
                        style={styles.progressBarContainer}
                        onStartShouldSetResponder={() => true}
                        onMoveShouldSetResponder={() => true}
                        onResponderGrant={handleResponderGrantOrMove}
                        onResponderMove={handleResponderGrantOrMove}
                        onResponderRelease={() => onScrubbingChange?.(false)}
                        onResponderTerminate={() => onScrubbingChange?.(false)}
                        onResponderTerminationRequest={() => false}
                        onTouchStart={() => onScrubbingChange?.(true)}
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
        width: 190,
    },
    transportRow: {
        width: 190,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    smallControl: {
        minWidth: 28,
        height: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    seekLabel: {
        fontSize: 9,
        fontWeight: '800',
        marginLeft: -2,
    },
    timeText: {
        fontSize: 9,
        fontVariant: ['tabular-nums'],
    },
    rateButton: {
        minWidth: 38,
        height: 22,
        borderWidth: 1,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rateText: {
        fontSize: 10,
        fontWeight: '800',
    },
    progressBarContainer: {
        width: 190,
        height: 24,
        justifyContent: 'center',
        marginBottom: 2,
    },
    progressBarBg: {
        width: 190,
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
