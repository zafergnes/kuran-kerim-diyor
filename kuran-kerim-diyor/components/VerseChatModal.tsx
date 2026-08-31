import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Flag, Send, ShieldCheck, Sparkles, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../hooks/useAppTheme';
import { useUserStore } from '../store/userStore';
import { VerseChatMessage, VerseChatResponse, VerseChatService } from '../services/verseChatService';
import { AnalyticsService } from '../services/analyticsService';

type Props = {
  visible: boolean;
  onClose: () => void;
  surahNumber: number;
  ayahNumber: number;
  reference: string;
  translation: string;
};

export function VerseChatModal(props: Props) {
  const { visible, onClose, surahNumber, ayahNumber, reference, translation } = props;
  const { t } = useTranslation();
  const language = useUserStore((state) => state.language);
  const { theme } = useAppTheme();
  const [messages, setMessages] = useState<VerseChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<VerseChatResponse | null>(null);
  const suggestions = useMemo(() => [
    t('verse_chat.suggestion_meaning', 'Ana mesajı nedir?'),
    t('verse_chat.suggestion_context', 'Bağlamıyla açıklar mısın?'),
  ], [t]);

  const send = async (preset?: string) => {
    const question = (preset || input).trim();
    if (!question || loading) return;
    const withQuestion: VerseChatMessage[] = [...messages, { role: 'user', text: question }];
    setMessages(withQuestion);
    setInput('');
    setLoading(true);
    void AnalyticsService.track('AI_CHAT_MESSAGE', { screen: 'verse_chat', metadata: { surahNumber, ayahNumber } });
    try {
      const response = await VerseChatService.discuss({
        surahNumber, ayahNumber, language, message: question,
        history: messages.slice(-8).map((message) => ({ ...message, text: message.text.slice(0, 1500) })),
      });
      setLastResponse(response);
      const text = [
        response.answer,
        response.keyPoints.map((point) => `• ${point}`).join('\n'),
        response.reflectionQuestion,
        response.safetyNote,
      ].filter(Boolean).join('\n\n');
      setMessages([...withQuestion, { role: 'assistant', text }]);
    } catch (error: any) {
      Alert.alert(
        t('verse_chat.error_title', 'Yanıt oluşturulamadı'),
        error?.response?.status === 429
          ? t('verse_chat.rate_limited', 'Çok fazla soru sordunuz. Lütfen biraz sonra tekrar deneyin.')
          : t('verse_chat.error_message', 'Bağlantınızı kontrol edip tekrar deneyin.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const report = () => {
    if (!lastResponse) return;
    Alert.alert(t('verse_chat.report_title', 'Yanıtı bildir'), undefined, [
      { text: t('common.cancel', 'Vazgeç'), style: 'cancel' },
      {
        text: t('verse_chat.report_inaccurate', 'Hatalı veya kaynaksız'),
        onPress: () => void VerseChatService.report({ responseId: lastResponse.id, surahNumber, ayahNumber, reason: 'INACCURATE', details: lastResponse.answer.slice(0, 500) }),
      },
      {
        text: t('verse_chat.report_unsafe', 'Sakıncalı veya kırıcı'),
        onPress: () => void VerseChatService.report({ responseId: lastResponse.id, surahNumber, ayahNumber, reason: 'UNSAFE', details: lastResponse.answer.slice(0, 500) }),
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[styles.root, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.heading}><Sparkles size={18} color={theme.primary} /><View>
            <Text style={[styles.title, { color: theme.text }]}>{t('verse_chat.title', 'Ayet Üzerine Konuş')}</Text>
            <Text style={[styles.reference, { color: theme.muted }]}>{reference}</Text>
          </View></View>
          <TouchableOpacity onPress={onClose} style={styles.close}><X size={20} color={theme.text} /></TouchableOpacity>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.verse, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Text numberOfLines={3} style={[styles.verseText, { color: theme.secondary }]}>{translation}</Text>
          </View>
          <View style={styles.notice}><ShieldCheck size={15} color={theme.primary} />
            <Text style={[styles.noticeText, { color: theme.muted }]}>{t('verse_chat.disclaimer', 'AI yanıtları tefekkür ve eğitim içindir; meal veya fetva değildir.')}</Text>
          </View>
          {!messages.length && <View style={styles.suggestions}>{suggestions.map((item) => (
            <TouchableOpacity key={item} style={[styles.suggestion, { borderColor: theme.border }]} onPress={() => void send(item)}>
              <Text style={{ color: theme.primary, fontSize: 13 }}>{item}</Text>
            </TouchableOpacity>
          ))}</View>}
          {messages.map((message, index) => <View key={`${message.role}-${index}`} style={[
            styles.message,
            message.role === 'user' ? styles.user : styles.assistant,
            { backgroundColor: message.role === 'user' ? theme.primary : theme.card },
          ]}><Text style={{ color: message.role === 'user' ? '#fff' : theme.text, lineHeight: 21 }}>{message.text}</Text></View>)}
          {loading && <ActivityIndicator color={theme.primary} style={{ alignSelf: 'flex-start', margin: 10 }} />}
          {lastResponse && !loading && <TouchableOpacity onPress={report} style={styles.report}><Flag size={13} color={theme.muted} /><Text style={{ color: theme.muted, fontSize: 11 }}>{t('verse_chat.report', 'Yanıtı bildir')}</Text></TouchableOpacity>}
        </ScrollView>
        <View style={[styles.composer, { borderTopColor: theme.border }]}>
          <TextInput value={input} onChangeText={setInput} multiline maxLength={600} placeholder={t('verse_chat.placeholder', 'Bu ayet hakkında sor...')} placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]} />
          <TouchableOpacity onPress={() => void send()} disabled={!input.trim() || loading} style={[styles.send, { backgroundColor: theme.primary, opacity: !input.trim() || loading ? 0.4 : 1 }]}><Send size={18} color="#fff" /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9 }, title: { fontSize: 17, fontWeight: '700' }, reference: { fontSize: 11, marginTop: 2 }, close: { padding: 7 },
  scroll: { flex: 1 }, content: { padding: 16, gap: 12 }, verse: { padding: 12, borderRadius: 12, borderWidth: 1 }, verseText: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  notice: { flexDirection: 'row', gap: 7, alignItems: 'center' }, noticeText: { flex: 1, fontSize: 11, lineHeight: 16 }, suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestion: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 }, message: { maxWidth: '88%', padding: 11, borderRadius: 14 }, user: { alignSelf: 'flex-end', borderBottomRightRadius: 3 }, assistant: { alignSelf: 'flex-start', borderBottomLeftRadius: 3 },
  report: { flexDirection: 'row', gap: 5, alignItems: 'center', alignSelf: 'flex-start', padding: 5 }, composer: { padding: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 42, maxHeight: 100, borderWidth: 1, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 10 }, send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
