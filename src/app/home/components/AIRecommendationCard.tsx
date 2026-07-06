import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AIRecommendation } from '../types/home.types';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface Props {
  recommendation: AIRecommendation | null;
}

export default function AIRecommendationCard({ recommendation }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  if (!recommendation) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.primary + '12', borderColor: colors.primary }]}>
        {/* Header Badge */}
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: colors.gold }]}>
            <ThemedText style={styles.badgeText}>DỰ ĐOÁN HOT BỞI AI 🔥</ThemedText>
          </View>
          <View style={styles.confidenceContainer}>
            <ThemedText style={[styles.confidenceText, { color: colors.success }]}>
              Độ tin cậy: {recommendation.confidence}%
            </ThemedText>
          </View>
        </View>

        {/* Match Info */}
        <ThemedText type="subtitle" style={styles.matchTitle}>
          {recommendation.homeTeam} vs {recommendation.awayTeam}
        </ThemedText>

        {/* Reasoning */}
        <View style={styles.reasonContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} style={styles.quoteIcon} />
          <ThemedText style={styles.reasonText}>
            {recommendation.reason}
          </ThemedText>
        </View>

        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/matches')}
          >
            <ThemedText style={styles.actionBtnText}>Đặt cược trận này</ThemedText>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D1117',
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  quoteIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  reasonText: {
    fontSize: 13,
    color: '#A0AEC0',
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    alignItems: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
