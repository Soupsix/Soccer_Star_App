import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { HomeMatch } from '../types/home.types';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface Props {
  matches: HomeMatch[];
}

export default function UpcomingMatchesSection({ matches }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  // Limit upcoming matches to a maximum of 5
  const displayedMatches = matches.slice(0, 5);

  if (displayedMatches.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Trận Đấu Sắp Tới 🚀</ThemedText>
      </View>

      <View style={styles.listContainer}>
        {displayedMatches.map((match) => (
          <TouchableOpacity
            key={match.id}
            activeOpacity={0.85}
            style={[
              styles.item,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              }
            ]}
            onPress={() => router.push('/(tabs)/matches')}
          >
            {/* Top Row: Tournament */}
            <View style={styles.topRow}>
              <ThemedText style={styles.tournamentName}>{match.tournament.toUpperCase()}</ThemedText>
              {match.isHot && (
                <View style={[styles.hotBadge, { backgroundColor: '#FF4D4F' + '15' }]}>
                  <ThemedText style={styles.hotText}>HOT</ThemedText>
                </View>
              )}
            </View>

            {/* Teams & Date */}
            <View style={styles.matchDetail}>
              <View style={styles.teamsCol}>
                <ThemedText style={styles.teamName}>{match.homeTeam}</ThemedText>
                <ThemedText style={styles.vsText}>vs</ThemedText>
                <ThemedText style={styles.teamName}>{match.awayTeam}</ThemedText>
              </View>

              <View style={[styles.dateCol, { backgroundColor: colors.background }]}>
                <ThemedText style={[styles.dateText, { color: colors.primary }]}>{match.kickoff}</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    gap: 10,
  },
  item: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tournamentName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0AEC0',
    letterSpacing: 0.5,
  },
  hotBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FF4D4F',
  },
  matchDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamsCol: {
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
  },
  vsText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#718096',
    marginVertical: 1,
    paddingLeft: 4,
  },
  dateCol: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
