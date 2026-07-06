import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

import { HomeMatch } from '../types/home.types';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface Props {
  matches: HomeMatch[];
}

export default function TodayMatchesSection({ matches }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  if (matches.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Trận Đấu Hôm Nay 📅</ThemedText>
      </View>

      <View style={styles.listContainer}>
        {matches.map((match) => (
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
            {/* Top Row: Tournament & Status */}
            <View style={styles.topRow}>
              <ThemedText style={styles.tournamentName}>{match.tournament.toUpperCase()}</ThemedText>
              {match.status.toLowerCase().includes('live') ? (
                <View style={[styles.liveBadge, { backgroundColor: colors.success + '20' }]}>
                  <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                  <ThemedText style={[styles.liveText, { color: colors.success }]}>TRỰC TIẾP</ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.statusText}>{match.status}</ThemedText>
              )}
            </View>

            {/* Teams & Score / Time */}
            <View style={styles.matchDetail}>
              {/* Home Team */}
              <View style={styles.team}>
                {match.homeLogo ? (
                  <Image source={{ uri: match.homeLogo }} style={styles.todayTeamLogo} />
                ) : (
                  <View style={[styles.teamInitialBg, { backgroundColor: colors.background }]}>
                    <ThemedText style={styles.initialText}>{match.homeTeam.charAt(0)}</ThemedText>
                  </View>
                )}
                <ThemedText style={styles.teamName} numberOfLines={1}>{match.homeTeam}</ThemedText>
              </View>

              {/* Time Indicator */}
              <View style={styles.midCol}>
                <ThemedText style={[styles.timeText, { color: colors.primary }]}>{match.kickoff}</ThemedText>
                <ThemedText style={styles.vsText}>VS</ThemedText>
              </View>

              {/* Away Team */}
              <View style={styles.team}>
                {match.awayLogo ? (
                  <Image source={{ uri: match.awayLogo }} style={styles.todayTeamLogo} />
                ) : (
                  <View style={[styles.teamInitialBg, { backgroundColor: colors.background }]}>
                    <ThemedText style={styles.initialText}>{match.awayTeam.charAt(0)}</ThemedText>
                  </View>
                )}
                <ThemedText style={styles.teamName} numberOfLines={1}>{match.awayTeam}</ThemedText>
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
    gap: 12,
  },
  item: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tournamentName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0AEC0',
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  liveText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  matchDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%',
  },
  teamInitialBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  todayTeamLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    resizeMode: 'contain',
  },
  initialText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  midCol: {
    alignItems: 'center',
    width: '20%',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  vsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0AEC0',
  },
});
