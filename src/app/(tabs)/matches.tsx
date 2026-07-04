import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function MatchesScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title">Lịch Đấu</ThemedText>
          <ThemedText style={{ color: '#A0AEC0' }}>Theo dõi các trận đấu hôm nay và sắp tới</ThemedText>
        </View>

        {/* Placeholder Live Match Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.leagueText}>CHAMPIONS LEAGUE</ThemedText>
            <View style={[styles.liveBadge, { backgroundColor: colors.success + '20' }]}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <ThemedText style={[styles.liveText, { color: colors.success }]}>TRỰC TIẾP</ThemedText>
            </View>
          </View>

          <View style={styles.matchTeams}>
            <View style={styles.team}>
              <IconSymbol size={32} name="house.fill" color={colors.text} />
              <ThemedText style={styles.teamName}>Real Madrid</ThemedText>
            </View>
            <View style={styles.scoreContainer}>
              <ThemedText style={styles.score}>2 - 1</ThemedText>
              <ThemedText style={styles.time}>{"75'"}</ThemedText>
            </View>
            <View style={styles.team}>
              <IconSymbol size={32} name="house.fill" color={colors.text} />
              <ThemedText style={styles.teamName}>Man City</ThemedText>
            </View>
          </View>

          <View style={[styles.aiBadge, { backgroundColor: colors.primary + '10' }]}>
            <IconSymbol size={16} name="paperplane.fill" color={colors.primary} />
            <ThemedText style={[styles.aiText, { color: colors.primary }]}>
              89% AI dự đoán: Trên 2.5 bàn thắng
            </ThemedText>
          </View>
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
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  leagueText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A0AEC0',
    letterSpacing: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  matchTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  team: {
    alignItems: 'center',
    width: '35%',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    width: '30%',
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 4,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
  },
  aiText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});
