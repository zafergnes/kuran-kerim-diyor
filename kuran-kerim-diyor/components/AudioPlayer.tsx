import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, View, Text, PanResponder } from 'react-native';
import { Audio, CompatSound as AudioSound } from '../services/audioCompat';
import { Play, Pause, RotateCcw, RotateCw, X } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useUserStore } from '../store/userStore';
import { useTranslation } from 'react-i18next';
import { GlobalAudioController } from '../services/globalAudioController';
import { getAyahAudioUrl } from '../services/quranAudioTimingService';
import { OfflineAudioService } from '../services/offlineAudioService';

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
    const [trackWidth, setTrackWidth] = useState(280);
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
            setSound(null);
            setIsPlaying(false);
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

    const handleStop = async () => {
        await GlobalAudioController.stop(ownerId);
        setSound(null);
        setIsPlaying(false);
        updateProgress(0);
        setPositionMillis(0);
        setDurationMillis(0);
    };

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
                    setPositionMillis(0);
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

            const offlineTrack = await OfflineAudioService.getTrack(selectedReciter, globalAyahNumber);
            const url = offlineTrack?.url || getAyahAudioUrl(selectedReciter, globalAyahNumber);

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

    // Kesintisiz, sayfa kaydırmasını kilitleyen ve geniş alanda yakalayan PanResponder
    const isScrubbingRef = useRef(false);
    const initialXRef = useRef(0);
    const trackWidthRef = useRef(trackWidth);
    trackWidthRef.current = trackWidth;
    const soundRef = useRef(sound);
    soundRef.current = sound;
    const onScrubbingChangeRef = useRef(onScrubbingChange);
    onScrubbingChangeRef.current = onScrubbingChange;

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onStartShouldSetPanResponderCapture: () => true,
                onMoveShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponderCapture: () => true,
                onPanResponderGrant: (evt) => {
                    isScrubbingRef.current = true;
                    onScrubbingChangeRef.current?.(true);
                    const locX = evt.nativeEvent.locationX;
                    initialXRef.current = locX;
                    const w = trackWidthRef.current > 0 ? trackWidthRef.current : 280;
                    const percentage = Math.min(1, Math.max(0, locX / w));
                    updateProgress(percentage);
                    if (soundRef.current) {
                        soundRef.current.getStatusAsync().then((status) => {
                            if (status.isLoaded && status.durationMillis) {
                                const targetPos = percentage * status.durationMillis;
                                soundRef.current?.setPositionAsync(targetPos).catch(() => {});
                            }
                        });
                    }
                },
                onPanResponderMove: (evt, gestureState) => {
                    const w = trackWidthRef.current > 0 ? trackWidthRef.current : 280;
                    const currentX = initialXRef.current + gestureState.dx;
                    const percentage = Math.min(1, Math.max(0, currentX / w));
                    updateProgress(percentage);
                    if (soundRef.current) {
                        soundRef.current.getStatusAsync().then((status) => {
                            if (status.isLoaded && status.durationMillis) {
                                const targetPos = percentage * status.durationMillis;
                                soundRef.current?.setPositionAsync(targetPos).catch(() => {});
                            }
                        });
                    }
                },
                onPanResponderRelease: () => {
                    isScrubbingRef.current = false;
                    onScrubbingChangeRef.current?.(false);
                },
                onPanResponderTerminate: () => {
                    isScrubbingRef.current = false;
                    onScrubbingChangeRef.current?.(false);
                },
                onPanResponderTerminationRequest: () => false,
            }),
        []
    );

    return (
        <View style={styles.container}>
            {(!sound && !isLoading) ? (
                /* Boşta (Idle) Durum — Tıklanabilir Şık Bar */
                <View style={[styles.idleBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TouchableOpacity
                        style={[styles.idlePlayBtn, { backgroundColor: theme.primary }]}
                        onPress={handlePlayPause}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.listen_ayah', 'Ayet Tilaveti')}
                    >
                        <Play size={16} color="#fff" style={{ marginLeft: 2 }} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.idleInfoArea}
                        onPress={handlePlayPause}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.idleTitle, { color: theme.text }]} numberOfLines={1}>
                            {t('common.listen_ayah', 'Ayet Tilaveti')}
                        </Text>
                        <Text style={[styles.idleSubtitle, { color: theme.muted }]} numberOfLines={1}>
                            🎙️ {reciterName}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => void cyclePlaybackRate()}
                        style={[styles.rateBadge, { backgroundColor: theme.background, borderColor: theme.border }]}
                        accessibilityLabel="Okuma hızı"
                    >
                        <Text style={[styles.rateBadgeText, { color: theme.primary }]}>{playbackRate}×</Text>
                    </TouchableOpacity>
                </View>
            ) : (!sound && isLoading) ? (
                /* Yükleniyor Durumu */
                <View style={[styles.idleBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.idlePlayBtn, { backgroundColor: theme.primary }]}>
                        <ActivityIndicator size="small" color="#fff" />
                    </View>
                    <View style={styles.idleInfoArea}>
                        <Text style={[styles.idleTitle, { color: theme.text }]}>
                            {t('common.loading', 'Yükleniyor...')}
                        </Text>
                        <Text style={[styles.idleSubtitle, { color: theme.muted }]}>
                            🎙️ {reciterName}
                        </Text>
                    </View>
                </View>
            ) : (
                /* Aktif Oynatıcı Paneli (Ergonomik ve Tam Genişlikte) */
                <View style={[styles.activeDeck, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {/* Üst Bilgi Satırı: Okuyucu, Hız, Kapat */}
                    <View style={styles.deckTopRow}>
                        <View style={styles.reciterChip}>
                            <View style={[styles.activeDot, { backgroundColor: isPlaying ? '#4CAF50' : theme.muted }]} />
                            <Text style={[styles.reciterChipText, { color: theme.muted }]} numberOfLines={1}>
                                {reciterName}
                            </Text>
                        </View>

                        <View style={styles.deckTopActions}>
                            <TouchableOpacity
                                onPress={() => void cyclePlaybackRate()}
                                style={[styles.rateBadge, { backgroundColor: theme.background, borderColor: theme.border }]}
                                accessibilityLabel="Okuma hızı"
                            >
                                <Text style={[styles.rateBadgeText, { color: theme.primary }]}>{playbackRate}×</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleStop}
                                style={styles.closeBtn}
                                accessibilityLabel="Durdur ve kapat"
                            >
                                <X size={16} color={theme.muted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tam Genişlikte İlerleme Çubuğu — PanResponder ve Geniş HitSlop ile Sayfa Kaydırmayı Önler */}
                    <View
                        style={styles.scrubberArea}
                        hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
                        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                        {...panResponder.panHandlers}
                    >
                        <View style={[styles.trackBg, { backgroundColor: theme.primary + '20' }]}>
                            <View style={[styles.trackFill, { width: `${playProgress * 100}%`, backgroundColor: theme.primary }]} />
                            <View style={[styles.trackThumb, { left: `${playProgress * 100}%`, backgroundColor: theme.primary }]} />
                        </View>
                    </View>

                    {/* Alt Kontrol ve Süre Satırı */}
                    <View style={styles.deckBottomRow}>
                        <Text style={[styles.timeLabel, { color: theme.muted }]}>
                            {formatTime(positionMillis)}
                        </Text>

                        <View style={styles.transportControls}>
                            <TouchableOpacity
                                onPress={() => void seekBy(-5)}
                                style={[styles.seekButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                                accessibilityLabel="5 saniye geri"
                                activeOpacity={0.7}
                            >
                                <RotateCcw size={15} color={theme.primary} />
                                <Text style={[styles.seekText, { color: theme.primary }]}>5</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handlePlayPause}
                                style={[styles.mainPlayButton, { backgroundColor: theme.primary }]}
                                activeOpacity={0.8}
                                accessibilityLabel={isPlaying ? 'Durdur' : 'Oynat'}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : isPlaying ? (
                                    <Pause size={20} color="#fff" />
                                ) : (
                                    <Play size={20} color="#fff" style={{ marginLeft: 2 }} />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => void seekBy(5)}
                                style={[styles.seekButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                                accessibilityLabel="5 saniye ileri"
                                activeOpacity={0.7}
                            >
                                <RotateCw size={15} color={theme.primary} />
                                <Text style={[styles.seekText, { color: theme.primary }]}>5</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.timeLabel, { color: theme.muted }]}>
                            {formatTime(durationMillis)}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    idleBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
        width: '100%',
    },
    idlePlayBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    idleInfoArea: {
        flex: 1,
        justifyContent: 'center',
    },
    idleTitle: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    idleSubtitle: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 1,
    },
    rateBadge: {
        paddingHorizontal: 8,
        height: 26,
        borderRadius: 13,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rateBadgeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    activeDeck: {
        width: '100%',
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 8,
    },
    deckTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    reciterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    reciterChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    deckTopActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    closeBtn: {
        padding: 4,
    },
    scrubberArea: {
        width: '100%',
        height: 42,
        justifyContent: 'center',
    },
    trackBg: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        position: 'relative',
    },
    trackFill: {
        height: '100%',
        borderRadius: 3,
    },
    trackThumb: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        top: -4,
        marginLeft: -7,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    deckBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    timeLabel: {
        fontSize: 11,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
        minWidth: 36,
    },
    transportControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    seekButton: {
        width: 36,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
    },
    seekText: {
        fontSize: 10,
        fontWeight: '800',
    },
    mainPlayButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
});
