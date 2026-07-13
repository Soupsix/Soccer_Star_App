import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert, 
  Platform, 
  ActivityIndicator, 
  Image, 
  Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useMatches } from '@/hooks/useMatches';
import { ClientMatch } from '@/types/match.types';
import { FootballDataService } from '@/services/footballData.service';

const { width } = Dimensions.get('window');

const STATUS_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Upcoming', label: 'Sắp diễn ra' },
  { id: 'Live', label: 'Trực tiếp' },
  { id: 'Finished', label: 'Đã kết thúc' }
];

export default function MatchesScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();

  // Tab State: fixtures vs bracket
  const [activeTab, setActiveTab] = useState<'fixtures' | 'bracket'>('fixtures');
  
  // Dynamic leagues state
  const [leagues, setLeagues] = useState<any[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | number>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Upcoming' | 'Live' | 'Finished'>('all');

  // Fetch leagues on mount
  useEffect(() => {
    async function loadLeagues() {
      try {
        const data = await FootballDataService.getLeagues();
        setLeagues(data || []);
      } catch (err) {
        console.error("Error loading leagues:", err);
      }
    }
    loadLeagues();
  }, []);

  // Hook query parameters are computed dynamically based on the active tab
  const { allMatches, groupedMatches, loading, refreshing, refresh } = useMatches(
    activeTab === 'bracket' ? '50' : selectedLeagueId,
    activeTab === 'bracket' ? 'all' : statusFilter
  );

  const getAiPrediction = (match: ClientMatch): string => {
    const charCodeSum = match.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const oddsA = 1.5 + (charCodeSum % 100) / 100 * 2.0;
    const oddsB = 1.5 + ((charCodeSum + 42) % 100) / 100 * 3.5;
    return `${Math.round(60 + (charCodeSum % 30))}% AI dự đoán: ${
      oddsA < oddsB ? `${match.homeTeamName} thắng` : `${match.awayTeamName} thắng`
    }`;
  };

  const filteredGroupedMatches = groupedMatches;

  // Render Bracket Screen View
  const renderBracket = () => {
    const wcMatches = allMatches.filter(m => m.tournamentId === '50');

    // Extract matches grouped by stage
    const getStageMatches = (stageName: string, count: number): (ClientMatch | null)[] => {
      const filtered = wcMatches.filter(m => m.stage && String(m.stage).toLowerCase() === stageName.toLowerCase());
      const res: (ClientMatch | null)[] = [...filtered];
      while (res.length < count) {
        res.push(null); // Placeholders
      }
      return res.slice(0, count);
    };

    const roundOf16 = getStageMatches('Round of 16', 8);
    const quarterFinals = getStageMatches('Quarter Final', 4);
    const semiFinals = getStageMatches('Semi Final', 2);
    const finalMatch = getStageMatches('Final', 1);

    const renderBracketCard = (match: ClientMatch | null, roundIndex: number, matchIndex: number) => {
      if (!match) {
        return (
          <View key={`placeholder-${roundIndex}-${matchIndex}`} style={[styles.bracketCard, styles.placeholderCard, { borderColor: colors.border }]}>
            <ThemedText style={styles.placeholderText}>TBD vs TBD</ThemedText>
            <ThemedText style={styles.placeholderSub}>Thắng vòng trước</ThemedText>
          </View>
        );
      }

      const isHomeWinner = match.status === 'FT' && (match.homeScore ?? 0) > (match.awayScore ?? 0);
      const isAwayWinner = match.status === 'FT' && (match.awayScore ?? 0) > (match.homeScore ?? 0);

      return (
        <TouchableOpacity
          key={match.id}
          style={[styles.bracketCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push({ pathname: '/match/[id]', params: { id: match.id, leagueId: match.tournamentId } })}
        >
          {/* Home team */}
          <View style={styles.bracketTeamRow}>
            {match.homeTeamLogo ? (
              <Image source={{ uri: match.homeTeamLogo }} style={styles.bracketTeamLogo} />
            ) : (
              <View style={[styles.bracketTeamInitialBg, { backgroundColor: colors.background }]}>
                <ThemedText style={styles.bracketTeamInitial}>{match.homeTeamName.charAt(0)}</ThemedText>
              </View>
            )}
            <ThemedText style={[styles.bracketTeamName, isHomeWinner && styles.winnerHighlight]} numberOfLines={1}>
              {match.homeTeamName}
            </ThemedText>
            {match.status !== 'Scheduled' && (
              <ThemedText style={[styles.bracketScore, isHomeWinner && styles.winnerHighlight]}>{match.homeScore}</ThemedText>
            )}
          </View>

          {/* Away team */}
          <View style={styles.bracketTeamRow}>
            {match.awayTeamLogo ? (
              <Image source={{ uri: match.awayTeamLogo }} style={styles.bracketTeamLogo} />
            ) : (
              <View style={[styles.bracketTeamInitialBg, { backgroundColor: colors.background }]}>
                <ThemedText style={styles.bracketTeamInitial}>{match.awayTeamName.charAt(0)}</ThemedText>
              </View>
            )}
            <ThemedText style={[styles.bracketTeamName, isAwayWinner && styles.winnerHighlight]} numberOfLines={1}>
              {match.awayTeamName}
            </ThemedText>
            {match.status !== 'Scheduled' && (
              <ThemedText style={[styles.bracketScore, isAwayWinner && styles.winnerHighlight]}>{match.awayScore}</ThemedText>
            )}
          </View>

          {/* Status details footer */}
          <View style={styles.bracketFooter}>
            <ThemedText style={styles.bracketKickoff}>{match.kickoff} ({match.date.slice(5)})</ThemedText>
            <ThemedText style={styles.bracketStatus}>{match.status}</ThemedText>
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bracketScrollContent}>
        {/* Vòng 1/8 */}
        <View style={styles.bracketColumn}>
          <ThemedText style={styles.bracketColumnTitle}>VÒNG 1/8</ThemedText>
          <View style={styles.bracketColumnCards}>
            {roundOf16.map((m, idx) => renderBracketCard(m, 1, idx))}
          </View>
        </View>

        {/* Tứ kết */}
        <View style={styles.bracketColumn}>
          <ThemedText style={styles.bracketColumnTitle}>TỨ KẾT</ThemedText>
          <View style={[styles.bracketColumnCards, { justifyContent: 'space-around' }]}>
            {quarterFinals.map((m, idx) => (
              <View key={`qf-wrapper-${idx}`} style={{ marginVertical: 32 }}>
                {renderBracketCard(m, 2, idx)}
              </View>
            ))}
          </View>
        </View>

        {/* Bán kết */}
        <View style={styles.bracketColumn}>
          <ThemedText style={styles.bracketColumnTitle}>BÁN KẾT</ThemedText>
          <View style={[styles.bracketColumnCards, { justifyContent: 'space-around' }]}>
            {semiFinals.map((m, idx) => (
              <View key={`sf-wrapper-${idx}`} style={{ marginVertical: 120 }}>
                {renderBracketCard(m, 3, idx)}
              </View>
            ))}
          </View>
        </View>

        {/* Chung kết */}
        <View style={styles.bracketColumn}>
          <ThemedText style={styles.bracketColumnTitle}>CHUNG KẾT</ThemedText>
          <View style={[styles.bracketColumnCards, { justifyContent: 'center' }]}>
            <View style={{ marginVertical: 240 }}>
              {renderBracketCard(finalMatch[0], 4, 0)}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Title */}
        <View style={styles.header}>
          <ThemedText type="title">Lịch Đấu & Dự Đoán</ThemedText>
          <ThemedText style={{ color: '#A0AEC0', marginTop: 4 }}>Xem lịch thi đấu và thông tin chi tiết các trận đấu</ThemedText>
        </View>

        {/* Segmented Button (Fixtures vs Bracket) */}
        <View style={[styles.segmentsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'fixtures' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('fixtures')}
          >
            <ThemedText style={[styles.segmentBtnText, activeTab === 'fixtures' && { color: '#FFFFFF', fontWeight: 'bold' }]}>Lịch đấu</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'bracket' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('bracket')}
          >
            <ThemedText style={[styles.segmentBtnText, activeTab === 'bracket' && { color: '#FFFFFF', fontWeight: 'bold' }]}>Nhánh đấu (Bracket)</ThemedText>
          </TouchableOpacity>
        </View>

        {/* If Active Tab is Fixtures, render grouped list */}
        {activeTab === 'fixtures' ? (
          <View>
            {/* Status Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {STATUS_FILTERS.map((filter) => {
                const isActive = statusFilter === filter.id;
                return (
                  <TouchableOpacity
                    key={filter.id}
                    style={[
                      styles.categoryTab,
                      {
                        backgroundColor: isActive ? colors.primary : colors.card,
                        borderColor: isActive ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setStatusFilter(filter.id as any)}
                  >
                    <ThemedText
                      style={[
                        styles.categoryText,
                        isActive && { color: '#FFFFFF', fontWeight: 'bold' }
                      ]}
                    >
                      {filter.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* League Selector (Dynamic) */}
            <View style={styles.leagueSelectorWrapper}>
              <ThemedText style={styles.filterSectionTitle}>Giải đấu</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.leaguesContainer}
                contentContainerStyle={styles.leaguesContent}
              >
                <TouchableOpacity
                  style={[
                    styles.leagueTab,
                    {
                      backgroundColor: selectedLeagueId === 'all' ? colors.primary : colors.card,
                      borderColor: selectedLeagueId === 'all' ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => setSelectedLeagueId('all')}
                >
                  <ThemedText style={[styles.leagueTextTab, selectedLeagueId === 'all' && { color: '#FFFFFF', fontWeight: 'bold' }]}>Tất cả các giải</ThemedText>
                </TouchableOpacity>

                {leagues.map((league) => {
                  const isActive = selectedLeagueId === league.league_id;
                  return (
                    <TouchableOpacity
                      key={league.league_id}
                      style={[
                        styles.leagueTab,
                        {
                          backgroundColor: isActive ? colors.primary : colors.card,
                          borderColor: isActive ? colors.primary : colors.border,
                        }
                      ]}
                      onPress={() => setSelectedLeagueId(league.league_id)}
                    >
                      {league.league_image && (
                        <Image source={{ uri: league.league_image }} style={styles.leagueIcon} />
                      )}
                      <ThemedText
                        style={[
                          styles.leagueTextTab,
                          isActive && { color: '#FFFFFF', fontWeight: 'bold' }
                        ]}
                      >
                        {league.league_name}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : filteredGroupedMatches.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="football-outline" size={48} color="#718096" />
                <ThemedText style={styles.emptyText}>Không tìm thấy lịch thi đấu nào</ThemedText>
              </View>
            ) : (
              filteredGroupedMatches.map((group) => (
                <View key={group.tournamentId} style={styles.tournamentGroup}>
                  {/* Tournament Header */}
                  <View style={styles.tournamentHeader}>
                    <ThemedText style={styles.tournamentTitle}>{group.tournamentName.toUpperCase()}</ThemedText>
                    <View style={[styles.badgeLine, { backgroundColor: colors.primary }]} />
                  </View>

                  {group.matches.map((match) => {
                    const isLive = match.status.toLowerCase().includes('live');
                    const isFT = match.status === 'FT';

                    return (
                      <View key={match.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {/* Match Detail Trigger Wrap */}
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => router.push({ pathname: '/match/[id]', params: { id: match.id, leagueId: match.tournamentId } })}
                        >
                          {/* Card Header */}
                          <View style={styles.cardHeader}>
                            <ThemedText style={styles.leagueText}>{match.stage}</ThemedText>
                            {isLive ? (
                              <View style={[styles.liveBadge, { backgroundColor: colors.success + '20' }]}>
                                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                                <ThemedText style={[styles.liveText, { color: colors.success }]}>LIVE {match.minute ? `'${match.minute}` : ''}</ThemedText>
                              </View>
                            ) : (
                              <ThemedText style={styles.timeText}>
                                {isFT ? 'FULL TIME' : `${match.kickoff} • ${match.date}`}
                              </ThemedText>
                            )}
                          </View>

                          {/* Match Teams & Score */}
                          <View style={styles.matchTeams}>
                            <View style={styles.team}>
                              {match.homeTeamLogo ? (
                                <Image source={{ uri: match.homeTeamLogo }} style={styles.teamLogo} />
                              ) : (
                                <View style={[styles.teamIconBg, { backgroundColor: colors.background }]}>
                                  <ThemedText style={styles.teamInitial}>{match.homeTeamName.charAt(0)}</ThemedText>
                                </View>
                              )}
                              <ThemedText style={styles.teamName} numberOfLines={1}>{match.homeTeamName}</ThemedText>
                            </View>
                            
                            <View style={styles.scoreContainer}>
                              {match.status === 'Scheduled' ? (
                                <ThemedText style={styles.score}>vs</ThemedText>
                              ) : (
                                <ThemedText style={styles.score}>
                                  {match.homeScore ?? 0} - {match.awayScore ?? 0}
                                </ThemedText>
                              )}
                            </View>

                            <View style={styles.team}>
                              {match.awayTeamLogo ? (
                                <Image source={{ uri: match.awayTeamLogo }} style={styles.teamLogo} />
                              ) : (
                                <View style={[styles.teamIconBg, { backgroundColor: colors.background }]}>
                                  <ThemedText style={styles.teamInitial}>{match.awayTeamName.charAt(0)}</ThemedText>
                                </View>
                              )}
                              <ThemedText style={styles.teamName} numberOfLines={1}>{match.awayTeamName}</ThemedText>
                            </View>
                          </View>

                          {/* AI Recommendation */}
                          <View style={[styles.aiBadge, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons size={14} name="sparkles" color={colors.primary} />
                            <ThemedText style={[styles.aiText, { color: colors.primary }]} numberOfLines={1}>
                              {getAiPrediction(match)}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ))
            )}

          </View>
        ) : (
          /* Render Tournament Bracket View */
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            renderBracket()
          )
        )}

      </ScrollView>

      {/* Betting Modal Removed */}
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
    marginBottom: 20,
  },
  segmentsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0AEC0',
  },
  balanceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  balanceTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#A0AEC0',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  coinWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 6,
  },
  claimBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  claimBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#718096',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  tournamentGroup: {
    marginBottom: 24,
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 4,
  },
  tournamentTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  badgeLine: {
    height: 4,
    width: 24,
    borderRadius: 2,
    marginLeft: 8,
  },
  card: {
    borderRadius: 20,
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
    fontSize: 11,
    fontWeight: 'bold',
    color: '#A0AEC0',
    letterSpacing: 0.5,
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
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A0AEC0',
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
  teamLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  teamIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamInitial: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    width: '30%',
  },
  score: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  aiText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  oddsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  oddsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A0AEC0',
    marginBottom: 10,
    textAlign: 'center',
  },
  oddsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  oddsBtn: {
    width: '31%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  oddsLabel: {
    fontSize: 10,
    color: '#A0AEC0',
    marginBottom: 4,
    textAlign: 'center',
  },
  oddsValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    marginTop: 8,
  },
  modalMatchName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  selectionBadge: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputTitle: {
    fontSize: 13,
    color: '#A0AEC0',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickSelectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickBtn: {
    width: '18%',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  quickBtnText: {
    fontSize: 11,
    color: '#A0AEC0',
  },
  estWinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 16,
  },
  successDetailsCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  successDetailText: {
    fontSize: 14,
    marginVertical: 4,
  },
  successMessage: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  closeSuccessBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeSuccessBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    gap: 10,
    paddingRight: 24,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0AEC0',
  },
  
  // Bracket UI styles
  bracketScrollContent: {
    paddingVertical: 8,
  },
  bracketColumn: {
    width: width * 0.72,
    marginRight: 24,
  },
  bracketColumnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#718096',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  bracketColumnCards: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  bracketCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeholderCard: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    height: 85,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#718096',
  },
  placeholderSub: {
    fontSize: 10,
    color: '#A0AEC0',
    marginTop: 4,
  },
  bracketTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  bracketTeamLogo: {
    width: 24,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  bracketTeamInitialBg: {
    width: 24,
    height: 16,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bracketTeamInitial: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  bracketTeamName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  bracketScore: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  winnerHighlight: {
    color: '#22C55E',
    fontWeight: '800',
  },
  bracketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
  },
  bracketKickoff: {
    fontSize: 9,
    color: '#718096',
    fontWeight: '500',
  },
  bracketStatus: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#A0AEC0',
  },
  loadMoreBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  loadMoreBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  leagueSelectorWrapper: {
    marginTop: 8,
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A0AEC0',
    marginBottom: 8,
  },
  leaguesContainer: {
    flexDirection: 'row',
  },
  leaguesContent: {
    paddingRight: 24,
    gap: 8,
  },
  leagueTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  leagueTextTab: {
    fontSize: 12,
    fontWeight: '600',
  },
  leagueIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
