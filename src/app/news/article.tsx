import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
          <View style={styles.topBarSpacer} />
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

              <Text style={[styles.title, { color: colors.text }]}>{article.title}</Text>

              {!!article.trailText && (
                <Text style={[styles.standfirst, { color: colors.icon }]}>{article.trailText}</Text>
              )}

              <View style={[styles.bylineBox, { borderColor: colors.border }]}>
                <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.byline, { color: colors.text }]}>{article.byline}</Text>
              </View>

              <View style={styles.body}>
                {paragraphs.map((paragraph, index) => (
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
  topBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  topBarSpacer: {
    width: 42,
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
});
