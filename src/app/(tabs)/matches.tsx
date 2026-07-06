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

const { width } = Dimensions.get('window');
const COINS_CACHE_KEY = 'user_coins';

interface MatchWithOdds extends ClientMatch {
  odds: {
    teamA: { label: string; value: number };
    draw: { label: string; value: number };
    teamB: { label: string; value: number };
  };
  aiPrediction: string;
}

const CATEGORIES = [
  { id: 'all', label: 'Tất cả', leagueKey: '' },
  { id: 't_wc_2026', label: 'WC 2026', leagueKey: 'WORLD CUP' },
  { id: 't_ucl', label: 'Champion League', leagueKey: 'CHAMPIONS LEAGUE' },
  { id: 't_uel', label: 'Europa league', leagueKey: 'EUROPA LEAGUE' },
  { id: 't_bundesliga', label: 'Bulestiga', leagueKey: 'BULESTIGA' },
  { id: 't_epl', label: 'Premier League', leagueKey: 'PREMIER LEAGUE' }
];

export default function MatchesScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();

  // Tab State: fixtures vs bracket
  const [activeTab, setActiveTab] = useState<'fixtures' | 'bracket'>('fixtures');
  
  // Category state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Coin state
  const [coins, setCoins] = useState<number>(1250);

  // Firestore Hook
  const { allMatches, groupedMatches, loading, refreshing, refresh, hasMore, loadMore } = useMatches();

  // Betting modal state
  const [betModalVisible, setBetModalVisible] = useState<boolean>(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithOdds | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<'teamA' | 'draw' | 'teamB' | null>(null);
  const [betAmount, setBetAmount] = useState<string>('100');
  
  // Success state
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<{
    outcomeLabel: string;
    amount: number;
    winAmount: number;
  } | null>(null);

  // Load coins from cache
  useEffect(() => {
    const loadCoins = async () => {
      try {
        const cachedCoins = await AsyncStorage.getItem(COINS_CACHE_KEY);
        if (cachedCoins !== null) {
          setCoins(parseInt(cachedCoins, 10));
        } else {
          await AsyncStorage.setItem(COINS_CACHE_KEY, '1250');
        }
      } catch (error) {
        console.error('Lỗi khi đọc số dư coin:', error);
      }
    };
    loadCoins();
  }, []);

  // Save coins cache helper
  const saveCoins = async (amount: number) => {
    try {
      setCoins(amount);
      await AsyncStorage.setItem(COINS_CACHE_KEY, amount.toString());
    } catch (error) {
      console.error('Lỗi khi lưu số dư coin:', error);
    }
  };

  // Claim free coins for testing and fun
  const claimFreeCoins = () => {
    const newBalance = coins + 500;
    saveCoins(newBalance);
    if (Platform.OS === 'web') {
      window.alert('Bạn đã nhận thành công +500 Coins miễn phí! 🎉');
    } else {
      Alert.alert('Nhận Quà Hàng Ngày', 'Bạn đã nhận thành công +500 Coins miễn phí! 🎉');
    }
  };

  // Deterministically generate odds and predictions based on match ID
  const getOddsAndPrediction = (match: ClientMatch): MatchWithOdds => {
    const charCodeSum = match.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const oddsA = 1.5 + (charCodeSum % 100) / 100 * 2.0;
    const oddsB = 1.5 + ((charCodeSum + 42) % 100) / 100 * 3.5;
    const oddsDraw = 2.5 + ((charCodeSum + 84) % 100) / 100 * 1.5;

    return {
      ...match,
      odds: {
        teamA: { label: `${match.homeTeamName} thắng`, value: parseFloat(oddsA.toFixed(2)) },
        draw: { label: 'Hòa', value: parseFloat(oddsDraw.toFixed(2)) },
        teamB: { label: `${match.awayTeamName} thắng`, value: parseFloat(oddsB.toFixed(2)) }
      },
      aiPrediction: `${Math.round(60 + (charCodeSum % 30))}% AI dự đoán: ${
        oddsA < oddsB ? `${match.homeTeamName} thắng` : `${match.awayTeamName} thắng`
      }`
    };
  };

  const handleOpenBet = (match: ClientMatch, outcome: 'teamA' | 'draw' | 'teamB') => {
    const matchWithOdds = getOddsAndPrediction(match);
    setSelectedMatch(matchWithOdds);
    setSelectedOutcome(outcome);
    setBetAmount('100');
    setShowSuccess(false);
    setBetModalVisible(true);
  };

  const handlePlaceBet = () => {
    if (!selectedMatch || !selectedOutcome) return;

    const amount = parseInt(betAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      if (Platform.OS === 'web') {
        window.alert('Vui lòng nhập số coin cược hợp lệ.');
      } else {
        Alert.alert('Lỗi', 'Vui lòng nhập số coin cược hợp lệ.');
      }
      return;
    }

    if (amount > coins) {
      if (Platform.OS === 'web') {
        window.alert('Số dư tài khoản không đủ để đặt cược.');
      } else {
        Alert.alert('Lỗi', 'Số dư tài khoản không đủ để đặt cược.');
      }
      return;
    }

    const oddsObj = selectedMatch.odds[selectedOutcome];
    const winAmount = Math.round(amount * oddsObj.value);
    
    const newBalance = coins - amount;
    saveCoins(newBalance);

    setSuccessDetails({
      outcomeLabel: oddsObj.label,
      amount,
      winAmount
    });
    setShowSuccess(true);
  };

  const selectedOdds = selectedMatch && selectedOutcome ? selectedMatch.odds[selectedOutcome] : null;
  const calculatedWin = selectedOdds ? Math.round((parseInt(betAmount, 10) || 0) * selectedOdds.value) : 0;

  // Filter grouped matches by category
  const filteredGroupedMatches = groupedMatches.filter(group => {
    if (selectedCategory === 'all') return true;
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    if (!cat) return true;
    return group.tournamentName.toUpperCase().includes(cat.leagueKey);
  });

  // Render Bracket Screen View
  const renderBracket = () => {
    const wcMatches = allMatches.filter(m => m.tournamentId === 't_wc_2026');

    // Extract matches grouped by stage
    const getStageMatches = (stageName: string, count: number): (ClientMatch | null)[] => {
      const filtered = wcMatches.filter(m => m.stage.toLowerCase() === stageName.toLowerCase());
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
          onPress={() => router.push(`/match/${match.id}` as any)}
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
          <ThemedText style={{ color: '#A0AEC0', marginTop: 4 }}>Cá cược bằng Coin ảo trực tiếp từ danh sách trận đấu</ThemedText>
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

        {/* Coin Balance Bar */}
        <View style={[styles.balanceBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <ThemedText style={styles.balanceTitle}>SỐ DƯ CỦA BẠN</ThemedText>
            <View style={styles.coinWrapper}>
              <Ionicons size={22} name="cash-outline" color={colors.gold} />
              <ThemedText style={[styles.coinText, { color: colors.gold }]}>
                {coins.toLocaleString()} COINS
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.claimBtn, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
            onPress={claimFreeCoins}
          >
            <ThemedText style={[styles.claimBtnText, { color: colors.success }]}>Nhận +500</ThemedText>
          </TouchableOpacity>
        </View>

        {/* If Active Tab is Fixtures, render grouped list */}
        {activeTab === 'fixtures' ? (
          <View>
            {/* Category Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryTab,
                      {
                        backgroundColor: isActive ? colors.primary : colors.card,
                        borderColor: isActive ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <ThemedText
                      style={[
                        styles.categoryText,
                        isActive && { color: '#FFFFFF', fontWeight: 'bold' }
                      ]}
                    >
                      {cat.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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
                    const matchWithOdds = getOddsAndPrediction(match);
                    const isLive = match.status.toLowerCase().includes('live');
                    const isFT = match.status === 'FT';

                    return (
                      <View key={match.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {/* Match Detail Trigger Wrap */}
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => router.push(`/match/${match.id}` as any)}
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
                              {matchWithOdds.aiPrediction}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>

                        {/* Odds / Betting Options */}
                        <View style={styles.oddsSection}>
                          <ThemedText style={styles.oddsTitle}>Đặt cược ảo bằng xu (Thắng - Hòa - Thua)</ThemedText>
                          <View style={styles.oddsContainer}>
                            <TouchableOpacity 
                              style={[styles.oddsBtn, { borderColor: colors.border }]} 
                              onPress={() => handleOpenBet(match, 'teamA')}
                            >
                              <ThemedText style={styles.oddsLabel} numberOfLines={1}>1 ({match.homeTeamName})</ThemedText>
                              <ThemedText style={[styles.oddsValue, { color: colors.primary }]}>{matchWithOdds.odds.teamA.value.toFixed(2)}</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.oddsBtn, { borderColor: colors.border }]} 
                              onPress={() => handleOpenBet(match, 'draw')}
                            >
                              <ThemedText style={styles.oddsLabel}>Hòa (X)</ThemedText>
                              <ThemedText style={[styles.oddsValue, { color: colors.primary }]}>{matchWithOdds.odds.draw.value.toFixed(2)}</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.oddsBtn, { borderColor: colors.border }]} 
                              onPress={() => handleOpenBet(match, 'teamB')}
                            >
                              <ThemedText style={styles.oddsLabel} numberOfLines={1}>2 ({match.awayTeamName})</ThemedText>
                              <ThemedText style={[styles.oddsValue, { color: colors.primary }]}>{matchWithOdds.odds.teamB.value.toFixed(2)}</ThemedText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}

            {hasMore && (
              <TouchableOpacity
                style={[styles.loadMoreBtn, { borderColor: colors.primary }]}
                onPress={loadMore}
              >
                <ThemedText style={[styles.loadMoreBtnText, { color: colors.primary }]}>Xem thêm trận đấu</ThemedText>
              </TouchableOpacity>
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

      {/* Betting Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={betModalVisible}
        onRequestClose={() => setBetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            {!showSuccess ? (
              <View>
                <View style={styles.modalHeader}>
                  <ThemedText type="subtitle" style={styles.modalTitle}>Phiếu Đặt Cược ⚽</ThemedText>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setBetModalVisible(false)}>
                    <ThemedText style={{ color: '#A0AEC0', fontSize: 20 }}>×</ThemedText>
                  </TouchableOpacity>
                </View>

                {selectedMatch && selectedOutcome && selectedOdds && (
                  <View style={styles.modalContent}>
                    <ThemedText style={styles.modalMatchName}>
                      {selectedMatch.homeTeamName} vs {selectedMatch.awayTeamName}
                    </ThemedText>
                    <View style={[styles.selectionBadge, { backgroundColor: colors.primary + '15' }]}>
                      <ThemedText style={{ color: colors.primary, fontWeight: 'bold' }}>
                        Cược chọn: {selectedOdds.label} (Tỷ lệ: {selectedOdds.value.toFixed(2)})
                      </ThemedText>
                    </View>

                    <View style={styles.balanceInfo}>
                      <ThemedText style={{ color: '#A0AEC0' }}>Số dư hiện tại:</ThemedText>
                      <ThemedText style={{ fontWeight: 'bold', color: colors.gold }}>
                        {coins.toLocaleString()} Coins
                      </ThemedText>
                    </View>

                    <ThemedText style={styles.inputTitle}>Nhập số Coin đặt cược:</ThemedText>
                    <TextInput
                      style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      keyboardType="numeric"
                      value={betAmount}
                      onChangeText={setBetAmount}
                      placeholder="Nhập số coin cược"
                      placeholderTextColor="#718096"
                    />

                    {/* Quick Select Buttons */}
                    <View style={styles.quickSelectContainer}>
                      {['50', '100', '200', '500'].map((amt) => (
                        <TouchableOpacity
                          key={amt}
                          style={[
                            styles.quickBtn, 
                            { borderColor: colors.border },
                            betAmount === amt && { backgroundColor: colors.primary, borderColor: colors.primary }
                          ]}
                          onPress={() => setBetAmount(amt)}
                        >
                          <ThemedText style={[
                            styles.quickBtnText,
                            betAmount === amt && { color: '#FFFFFF', fontWeight: 'bold' }
                          ]}>
                            {amt}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={[
                          styles.quickBtn, 
                          { borderColor: colors.border },
                          betAmount === coins.toString() && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                        onPress={() => setBetAmount(coins.toString())}
                      >
                        <ThemedText style={[
                          styles.quickBtnText,
                          betAmount === coins.toString() && { color: '#FFFFFF', fontWeight: 'bold' }
                        ]}>
                          Tất cả
                        </ThemedText>
                      </TouchableOpacity>
                    </View>

                    {/* Estimated Win Bar */}
                    <View style={styles.estWinContainer}>
                      <ThemedText style={{ color: '#A0AEC0' }}>Thắng dự kiến:</ThemedText>
                      <ThemedText style={{ fontWeight: 'bold', color: colors.success, fontSize: 16 }}>
                        {calculatedWin.toLocaleString()} Coins
                      </ThemedText>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                      onPress={handlePlaceBet}
                    >
                      <ThemedText style={styles.submitBtnText}>Xác nhận Đặt cược</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.successContainer}>
                <View style={[styles.successIconWrapper, { backgroundColor: colors.success + '20' }]}>
                  <ThemedText style={{ fontSize: 40 }}>🎉</ThemedText>
                </View>
                
                <ThemedText type="subtitle" style={styles.successTitle}>Đặt Cược Thành Công!</ThemedText>
                
                {successDetails && (
                  <View style={styles.successDetailsCard}>
                    <ThemedText style={styles.successDetailText}>
                      Lựa chọn: <ThemedText style={{ fontWeight: 'bold' }}>{successDetails.outcomeLabel}</ThemedText>
                    </ThemedText>
                    <ThemedText style={styles.successDetailText}>
                      Tiền cược: <ThemedText style={{ color: colors.gold, fontWeight: 'bold' }}>{successDetails.amount.toLocaleString()} Coins</ThemedText>
                    </ThemedText>
                    <ThemedText style={styles.successDetailText}>
                      Thắng dự kiến: <ThemedText style={{ color: colors.success, fontWeight: 'bold' }}>{successDetails.winAmount.toLocaleString()} Coins</ThemedText>
                    </ThemedText>
                  </View>
                )}

                <ThemedText style={styles.successMessage}>
                  Số dư của bạn đã được cập nhật. Kết quả cược sẽ tự động được thanh toán khi trận đấu kết thúc!
                </ThemedText>

                <TouchableOpacity
                  style={[styles.closeSuccessBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setBetModalVisible(false)}
                >
                  <ThemedText style={styles.closeSuccessBtnText}>Đóng</ThemedText>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>
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
});
