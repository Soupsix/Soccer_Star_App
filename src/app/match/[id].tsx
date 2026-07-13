import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MatchService } from '@/services/match.service';
import { ClientMatch } from '@/types/match.types';

const { width } = Dimensions.get('window');

interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  type: 'Goal' | 'Own Goal' | 'Yellow Card' | 'Red Card' | 'Penalty' | 'Missed Penalty' | 'VAR' | 'Substitution';
  teamId: string;
  playerId: string | null;
  description: string;
  createdAt: string;
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [match, setMatch] = useState<ClientMatch | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [matchData, eventsData] = await Promise.all([
          MatchService.getMatchById(id),
          MatchService.getMatchEvents(id)
        ]);
        setMatch(matchData);
        setEvents(eventsData);
      } catch (err) {
        console.error("Error loading match details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!match) {
    return (
      <ThemedView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF4D4F" />
        <ThemedText style={styles.errorText}>Không tìm thấy trận đấu</ThemedText>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <ThemedText style={styles.backBtnText}>Quay lại</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const isLive = match.status.toLowerCase().includes('live');
  const isFT = match.status === 'FT';

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border + '30' }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerLeague} numberOfLines={1}>{match.tournamentName.toUpperCase()}</ThemedText>
          <ThemedText style={styles.headerStage}>{match.stage} {match.group ? `• Bảng ${match.group}` : ''}</ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Core Match Card */}
        <View style={[styles.matchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.teamsRow}>
            {/* Home Team */}
            <View style={styles.team}>
              {match.homeTeamLogo ? (
                <Image source={{ uri: match.homeTeamLogo }} style={styles.teamLogo} />
              ) : (
                <View style={[styles.teamIconBg, { backgroundColor: colors.background }]}>
                  <ThemedText style={styles.teamInitial}>{match.homeTeamName.charAt(0)}</ThemedText>
                </View>
              )}
              <ThemedText style={styles.teamName}>{match.homeTeamName}</ThemedText>
            </View>

            {/* Score / Middle Column */}
            <View style={styles.scoreCol}>
              {match.status === 'Scheduled' ? (
                <View style={styles.timeBadge}>
                  <ThemedText style={styles.scheduledTime}>{match.kickoff}</ThemedText>
                  <ThemedText style={styles.scheduledDate}>{match.date}</ThemedText>
                </View>
              ) : (
                <View style={styles.scoreBadge}>
                  <ThemedText style={styles.scoreText}>
                    {match.homeScore ?? 0} - {match.awayScore ?? 0}
                  </ThemedText>
                  {match.penalty && (
                    <ThemedText style={styles.penaltyText}>
                      Pen: {match.penalty.home} - {match.penalty.away}
                    </ThemedText>
                  )}
                </View>
              )}

              {/* Status Badge */}
              {isLive ? (
                <View style={[styles.statusBadge, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
                  <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                  <ThemedText style={[styles.statusText, { color: colors.success }]}>LIVE {match.minute ? `'${match.minute}` : ''}</ThemedText>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                  <ThemedText style={styles.statusText}>{isFT ? 'FULL TIME' : match.status}</ThemedText>
                </View>
              )}
            </View>

            {/* Away Team */}
            <View style={styles.team}>
              {match.awayTeamLogo ? (
                <Image source={{ uri: match.awayTeamLogo }} style={styles.teamLogo} />
              ) : (
                <View style={[styles.teamIconBg, { backgroundColor: colors.background }]}>
                  <ThemedText style={styles.teamInitial}>{match.awayTeamName.charAt(0)}</ThemedText>
                </View>
              )}
              <ThemedText style={styles.teamName}>{match.awayTeamName}</ThemedText>
            </View>
          </View>

          {/* Stadium Details */}
          {match.stadiumName ? (
            <View style={[styles.stadiumRow, { borderTopColor: colors.border + '30' }]}>
              <Ionicons name="location-outline" size={14} color="#718096" />
              <ThemedText style={styles.stadiumText}>{match.stadiumName}</ThemedText>
            </View>
          ) : null}
        </View>

        {/* Timeline Events Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Diễn Biến Trận Đấu ⏱️</ThemedText>
          {events.length === 0 ? (
            <View style={[styles.emptyEvents, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="football-outline" size={32} color="#718096" style={{ marginBottom: 8 }} />
              <ThemedText style={{ color: '#718096', fontSize: 13 }}>Chưa có diễn biến nào được ghi nhận</ThemedText>
            </View>
          ) : (
            <View style={[styles.timeline, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {events.map((event, idx) => {
                const isHomeEvent = event.teamId === match.homeTeamId;
                
                let iconName: any = 'football';
                let iconColor = colors.text;
                if (event.type.includes('Yellow')) {
                  iconName = 'square';
                  iconColor = '#FFC107';
                } else if (event.type.includes('Red')) {
                  iconName = 'square';
                  iconColor = '#FF4D4F';
                } else if (event.type.includes('Substitution')) {
                  iconName = 'repeat';
                  iconColor = colors.primary;
                } else if (event.type.includes('Goal')) {
                  iconName = 'football';
                  iconColor = colors.success;
                }

                return (
                  <View key={event.id || idx} style={styles.timelineRow}>
                    {/* Left event (Home Team side) */}
                    <View style={styles.timelineSideCol}>
                      {isHomeEvent && (
                        <View style={styles.eventContentLeft}>
                          <ThemedText style={styles.eventDescription}>{event.description}</ThemedText>
                        </View>
                      )}
                    </View>

                    {/* Middle Line / Minute Indicator */}
                    <View style={styles.timelineCenterCol}>
                      <View style={[styles.timelineDotBg, { backgroundColor: colors.background }]}>
                        <Ionicons name={iconName} size={12} color={iconColor} />
                      </View>
                      <ThemedText style={styles.eventMinute}>{`${event.minute}'`}</ThemedText>
                    </View>

                    {/* Right event (Away Team side) */}
                    <View style={styles.timelineSideCol}>
                      {!isHomeEvent && (
                        <View style={styles.eventContentRight}>
                          <ThemedText style={styles.eventDescription}>{event.description}</ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 24,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerLeague: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerStage: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
  },
  matchCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  teamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  team: {
    alignItems: 'center',
    width: '35%',
  },
  teamLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  teamIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamInitial: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreCol: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadge: {
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
  },
  penaltyText: {
    fontSize: 10,
    color: '#718096',
    fontWeight: 'bold',
    marginTop: 2,
  },
  timeBadge: {
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduledTime: {
    fontSize: 22,
    fontWeight: '800',
  },
  scheduledDate: {
    fontSize: 10,
    color: '#A0AEC0',
    fontWeight: '700',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  stadiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 16,
  },
  stadiumText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 6,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyEvents: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeline: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
  },
  timelineSideCol: {
    flex: 1,
    paddingHorizontal: 16,
  },
  timelineCenterCol: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  eventMinute: {
    fontSize: 10,
    color: '#718096',
    fontWeight: '700',
    marginTop: 4,
  },
  eventContentLeft: {
    alignItems: 'flex-end',
  },
  eventContentRight: {
    alignItems: 'flex-start',
  },
  eventDescription: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
