import React, { useState, useEffect, useMemo } from 'react';
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
import { useFavorites } from '@/hooks/use-favorites';
import playersData from '@/assets/data/players.json';

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
  const [aiModalMatch, setAiModalMatch] = useState<ClientMatch | null>(null);

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

  const { favorites } = useFavorites();

  const favoritePlayersList = useMemo(() => {
    return (playersData as any[]).filter(p => favorites.includes(p.idPlayer));
  }, [favorites]);

  const getFavoritePlayerForMatch = (match: ClientMatch) => {
    const h = (match.homeTeamName || '').toLowerCase();
    const a = (match.awayTeamName || '').toLowerCase();
    return favoritePlayersList.find(p => {
      const t = (p.team || '').toLowerCase();
      const nat = (p.nationality || '').toLowerCase();
      return (t && (h.includes(t) || a.includes(t))) || (nat && (h.includes(nat) || a.includes(nat)));
    });
  };

  // Hook query parameters are computed dynamically based on the active tab
  const { allMatches, groupedMatches, loading, refreshing, refresh } = useMatches(
    activeTab === 'bracket' ? '50' : (selectedLeagueId === 'favorites' ? 'all' : selectedLeagueId),
    activeTab === 'bracket' ? 'all' : statusFilter
  );

  const filteredGroupedMatches = useMemo(() => {
    if (selectedLeagueId === 'favorites') {
      const matchedGroups: typeof groupedMatches = [];
      groupedMatches.forEach(group => {
        const matchesWithFav = group.matches.filter(m => !!getFavoritePlayerForMatch(m));
        if (matchesWithFav.length > 0) {
          matchedGroups.push({
            ...group,
            matches: matchesWithFav
          });
        }
      });
      return matchedGroups;
    }
    return groupedMatches;
  }, [selectedLeagueId, groupedMatches, favoritePlayersList]);

  const getAiPredictionData = (match: ClientMatch) => {
    const charCodeSum = match.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const confidence = Math.round(68 + (charCodeSum % 22));
    const homeWinProb = Math.round(42 + (charCodeSum % 20));
    const awayWinProb = Math.round(22 + ((charCodeSum + 12) % 20));
    const drawProb = Math.max(10, 100 - homeWinProb - awayWinProb);
    const predictedWinner = homeWinProb >= awayWinProb ? match.homeTeamName : match.awayTeamName;
    const predictedScore = homeWinProb >= awayWinProb ? '2 - 1' : '1 - 2';

    return {
      confidence,
      homeWinProb,
      drawProb,
      awayWinProb,
      predictedWinner,
      predictedScore,
      keyFactors: [
        `⚡ Phong độ: ${match.homeTeamName} có hiệu suất ghi bàn tốt ở các trận gần đây.`,
        `🛡️ Phòng ngự: ${match.awayTeamName} duy trì cự ly đội hình kỷ luật.`,
        `⚔️ Lịch sử đối đầu: Trận đấu luôn diễn ra vô cùng gay kịch.`,
        `🧠 Đội hình: ${predictedWinner} nhỉnh hơn 6% ở tỷ lệ kiểm soát tuyến giữa.`
      ]
    };
  };

  const getAiPrediction = (match: ClientMatch): string => {
    const data = getAiPredictionData(match);
    return `${data.confidence}% AI dự đoán: ${data.predictedWinner} thắng`;
  };

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

                <TouchableOpacity
                  style={[
                    styles.leagueTab,
                    {
                      backgroundColor: selectedLeagueId === 'favorites' ? '#F59E0B' : colors.card,
                      borderColor: selectedLeagueId === 'favorites' ? '#F59E0B' : colors.border,
                    }
                  ]}
                  onPress={() => setSelectedLeagueId('favorites')}
                >
                  <Ionicons name="star" size={14} color={selectedLeagueId === 'favorites' ? '#FFF' : '#F59E0B'} style={{ marginRight: 4 }} />
                  <ThemedText style={[styles.leagueTextTab, selectedLeagueId === 'favorites' && { color: '#FFFFFF', fontWeight: 'bold' }]}>Cầu thủ yêu thích</ThemedText>
                </TouchableOpacity>

                {leagues.map((league) => {
                  const lId = league.league_id || league.id;
                  const lName = league.league_name || league.name || 'Giải đấu';
                  const lImg = league.league_image || league.logo || league.badge;
                  const isActive = String(selectedLeagueId) === String(lId) || 
                    (String(selectedLeagueId).toLowerCase().includes('saudi') && String(lId).toLowerCase().includes('saudi'));
                  return (
                    <TouchableOpacity
                      key={String(lId)}
                      style={[
                        styles.leagueTab,
                        {
                          backgroundColor: isActive ? colors.primary : colors.card,
                          borderColor: isActive ? colors.primary : colors.border,
                        }
                      ]}
                      onPress={() => setSelectedLeagueId(lId)}
                    >
                      {lImg ? (
                        <Image source={{ uri: lImg }} style={styles.leagueIcon} />
                      ) : null}
                      <ThemedText
                        style={[
                          styles.leagueTextTab,
                          isActive && { color: '#FFFFFF', fontWeight: 'bold' }
                        ]}
                      >
                        {lName}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : selectedLeagueId === 'favorites' && favorites.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="star-outline" size={48} color="#F59E0B" />
                <ThemedText style={[styles.emptyText, { marginTop: 12 }]}>Bạn chưa có cầu thủ yêu thích nào</ThemedText>
                <ThemedText style={{ color: '#718096', fontSize: 13, textAlign: 'center', marginHorizontal: 32, marginTop: 6 }}>
                  Hãy chọn cầu thủ yêu thích (thả tim) để AI tự động lọc trận đấu các cầu thủ đó ra sân!
                </ThemedText>
                <TouchableOpacity
                  style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 16 }}
                  onPress={() => router.push('/players' as any)}
                >
                  <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Khám phá Cầu thủ ngay</ThemedText>
                </TouchableOpacity>
              </View>
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
                    const favPlayer = getFavoritePlayerForMatch(match);

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

                          {/* Favorite Player AI Banner */}
                          {favPlayer && (
                            <View style={{ backgroundColor: '#F59E0B15', borderColor: '#F59E0B40', borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="sparkles" size={13} color="#F59E0B" style={{ marginRight: 6 }} />
                              <ThemedText style={{ fontSize: 12, color: '#F59E0B', fontWeight: 'bold' }}>
                                AI Quét: {favPlayer.name} ({favPlayer.team || favPlayer.nationality}) ra sân
                              </ThemedText>
                            </View>
                          )}

                          {/* AI Recommendation Badge - Sleek & Compact */}
                          <TouchableOpacity
                            style={[styles.aiBadge, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '25', borderWidth: 1 }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              setAiModalMatch(match);
                            }}
                          >
                            <View style={styles.aiBadgeLeft}>
                              <Ionicons size={14} name="sparkles" color={colors.primary} />
                              <ThemedText style={[styles.aiText, { color: colors.primary }]} numberOfLines={1}>
                                {getAiPrediction(match)}
                              </ThemedText>
                            </View>
                            <View style={[styles.aiBadgeBtn, { backgroundColor: colors.primary }]}>
                              <ThemedText style={styles.aiBadgeBtnText}>Chi tiết</ThemedText>
                              <Ionicons name="chevron-forward" size={10} color="#FFFFFF" />
                            </View>
                          </TouchableOpacity>
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

      {/* AI Match Analysis Detailed Modal */}
      {aiModalMatch && (() => {
        const aiData = getAiPredictionData(aiModalMatch);
        return (
          <Modal
            visible={!!aiModalMatch}
            transparent
            animationType="fade"
            onRequestClose={() => setAiModalMatch(null)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity style={styles.modalBackdrop} onPress={() => setAiModalMatch(null)} />

              <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="sparkles" size={18} color={colors.primary} />
                    </View>
                    <View>
                      <ThemedText style={{ fontSize: 15, fontWeight: '900' }}>PHÂN TÍCH CHI TIẾT AI</ThemedText>
                      <ThemedText style={{ fontSize: 11, color: '#A0AEC0' }}>Dự đoán kết quả & Chỉ số</ThemedText>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setAiModalMatch(null)}
                  >
                    <Ionicons name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                  {/* Match Info Box */}
                  <View style={{ alignItems: 'center', padding: 16, backgroundColor: colors.background, borderRadius: 16, marginBottom: 16 }}>
                    <ThemedText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' }}>
                      {aiModalMatch.homeTeamName} <ThemedText style={{ color: colors.primary }}>VS</ThemedText> {aiModalMatch.awayTeamName}
                    </ThemedText>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.primary }}>
                      <ThemedText style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                        Dự đoán tỷ số: {aiData.predictedScore}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Confidence Bar */}
                  <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.success, backgroundColor: colors.success + '15', padding: 14, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <ThemedText style={{ fontSize: 11, fontWeight: '800', color: colors.success }}>
                        ĐỘ TIN CẬY DỰ ĐOÁN
                      </ThemedText>
                      <ThemedText style={{ fontSize: 16, fontWeight: '900', color: colors.success }}>
                        {aiData.confidence}%
                      </ThemedText>
                    </View>
                    <View style={{ height: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${aiData.confidence}%`, backgroundColor: colors.success, borderRadius: 4 }} />
                    </View>
                  </View>

                  {/* Win Probability Bar */}
                  <View style={{ marginBottom: 18 }}>
                    <ThemedText style={{ fontSize: 13, fontWeight: '800', marginBottom: 10 }}>🎯 Xác suất kết quả trận đấu</ThemedText>
                    
                    <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
                      <View style={{ flex: aiData.homeWinProb, backgroundColor: '#3B82F6' }} />
                      <View style={{ flex: aiData.drawProb, backgroundColor: '#9CA3AF' }} />
                      <View style={{ flex: aiData.awayWinProb, backgroundColor: '#EF4444' }} />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' }} />
                        <ThemedText style={{ fontSize: 12 }}>{aiModalMatch.homeTeamName}: <ThemedText style={{ fontWeight: 'bold' }}>{aiData.homeWinProb}%</ThemedText></ThemedText>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' }} />
                        <ThemedText style={{ fontSize: 12 }}>Hòa: <ThemedText style={{ fontWeight: 'bold' }}>{aiData.drawProb}%</ThemedText></ThemedText>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                        <ThemedText style={{ fontSize: 12 }}>{aiModalMatch.awayTeamName}: <ThemedText style={{ fontWeight: 'bold' }}>{aiData.awayWinProb}%</ThemedText></ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Key Factors Analysis */}
                  <View style={{ marginBottom: 18 }}>
                    <ThemedText style={{ fontSize: 13, fontWeight: '800', marginBottom: 10 }}>🔍 Phân tích các yếu tố then chốt</ThemedText>
                    <View style={{ gap: 8 }}>
                      {aiData.keyFactors.map((factor, idx) => (
                        <View key={idx} style={{ padding: 12, borderRadius: 12, backgroundColor: colors.background }}>
                          <ThemedText style={{ fontSize: 12, lineHeight: 18 }}>{factor}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Disclaimer */}
                  <ThemedText style={{ fontSize: 10, color: '#718096', fontStyle: 'italic', textAlign: 'center', marginVertical: 8 }}>
                    💡 *Lưu ý: Phân tích bởi AI dựa trên số liệu mô phỏng. Thông tin mang tính tham khảo.*
                  </ThemedText>
                </ScrollView>

                {/* Footer */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.background }}
                    onPress={() => setAiModalMatch(null)}
                  >
                    <ThemedText style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Đóng</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 2, flexDirection: 'row', paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onPress={() => {
                      const matchId = aiModalMatch.id;
                      const tournamentId = aiModalMatch.tournamentId;
                      setAiModalMatch(null);
                      router.push({ pathname: '/match/[id]', params: { id: matchId, leagueId: tournamentId } });
                    }}
                  >
                    <ThemedText style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>Xem chi tiết trận</ThemedText>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        );
      })()}
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
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  aiBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  aiText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  aiBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
  aiBadgeBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
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
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
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
