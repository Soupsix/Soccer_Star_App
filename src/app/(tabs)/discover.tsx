import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function DiscoverScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title">Khám Phá</ThemedText>
          <ThemedText style={{ color: '#A0AEC0' }}>Tin tức mới nhất và phân tích AI hàng đầu</ThemedText>
        </View>

        {/* AI Recommendations */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <IconSymbol size={24} name="paperplane.fill" color={colors.primary} />
            <ThemedText style={[styles.tag, { color: colors.primary }]}>AI RECOMMENDATION</ThemedText>
          </View>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Phân tích tỷ lệ thắng hôm nay
          </ThemedText>
          <ThemedText style={styles.cardDesc}>
            Dựa trên phong độ 5 trận gần nhất và lịch sử đối đầu, Real Madrid có tỷ lệ chiến thắng lên đến 72% trước Atletico Madrid.
          </ThemedText>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tag: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#A0AEC0',
    lineHeight: 20,
  },
});
