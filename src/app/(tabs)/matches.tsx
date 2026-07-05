import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Match {
  id: string;
  league: string;
  isLive: boolean;
  time: string;
  teamA: string;
  teamB: string;
  score: string;
  aiPrediction: string;
  odds: {
    teamA: { label: string; value: number };
    draw: { label: string; value: number };
    teamB: { label: string; value: number };
  };
}

const MATCHES_DATA: Match[] = [
  {
    id: '1',
    league: 'CHAMPIONS LEAGUE',
    isLive: true,
    time: "75'",
    teamA: 'Real Madrid',
    teamB: 'Man City',
    score: '2 - 1',
    aiPrediction: '89% AI dự đoán: Trên 2.5 bàn thắng',
    odds: {
      teamA: { label: 'R. Madrid thắng', value: 2.10 },
      draw: { label: 'Hòa', value: 3.50 },
      teamB: { label: 'Man City thắng', value: 3.20 },
    }
  },
  {
    id: '2',
    league: 'PREMIER LEAGUE',
    isLive: false,
    time: 'Hôm nay, 22:30',
    teamA: 'Arsenal',
    teamB: 'Chelsea',
    score: 'vs',
    aiPrediction: '72% AI dự đoán: Arsenal thắng',
    odds: {
      teamA: { label: 'Arsenal thắng', value: 1.85 },
      draw: { label: 'Hòa', value: 3.40 },
      teamB: { label: 'Chelsea thắng', value: 4.10 },
    }
  },
  {
    id: '3',
    league: 'LA LIGA',
    isLive: false,
    time: 'Hôm nay, 23:45',
    teamA: 'Barcelona',
    teamB: 'Atletico Madrid',
    score: 'vs',
    aiPrediction: '65% AI dự đoán: Barcelona thắng',
    odds: {
      teamA: { label: 'Barcelona thắng', value: 1.90 },
      draw: { label: 'Hòa', value: 3.60 },
      teamB: { label: 'Atl. Madrid thắng', value: 3.80 },
    }
  },
  {
    id: '4',
    league: 'SERIE A',
    isLive: false,
    time: 'Ngày mai, 01:45',
    teamA: 'Inter Milan',
    teamB: 'AC Milan',
    score: 'vs',
    aiPrediction: '78% AI dự đoán: Trên 1.5 bàn thắng',
    odds: {
      teamA: { label: 'Inter thắng', value: 2.05 },
      draw: { label: 'Hòa', value: 3.20 },
      teamB: { label: 'AC Milan thắng', value: 3.60 },
    }
  }
];

const COINS_CACHE_KEY = 'user_coins';

export default function MatchesScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  // Coin state
  const [coins, setCoins] = useState<number>(1250);

  // Betting modal state
  const [betModalVisible, setBetModalVisible] = useState<boolean>(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
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

  const handleOpenBet = (match: Match, outcome: 'teamA' | 'draw' | 'teamB') => {
    setSelectedMatch(match);
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
    
    // Deduct coins
    const newBalance = coins - amount;
    saveCoins(newBalance);

    // Save details to display in success view
    setSuccessDetails({
      outcomeLabel: oddsObj.label,
      amount,
      winAmount
    });
    setShowSuccess(true);
  };

  // Get current odds info
  const getCurrentOddsInfo = () => {
    if (!selectedMatch || !selectedOutcome) return null;
    return selectedMatch.odds[selectedOutcome];
  };

  const selectedOdds = getCurrentOddsInfo();
  const calculatedWin = selectedOdds ? Math.round((parseInt(betAmount, 10) || 0) * selectedOdds.value) : 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Title */}
        <View style={styles.header}>
          <ThemedText type="title">Lịch Đấu & Dự Đoán</ThemedText>
          <ThemedText style={{ color: '#A0AEC0', marginTop: 4 }}>Cá cược bằng Coin ảo trực tiếp từ danh sách trận đấu</ThemedText>
        </View>

        {/* Coin Balance Bar */}
        <View style={[styles.balanceBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <ThemedText style={styles.balanceTitle}>SỐ DƯ CỦA BẠN</ThemedText>
            <View style={styles.coinWrapper}>
              <IconSymbol size={22} name="dollarsign.circle.fill" color={colors.gold} />
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

        {/* Matches List */}
        {MATCHES_DATA.map((match) => (
          <View key={match.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <ThemedText style={styles.leagueText}>{match.league}</ThemedText>
              {match.isLive ? (
                <View style={[styles.liveBadge, { backgroundColor: colors.success + '20' }]}>
                  <View style={[styles.dot, { backgroundColor: colors.success }]} />
                  <ThemedText style={[styles.liveText, { color: colors.success }]}>TRỰC TIẾP</ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.timeText}>{match.time}</ThemedText>
              )}
            </View>

            {/* Match Teams & Score */}
            <View style={styles.matchTeams}>
              <View style={styles.team}>
                <IconSymbol size={32} name="house.fill" color={colors.text} />
                <ThemedText style={styles.teamName}>{match.teamA}</ThemedText>
              </View>
              <View style={styles.scoreContainer}>
                <ThemedText style={styles.score}>{match.score}</ThemedText>
                {match.isLive && <ThemedText style={styles.liveTime}>{match.time}</ThemedText>}
              </View>
              <View style={styles.team}>
                <IconSymbol size={32} name="house.fill" color={colors.text} />
                <ThemedText style={styles.teamName}>{match.teamB}</ThemedText>
              </View>
            </View>

            {/* AI Recommendation */}
            <View style={[styles.aiBadge, { backgroundColor: colors.primary + '15' }]}>
              <IconSymbol size={16} name="paperplane.fill" color={colors.primary} />
              <ThemedText style={[styles.aiText, { color: colors.primary }]}>
                {match.aiPrediction}
              </ThemedText>
            </View>

            {/* Odds / Betting Options */}
            <View style={styles.oddsSection}>
              <ThemedText style={styles.oddsTitle}>Tỷ Lệ Đặt Cược (Cược Thắng-Hòa-Thua)</ThemedText>
              <View style={styles.oddsContainer}>
                <TouchableOpacity 
                  style={[styles.oddsBtn, { borderColor: colors.border }]} 
                  onPress={() => handleOpenBet(match, 'teamA')}
                >
                  <ThemedText style={styles.oddsLabel} numberOfLines={1}>1 ({match.teamA})</ThemedText>
                  <ThemedText style={[styles.oddsValue, { color: colors.primary }]}>{match.odds.teamA.value.toFixed(2)}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.oddsBtn, { borderColor: colors.border }]} 
                  onPress={() => handleOpenBet(match, 'draw')}
                >
                  <ThemedText style={styles.oddsLabel}>Hòa (X)</ThemedText>
                  <ThemedText style={[styles.oddsValue, { color: colors.primary }]}>{match.odds.draw.value.toFixed(2)}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.oddsBtn, { borderColor: colors.border }]} 
                  onPress={() => handleOpenBet(match, 'teamB')}
                >
                  <ThemedText style={styles.oddsLabel} numberOfLines={1}>2 ({match.teamB})</ThemedText>
                  <ThemedText style={[styles.oddsValue, { color: colors.primary }]}>{match.odds.teamB.value.toFixed(2)}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        ))}

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
              // Form Dat Cuoc
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
                      {selectedMatch.teamA} vs {selectedMatch.teamB}
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
              // Man Hinh Thanh Cong
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
    fontSize: 12,
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
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
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
  liveTime: {
    fontSize: 11,
    color: '#FF4D4F',
    marginTop: 4,
    fontWeight: '600',
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
    fontSize: 12,
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
});
