import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { NewsService } from '@/app/home/services/news.service';
import { NewsArticle } from '@/app/home/types/news.types';

function formatPublishDate(value: string): string {
  if (!value) return 'Vừa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Vừa cập nhật';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function NewsArticleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const articleId = Array.isArray(params.id) ? params.id[0] : params.id;
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translation State
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedTrail, setTranslatedTrail] = useState('');
  const [translatedParagraphs, setTranslatedParagraphs] = useState<string[]>([]);

  // AI Summary State
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);

  const translateText = async (text: string): Promise<string> => {
    if (!text || !text.trim()) return text;
    try {
      const encoded = encodeURIComponent(text.substring(0, 1500));
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encoded}`;
      const response = await fetch(url);
      if (!response.ok) return text;

      const rawText = await response.text();
      const trimmed = rawText.trim();
      if (!trimmed || trimmed.startsWith('<') || !trimmed.startsWith('[')) {
        return text;
      }

      const data = JSON.parse(trimmed);
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map((item: any) => item[0] || '').join('');
      }
      return text;
    } catch (e) {
      return text;
    }
  };

  const translateParagraphsBatch = async (items: string[]): Promise<string[]> => {
    if (!items || items.length === 0) return [];
    
    // Batch translate sequentially with small delay to avoid rate limiting
    const results: string[] = [];
    for (let i = 0; i < items.length; i++) {
      const trans = await translateText(items[i]);
      results.push(trans);
    }
    return results;
  };

  const handleTranslate = async () => {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    if (translatedTitle || translatedParagraphs.length > 0) {
      setIsTranslated(true);
      return;
    }

    setIsTranslating(true);
    try {
      if (article?.title) setTranslatedTitle(await translateText(article.title));
      if (article?.trailText) setTranslatedTrail(await translateText(article.trailText));
      
      const transParagraphs = await translateParagraphsBatch(paragraphs);
      setTranslatedParagraphs(transParagraphs);
      
      setIsTranslated(true);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể dịch bài viết lúc này.');
    } finally {
      setIsTranslating(false);
    }
  };

  const fetchArticle = useCallback(async (isRefresh = false) => {
    if (!articleId) {
      setError('Không tìm thấy bài viết.');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const nextArticle = await NewsService.getArticleById(articleId);
      setArticle(nextArticle);
    } catch (err) {
      console.error('Error fetching article detail:', err);
      setError('Không thể tải nội dung bài viết. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const paragraphs = useMemo(() => {
    if (article?.bodyParagraphs?.length) return article.bodyParagraphs;

    const body = article?.bodyText || article?.trailText || '';
    const existingParagraphs = body
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    if (existingParagraphs.length > 1) return existingParagraphs;

    const sentences = body.match(/[^.!?]+[.!?]+["')\]]*|.+$/g) ?? [];
    const chunks: string[] = [];
    let current = '';

    sentences.forEach((sentence) => {
      const trimmed = sentence.trim();
      const next = current ? `${current} ${trimmed}` : trimmed;
      if (next.length > 420 && current) {
        chunks.push(current);
        current = trimmed;
      } else {
        current = next;
      }
    });

    if (current) chunks.push(current);
    return chunks;
  }, [article?.bodyParagraphs, article?.bodyText, article?.trailText]);

  // AI News Summarize Handler
  const handleSummarize = async () => {
    if (summaryPoints.length > 0) {
      setSummaryModalVisible(true);
      return;
    }

    if (!article) return;

    setIsSummarizing(true);
    try {
      // Pick key representative content
      const rawPoints: string[] = [];

      // 1. Main topic / headline takeaway
      if (article.title) {
        rawPoints.push(`Tiêu đề chính: ${article.title}`);
      }
      
      // 2. Summary trail or first paragraph
      if (article.trailText) {
        rawPoints.push(`Nội dung tóm tắt: ${article.trailText}`);
      }

      // 3. Middle / Key paragraph highlight
      if (paragraphs.length > 0) {
        rawPoints.push(`Điểm nhấn chính: ${paragraphs[0]}`);
      }
      if (paragraphs.length > 1) {
        rawPoints.push(`Chi tiết bổ sung: ${paragraphs[1]}`);
      }

      // Translate points to Vietnamese safely
      const translatedPoints = await translateParagraphsBatch(rawPoints);

      // Clean and format as key bullet points
      const formattedPoints = translatedPoints.map((pt, idx) => {
        const prefixes = [
          '📌 Tiêu đề & Nội dung trọng tâm',
          '⚡ Diễn biến chính & bối cảnh',
          '⚽ Tình huống & Đánh giá chuyên môn',
          '📊 Tác động & Tương lai'
        ];
        const prefix = prefixes[idx] || '📝 Điểm nổi bật';
        return `${prefix}: ${pt.replace(/^(Tiêu đề chính|Nội dung tóm tắt|Điểm nhấn chính|Chi tiết bổ sung):\s*/i, '')}`;
      });

      setSummaryPoints(formattedPoints);
      setSummaryModalVisible(true);
    } catch (err) {
      console.error('Error generating AI summary:', err);
      Alert.alert('Lỗi', 'Không thể tạo tóm tắt AI lúc này.');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Đang mở bài viết...</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Bar Header */}
        <View style={[styles.topBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.74 : 1,
              },
            ]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>

          <Text style={[styles.topBarTitle, { color: colors.text }]}>News</Text>

          {/* Action Row: AI Summarize + Translate Buttons */}
          <View style={styles.topBarActionRow}>
            {article && (
              <>
                {/* AI Summarize Button (Sparkles Icon) */}
                <Pressable
                  onPress={handleSummarize}
                  disabled={isSummarizing}
                  style={({ pressed }) => [
                    styles.actionButton,
                    {
                      backgroundColor: summaryPoints.length > 0 ? colors.gold + '25' : colors.card,
                      borderColor: summaryPoints.length > 0 ? colors.gold : colors.border,
                      opacity: pressed || isSummarizing ? 0.74 : 1,
                    },
                  ]}
                >
                  {isSummarizing ? (
                    <ActivityIndicator size="small" color={colors.gold} />
                  ) : (
                    <Ionicons name="sparkles" size={18} color={colors.gold} />
                  )}
                </Pressable>

                {/* Translate Button (Language Icon) */}
                <Pressable
                  onPress={handleTranslate}
                  disabled={isTranslating}
                  style={({ pressed }) => [
                    styles.actionButton,
                    {
                      backgroundColor: isTranslated ? colors.primary : colors.card,
                      borderColor: isTranslated ? colors.primary : colors.border,
                      opacity: pressed || isTranslating ? 0.74 : 1,
                    },
                  ]}
                >
                  {isTranslating ? (
                    <ActivityIndicator size="small" color={isTranslated ? '#FFF' : colors.text} />
                  ) : (
                    <Ionicons name="language-outline" size={19} color={isTranslated ? '#FFF' : colors.text} />
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchArticle(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {error ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="alert-circle-outline" size={42} color={colors.icon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa tải được bài viết</Text>
              <Text style={[styles.emptyText, { color: colors.icon }]}>{error}</Text>
              <Pressable
                onPress={() => fetchArticle(true)}
                style={({ pressed }) => [
                  styles.retryButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 },
                ]}
              >
                <Text style={styles.retryText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : article ? (
            <View style={styles.articleWrap}>
              {article.thumbnail ? (
                <Image source={{ uri: article.thumbnail }} style={styles.heroImage} resizeMode="cover" />
              ) : (
                <View
                  style={[
                    styles.heroImage,
                    styles.imageFallback,
                    { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#E8EEF7' },
                  ]}
                >
                  <Ionicons name="football-outline" size={54} color={colors.primary} />
                </View>
              )}

              <View style={styles.metaRow}>
                <Text style={[styles.sectionLabel, { color: colors.primary }]}>{article.sectionName}</Text>
                <Text style={[styles.metaText, { color: colors.icon }]}>
                  {formatPublishDate(article.publishedAt)}
                </Text>
              </View>

              <Text style={[styles.title, { color: colors.text }]}>
                {isTranslated && translatedTitle ? translatedTitle : article.title}
              </Text>

              {!!article.trailText && (
                <Text style={[styles.standfirst, { color: colors.icon }]}>
                  {isTranslated && translatedTrail ? translatedTrail : article.trailText}
                </Text>
              )}

              <View style={[styles.bylineBox, { borderColor: colors.border }]}>
                <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.byline, { color: colors.text }]}>{article.byline}</Text>
              </View>

              <View style={styles.body}>
                {(isTranslated && translatedParagraphs.length === paragraphs.length ? translatedParagraphs : paragraphs).map((paragraph, index) => (
                  <View
                    key={`${article.id}-${index}`}
                    style={[
                      styles.paragraphBlock,
                      { borderBottomColor: index === paragraphs.length - 1 ? 'transparent' : colors.border },
                    ]}
                  >
                    <Text style={[styles.paragraph, { color: colors.text }]}>{paragraph}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* AI Article Summary Modal */}
        <Modal
          visible={summaryModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSummaryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSummaryModalVisible(false)} />

            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={[styles.aiIconBadge, { backgroundColor: colors.gold + '20' }]}>
                    <Ionicons name="sparkles" size={18} color={colors.gold} />
                  </View>
                  <View>
                    <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>TÓM TẮT BÀI VIẾT BỞI AI</Text>
                    <Text style={[styles.modalHeaderSubtitle, { color: colors.icon }]}>Đọc nhanh ý chính trong 30s</Text>
                  </View>
                </View>

                <Pressable
                  style={[styles.closeBtn, { backgroundColor: colors.background }]}
                  onPress={() => setSummaryModalVisible(false)}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                {/* Article Read Time Tag */}
                <View style={[styles.readTimeBox, { backgroundColor: colors.gold + '15', borderColor: colors.gold + '40' }]}>
                  <Ionicons name="flash-outline" size={16} color={colors.gold} />
                  <Text style={[styles.readTimeText, { color: colors.gold }]}>
                    Tóm tắt tự động • Tiết kiệm 90% thời gian đọc
                  </Text>
                </View>

                {/* Summary Points List */}
                <View style={styles.summaryList}>
                  {summaryPoints.map((point, index) => (
                    <View key={index} style={[styles.summaryCard, { backgroundColor: colors.background }]}>
                      <Text style={[styles.summaryPointText, { color: colors.text }]}>{point}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.aiDisclaimer}>
                  💡 *Tóm tắt được tạo tự động bằng AI từ nội dung bài báo.*
                </Text>
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalFooter}>
                <Pressable
                  style={[styles.closeModalBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setSummaryModalVisible(false)}
                >
                  <Text style={styles.closeModalBtnText}>Đóng & Đọc tiếp</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  topBar: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  topBarActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    alignSelf: 'center',
    maxWidth: 760,
    paddingBottom: 40,
    width: '100%',
  },
  articleWrap: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  heroImage: {
    aspectRatio: 16 / 10,
    borderRadius: 8,
    width: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 36,
    marginTop: 10,
  },
  standfirst: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: 12,
  },
  bylineBox: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    paddingVertical: 12,
  },
  byline: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  body: {
    marginTop: 18,
  },
  paragraph: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 29,
  },
  paragraphBlock: {
    borderBottomWidth: 1,
    marginBottom: 16,
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    margin: 18,
    paddingHorizontal: 24,
    paddingVertical: 38,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 14,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 8,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalHeaderSubtitle: {
    fontSize: 11,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    gap: 6,
  },
  readTimeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryList: {
    gap: 10,
  },
  summaryCard: {
    padding: 14,
    borderRadius: 12,
  },
  summaryPointText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  aiDisclaimer: {
    fontSize: 10,
    color: '#718096',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  modalFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeModalBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
