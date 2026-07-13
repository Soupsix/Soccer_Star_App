import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { NewsService } from './services/news.service';
import { NewsArticle } from './types/news.types';

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

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const isCompact = width < 640;

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const latestArticles = await NewsService.getFootballNews();
      setArticles(latestArticles);
    } catch (err) {
      console.error('Error fetching football news:', err);
      setError('Không thể tải tin tức lúc này. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const onRefresh = useCallback(() => {
    fetchNews(true);
  }, [fetchNews]);

  const openArticle = useCallback((article: NewsArticle) => {
    router.push({
      pathname: '/news/article',
      params: { id: article.id },
    });
  }, [router]);

  const renderArticle = useCallback(
    ({ item, index }: { item: NewsArticle; index: number }) => {
      const isLead = index === 0;

      return (
        <Pressable
          onPress={() => openArticle(item)}
          style={({ pressed }) => [
            styles.articleCard,
            isLead && styles.leadCard,
            !isLead && isCompact && styles.compactCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.86 : 1,
            },
          ]}
        >
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              style={isLead || isCompact ? styles.leadImage : styles.articleImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                isLead || isCompact ? styles.leadImage : styles.articleImage,
                styles.imageFallback,
                { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#E8EEF7' },
              ]}
            >
              <Ionicons name="football-outline" size={isLead ? 52 : 34} color={colors.primary} />
            </View>
          )}

          <View style={styles.articleBody}>
            <View style={styles.metaRow}>
              <Text style={[styles.sectionLabel, { color: colors.primary }]}>{item.sectionName}</Text>
              <Text style={[styles.metaText, { color: colors.icon }]}>
                {formatPublishDate(item.publishedAt)}
              </Text>
            </View>

            <Text
              style={[
                isLead ? styles.leadTitle : styles.articleTitle,
                { color: colors.text },
              ]}
            >
              {item.title}
            </Text>

            {!!item.trailText && (
              <Text
                style={[isLead ? styles.leadSummary : styles.articleSummary, { color: colors.icon }]}
                numberOfLines={isLead ? 4 : 3}
              >
                {item.trailText}
              </Text>
            )}

            <View style={styles.footerRow}>
              <Text style={[styles.byline, { color: colors.icon }]} numberOfLines={1}>
                {item.byline}
              </Text>
              <View style={styles.readMore}>
                <Text style={[styles.readMoreText, { color: colors.primary }]}>Đọc bài</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [colorScheme, colors.border, colors.card, colors.icon, colors.primary, colors.text, isCompact, openArticle],
  );

  if (loading) {
    return (
      <ThemedView style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Đang tải tin bóng đá mới nhất...</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          renderItem={renderArticle}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.headerTextBlock}>
                <Text style={[styles.title, { color: colors.text }]}>Tin tức bóng đá mới nhất</Text>
                <Text style={[styles.subtitle, { color: colors.icon }]}>
                  Cập nhật liên tục các câu chuyện, bình luận và điểm tin bóng đá.
                </Text>
              </View>

              <Pressable
                onPress={onRefresh}
                style={({ pressed }) => [
                  styles.refreshButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <Ionicons name="refresh" size={18} color={colors.primary} />
              </Pressable>
            </View>
          }
          ListEmptyComponent={
            <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Ionicons name="newspaper-outline" size={42} color={colors.icon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {error ? 'Chưa tải được tin tức' : 'Chưa có tin tức'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                {error ?? 'Kéo xuống để làm mới danh sách bài viết.'}
              </Text>
              <Pressable onPress={onRefresh} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.retryText}>Thử lại</Text>
              </Pressable>
            </View>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    alignSelf: 'center',
    maxWidth: 1080,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 18,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTextBlock: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 680,
  },
  refreshButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  articleCard: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  leadCard: {
    flexDirection: 'column',
    marginBottom: 18,
  },
  compactCard: {
    flexDirection: 'column',
  },
  leadImage: {
    aspectRatio: 16 / 8,
    width: '100%',
  },
  articleImage: {
    aspectRatio: 1,
    minHeight: 142,
    width: 142,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleBody: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
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
  leadTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 34,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 24,
  },
  leadSummary: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: 10,
  },
  articleSummary: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 8,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 14,
  },
  byline: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  readMore: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
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
