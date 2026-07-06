import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { HomeMatch } from '../types/home.types';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface Props {
  matches: HomeMatch[];
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export default function HotMatchesSection({ matches }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  if (matches.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Trận Đấu Hot 🔥</ThemedText>
        <TouchableOpacity onPress={() => router.push('/(tabs)/matches')}>
          <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Tất cả</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 16}
      >
        {matches.map((match) => (
          <TouchableOpacity
            key={match.id}
            activeOpacity={0.9}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary + '30',
                shadowColor: colors.primary,
              }
            ]}
            onPress={() => router.push('/(tabs)/matches')}
          >
            {/* Header: Tournament + Hot Badge */}
            <View style={styles.cardHeader}>
              <ThemedText style={styles.leagueText} numberOfLines={1}>{match.tournament.toUpperCase()}</ThemedText>
              <View style={[styles.hotBadge, { backgroundColor: '#FF4D4F' + '20' }]}>
                <Ionicons name="flame" size={10} color="#FF4D4F" />
                <ThemedText style={styles.hotBadgeText}>HOT</ThemedText>
              </View>
            </View>

            {/* Teams Grid */}
            <View style={styles.teamsContainer}>
              <View style={styles.teamRow}>
                {match.homeLogo ? (
                  <Image source={{ uri: match.homeLogo }} style={styles.teamLogo} />
                ) : (
                  <View style={[styles.teamIconBg, { backgroundColor: colors.background }]}>
                    <ThemedText style={styles.teamInitial}>{match.homeTeam.charAt(0)}</ThemedText>
                  </View>
                )}
                <ThemedText style={styles.teamName} numberOfLines={1}>{match.homeTeam}</ThemedText>
              </View>
              
              <View style={styles.vsContainer}>
                <ThemedText style={styles.vsText}>VS</ThemedText>
              </View>

              <View style={styles.teamRow}>
                {match.awayLogo ? (
                  <Image source={{ uri: match.awayLogo }} style={styles.teamLogo} />
                ) : (
                  <View style={[styles.teamIconBg, { backgroundColor: colors.background }]}>
                    <ThemedText style={styles.teamInitial}>{match.awayTeam.charAt(0)}</ThemedText>
                  </View>
                )}
                <ThemedText style={styles.teamName} numberOfLines={1}>{match.awayTeam}</ThemedText>
              </View>
            </View>

            {/* Footer: Match status & kickoff */}
            <View style={[styles.cardFooter, { borderTopColor: colors.border + '50' }]}>
              <View style={styles.statusRow}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: match.status.toLowerCase().includes('live') ? colors.success : '#A0AEC0' }
                ]} />
                <ThemedText style={styles.statusText}>{match.status}</ThemedText>
              </View>
              <ThemedText style={[styles.timeText, { color: colors.primary }]}>{match.kickoff}</ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginHorizontal: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leagueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0AEC0',
    letterSpacing: 0.5,
    maxWidth: '70%',
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FF4D4F',
    marginLeft: 2,
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%',
  },
  teamIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  teamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    resizeMode: 'contain',
  },
  teamInitial: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  vsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '20%',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#718096',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A0AEC0',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
