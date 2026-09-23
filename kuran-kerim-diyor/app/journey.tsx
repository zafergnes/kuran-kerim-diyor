import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookMarked, Check, ChevronLeft, ChevronRight, Compass, Download, Leaf, Target, Trash2 } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useUserStore } from '../store/userStore';
import { AppLanguage } from '../constants/languages';
import { QURAN_TOPICS, QuranTopic } from '../constants/quranTopics';
import { getAyah, getAllSurahs, getSurah } from '../services/quranData';
import { ReadingGoal, ReadingJourneyService } from '../services/readingJourneyService';
import { OfflineAudioService } from '../services/offlineAudioService';

const COPY: Record<AppLanguage, Record<string, string>> = {
  tr: { title: 'Kur’an Yolculuğum', subtitle: 'Az, düzenli ve anlayarak.', today: 'Bugünkü hedef', pages: 'sayfa', complete: 'Bugün tamamlandı', topics: 'Konu haritası', topicsSub: 'Ayetleri anlam bağlantılarıyla keşfet', offline: 'Çevrimdışı dinleme', offlineSub: 'Kur’an metni zaten çevrimdışı. Seçtiğin surelerin sesini de indir.', choose: 'Sure seç', downloaded: 'İndirildi', download: 'İndir', remove: 'Sil', close: 'Kapat', verses: 'İlgili ayetler', downloading: 'İndiriliyor', goalHint: 'Günlük hedefini seç', downloadError: 'Ses indirilirken bir sorun oluştu.' },
  en: { title: 'My Quran Journey', subtitle: 'A little, consistently, with understanding.', today: "Today's goal", pages: 'pages', complete: 'Completed today', topics: 'Topic map', topicsSub: 'Explore verses through meaningful connections', offline: 'Offline listening', offlineSub: 'Quran text is already offline. Download audio for selected surahs.', choose: 'Choose surah', downloaded: 'Downloaded', download: 'Download', remove: 'Remove', close: 'Close', verses: 'Related verses', downloading: 'Downloading', goalHint: 'Choose your daily goal', downloadError: 'Audio could not be downloaded.' },
  ar: { title: 'رحلتي مع القرآن', subtitle: 'قليل دائم مع الفهم.', today: 'هدف اليوم', pages: 'صفحات', complete: 'اكتمل اليوم', topics: 'خريطة الموضوعات', topicsSub: 'اكتشف الآيات من خلال روابط المعاني', offline: 'الاستماع دون اتصال', offlineSub: 'نص القرآن متاح دون اتصال. حمّل صوت السور المختارة.', choose: 'اختر سورة', downloaded: 'تم التنزيل', download: 'تنزيل', remove: 'حذف', close: 'إغلاق', verses: 'الآيات المرتبطة', downloading: 'جارٍ التنزيل', goalHint: 'اختر هدفك اليومي', downloadError: 'تعذر تنزيل الصوت.' },
  de: { title: 'Meine Koran-Reise', subtitle: 'Wenig, regelmäßig und mit Verständnis.', today: 'Heutiges Ziel', pages: 'Seiten', complete: 'Heute abgeschlossen', topics: 'Themenkarte', topicsSub: 'Verse über Sinnzusammenhänge entdecken', offline: 'Offline hören', offlineSub: 'Der Korantext ist bereits offline. Lade Audio ausgewählter Suren.', choose: 'Sure wählen', downloaded: 'Heruntergeladen', download: 'Laden', remove: 'Löschen', close: 'Schließen', verses: 'Zugehörige Verse', downloading: 'Wird geladen', goalHint: 'Tagesziel wählen', downloadError: 'Das Audio konnte nicht geladen werden.' },
  fr: { title: 'Mon parcours coranique', subtitle: 'Un peu, régulièrement et avec compréhension.', today: 'Objectif du jour', pages: 'pages', complete: 'Terminé aujourd’hui', topics: 'Carte des thèmes', topicsSub: 'Explorer les versets par leurs liens de sens', offline: 'Écoute hors ligne', offlineSub: 'Le texte est déjà hors ligne. Téléchargez l’audio des sourates choisies.', choose: 'Choisir une sourate', downloaded: 'Téléchargée', download: 'Télécharger', remove: 'Supprimer', close: 'Fermer', verses: 'Versets associés', downloading: 'Téléchargement', goalHint: 'Choisissez votre objectif quotidien', downloadError: 'Impossible de télécharger l’audio.' },
  es: { title: 'Mi camino con el Corán', subtitle: 'Poco, constante y con comprensión.', today: 'Objetivo de hoy', pages: 'páginas', complete: 'Completado hoy', topics: 'Mapa temático', topicsSub: 'Explora aleyas mediante conexiones de significado', offline: 'Escucha sin conexión', offlineSub: 'El texto ya está sin conexión. Descarga el audio de las suras elegidas.', choose: 'Elegir sura', downloaded: 'Descargada', download: 'Descargar', remove: 'Eliminar', close: 'Cerrar', verses: 'Aleyas relacionadas', downloading: 'Descargando', goalHint: 'Elige tu objetivo diario', downloadError: 'No se pudo descargar el audio.' },
};

export default function JourneyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const { language, selectedReciter, setProgress } = useUserStore();
  const c = COPY[language] || COPY.tr;
  const [goal, setGoal] = useState<ReadingGoal>(1);
  const [pagesRead, setPagesRead] = useState(0);
  const [topic, setTopic] = useState<QuranTopic | null>(null);
  const [showSurahs, setShowSurahs] = useState(false);
  const [downloadedSurahs, setDownloadedSurahs] = useState<number[]>([]);
  const [downloadState, setDownloadState] = useState<{ surah: number; completed: number; total: number } | null>(null);
  const surahs = useMemo(() => getAllSurahs(), []);

  const refresh = async () => {
    const [storedGoal, progress, downloads] = await Promise.all([
      ReadingJourneyService.getGoal(),
      ReadingJourneyService.getTodayProgress(),
      OfflineAudioService.getDownloadedSurahs(selectedReciter),
    ]);
    setGoal(storedGoal);
    setPagesRead(progress.pages.length);
    setDownloadedSurahs(downloads);
  };

  useEffect(() => { void refresh(); }, [selectedReciter]);

  const chooseGoal = async (nextGoal: ReadingGoal) => {
    setGoal(nextGoal);
    await ReadingJourneyService.setGoal(nextGoal);
  };

  const openVerse = async (surah: number, ayah: number) => {
    await setProgress(surah, ayah);
    setTopic(null);
    router.replace('/(tabs)');
  };

  const downloadSurah = async (surahNumber: number) => {
    setDownloadState({ surah: surahNumber, completed: 0, total: getSurah(surahNumber)?.ayahs.length || 1 });
    try {
      await OfflineAudioService.downloadSurah(selectedReciter, surahNumber, (completed, total) => {
        setDownloadState({ surah: surahNumber, completed, total });
      });
      setDownloadedSurahs(await OfflineAudioService.getDownloadedSurahs(selectedReciter));
    } catch (error) {
      Alert.alert(c.offline, error instanceof Error ? error.message : c.downloadError);
    } finally {
      setDownloadState(null);
    }
  };

  const removeSurah = async (surahNumber: number) => {
    await OfflineAudioService.removeSurah(selectedReciter, surahNumber);
    setDownloadedSurahs(await OfflineAudioService.getDownloadedSurahs(selectedReciter));
  };

  const progressRatio = Math.min(1, pagesRead / goal);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><ChevronLeft color={theme.primary} /></TouchableOpacity>
        <View style={styles.headerCopy}><Text style={[styles.title, { color: theme.text }]}>{c.title}</Text><Text style={[styles.subtitle, { color: theme.muted }]}>{c.subtitle}</Text></View>
        <Compass color={theme.primary} size={25} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={[styles.goalCard, { backgroundColor: '#063B43' }]}>
          <View style={styles.goalTop}><View><Text style={styles.eyebrow}>{c.today}</Text><Text style={styles.goalNumber}>{pagesRead}<Text style={styles.goalTotal}> / {goal} {c.pages}</Text></Text></View><View style={styles.targetSeal}>{progressRatio >= 1 ? <Check color="#063B43" /> : <Target color="#D9B76F" />}</View></View>
          <View style={styles.goalTrack}><View style={[styles.goalFill, { width: `${progressRatio * 100}%` }]} /></View>
          <Text style={styles.goalHint}>{progressRatio >= 1 ? c.complete : c.goalHint}</Text>
          <View style={styles.goalOptions}>{([1, 2, 5] as ReadingGoal[]).map((value) => <TouchableOpacity key={value} onPress={() => void chooseGoal(value)} style={[styles.goalChip, goal === value && styles.goalChipActive]}><Text style={[styles.goalChipText, goal === value && styles.goalChipTextActive]}>{value} {c.pages}</Text></TouchableOpacity>)}</View>
        </View>

        <View style={styles.sectionHeading}><View><Text style={[styles.sectionTitle, { color: theme.text }]}>{c.topics}</Text><Text style={[styles.sectionSubtitle, { color: theme.muted }]}>{c.topicsSub}</Text></View><Leaf size={22} color={theme.primary} /></View>
        <View style={styles.topicGrid}>{QURAN_TOPICS.map((item, index) => <TouchableOpacity key={item.id} onPress={() => setTopic(item)} style={[styles.topicCard, { backgroundColor: item.color }, index % 3 === 0 && styles.topicWide]}><Text style={styles.topicIndex}>{String(index + 1).padStart(2, '0')}</Text><Text style={styles.topicTitle}>{item.title[language]}</Text><Text style={styles.topicDescription} numberOfLines={2}>{item.description[language]}</Text><ChevronRight color="#FFF" size={18} style={styles.topicArrow} /></TouchableOpacity>)}</View>

        <View style={styles.sectionHeading}><View><Text style={[styles.sectionTitle, { color: theme.text }]}>{c.offline}</Text><Text style={[styles.sectionSubtitle, { color: theme.muted }]}>{c.offlineSub}</Text></View><Download size={22} color={theme.primary} /></View>
        <TouchableOpacity onPress={() => setShowSurahs(true)} style={[styles.offlineCard, { backgroundColor: theme.card, borderColor: theme.border }]}><View style={[styles.offlineIcon, { backgroundColor: `${theme.primary}18` }]}><BookMarked color={theme.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.offlineTitle, { color: theme.text }]}>{c.choose}</Text><Text style={[styles.offlineMeta, { color: theme.muted }]}>{downloadedSurahs.length} {c.downloaded.toLowerCase()}</Text></View><ChevronRight color={theme.muted} /></TouchableOpacity>
      </ScrollView>

      <Modal visible={!!topic} animationType="slide" transparent onRequestClose={() => setTopic(null)}><View style={styles.modalShade}><View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + 16 }]}>{topic && <><View style={[styles.sheetAccent, { backgroundColor: topic.color }]} /><View style={styles.sheetHeader}><View style={{ flex: 1 }}><Text style={[styles.sheetTitle, { color: theme.text }]}>{topic.title[language]}</Text><Text style={[styles.sheetSubtitle, { color: theme.muted }]}>{topic.description[language]}</Text></View><TouchableOpacity onPress={() => setTopic(null)}><Text style={{ color: theme.primary, fontWeight: '800' }}>{c.close}</Text></TouchableOpacity></View><Text style={[styles.verseLabel, { color: theme.muted }]}>{c.verses}</Text>{topic.verses.map((ref) => { const ayah = getAyah(ref.surah, ref.ayah); const surah = getSurah(ref.surah); return <TouchableOpacity key={`${ref.surah}:${ref.ayah}`} onPress={() => void openVerse(ref.surah, ref.ayah)} style={[styles.verseRow, { borderColor: theme.border }]}><View style={[styles.verseRef, { backgroundColor: `${topic.color}18` }]}><Text style={{ color: topic.color, fontWeight: '900' }}>{ref.surah}:{ref.ayah}</Text></View><View style={{ flex: 1 }}><Text style={[styles.verseName, { color: theme.text }]}>{surah?.name[language]}</Text><Text style={[styles.verseText, { color: theme.muted }]} numberOfLines={2}>{ayah?.translations[language]}</Text></View><ChevronRight size={18} color={theme.muted} /></TouchableOpacity>; })}</>}</View></View></Modal>

      <Modal visible={showSurahs} animationType="slide" onRequestClose={() => setShowSurahs(false)}><View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top }]}><View style={[styles.sheetHeader, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}><Text style={[styles.sheetTitle, { color: theme.text }]}>{c.offline}</Text><TouchableOpacity onPress={() => setShowSurahs(false)}><Text style={{ color: theme.primary, fontWeight: '800' }}>{c.close}</Text></TouchableOpacity></View><FlatList data={surahs} keyExtractor={(item) => String(item.number)} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} renderItem={({ item }) => { const downloaded = downloadedSurahs.includes(item.number); const active = downloadState?.surah === item.number; return <View style={[styles.surahRow, { borderBottomColor: theme.border }]}><View style={styles.surahNumber}><Text style={{ color: theme.primary, fontWeight: '900' }}>{item.number}</Text></View><View style={{ flex: 1 }}><Text style={[styles.surahName, { color: theme.text }]}>{item.name[language]}</Text><Text style={[styles.offlineMeta, { color: theme.muted }]}>{item.ayahsCount} · {downloaded ? c.downloaded : active ? `${c.downloading} ${downloadState.completed}/${downloadState.total}` : c.download}</Text></View>{active ? <ActivityIndicator color={theme.primary} /> : downloaded ? <TouchableOpacity onPress={() => void removeSurah(item.number)} style={styles.actionButton}><Trash2 size={18} color="#C65353" /></TouchableOpacity> : <TouchableOpacity disabled={!!downloadState} onPress={() => void downloadSurah(item.number)} style={styles.actionButton}><Download size={18} color={theme.primary} /></TouchableOpacity>}</View>; }} /></View></Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth }, backButton: { width: 42, height: 42, justifyContent: 'center' }, headerCopy: { flex: 1 }, title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 }, subtitle: { fontSize: 12, marginTop: 2 }, content: { padding: 16 },
  goalCard: { borderRadius: 26, padding: 20, shadowColor: '#001E22', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 }, goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, eyebrow: { color: '#D9B76F', fontWeight: '800', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }, goalNumber: { color: '#FFF', fontSize: 34, fontWeight: '900', marginTop: 5 }, goalTotal: { color: '#A9C5C8', fontSize: 15, fontWeight: '600' }, targetSeal: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D9B76F', alignItems: 'center', justifyContent: 'center' }, goalTrack: { height: 7, backgroundColor: 'rgba(255,255,255,.13)', borderRadius: 4, overflow: 'hidden', marginTop: 18 }, goalFill: { height: '100%', backgroundColor: '#D9B76F', borderRadius: 4 }, goalHint: { color: '#BBD0D2', marginTop: 9, fontSize: 12 }, goalOptions: { flexDirection: 'row', marginTop: 16, gap: 8 }, goalChip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }, goalChipActive: { backgroundColor: '#D9B76F', borderColor: '#D9B76F' }, goalChipText: { color: '#CEE0E1', fontSize: 12, fontWeight: '800' }, goalChipTextActive: { color: '#063B43' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 30, marginBottom: 12 }, sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 }, sectionSubtitle: { fontSize: 12, marginTop: 4, maxWidth: 290 }, topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, topicCard: { width: '48.5%', minHeight: 150, borderRadius: 22, padding: 16, overflow: 'hidden' }, topicWide: { width: '100%', minHeight: 132 }, topicIndex: { color: 'rgba(255,255,255,.5)', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 }, topicTitle: { color: '#FFF', fontSize: 17, lineHeight: 21, fontWeight: '900', marginTop: 18, maxWidth: '86%' }, topicDescription: { color: 'rgba(255,255,255,.78)', fontSize: 11, lineHeight: 16, marginTop: 6, maxWidth: '90%' }, topicArrow: { position: 'absolute', right: 14, bottom: 14 },
  offlineCard: { borderWidth: 1, borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 13 }, offlineIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, offlineTitle: { fontSize: 15, fontWeight: '800' }, offlineMeta: { fontSize: 12, marginTop: 3 },
  modalShade: { flex: 1, backgroundColor: 'rgba(0,0,0,.52)', justifyContent: 'flex-end' }, sheet: { maxHeight: '83%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }, sheetAccent: { height: 7 }, sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, gap: 16 }, sheetTitle: { fontSize: 21, fontWeight: '900' }, sheetSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 5 }, verseLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 6 }, verseRow: { flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 }, verseRef: { minWidth: 52, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, verseName: { fontWeight: '800', fontSize: 14 }, verseText: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  surahRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth }, surahNumber: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(182,154,115,.12)' }, surahName: { fontSize: 15, fontWeight: '800' }, actionButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
});
