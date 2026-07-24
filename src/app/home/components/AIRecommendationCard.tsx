import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
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
  const [modalVisible, setModalVisible] = useState(false);

  if (!recommendation) return null;

  const homeWinProb = recommendation.homeWinProb ?? 54;
  const drawProb = recommendation.drawProb ?? 26;
  const awayWinProb = recommendation.awayWinProb ?? 20;

  const defaultFactors = [
    `⚡ Phong độ: ${recommendation.homeTeam} sở hữu chuỗi 4 trận bất bại gần đây.`,
    `🛡️ Hàng thủ: ${recommendation.awayTeam} để lọt lưới trung bình 1.6 bàn/trận.`,
    `⚔️ Lịch sử đối đầu: Ưu thế thuộc về ${recommendation.homeTeam} ở các lần chạm trán trước.`,
    `🧠 Phân tích AI: Tỷ lệ kiểm soát thế trận 60% nghiêng về đội nhà.`
  ];

  const factors = recommendation.keyFactors && recommendation.keyFactors.length > 0
    ? recommendation.keyFactors
    : defaultFactors;

  return (
    <View style={styles.container}>
      {/* Clickable Card wrapper */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.card, { backgroundColor: colors.primary + '12', borderColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        {/* Header Badge */}
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: colors.gold }]}>
            <ThemedText style={styles.badgeText}>DỰ ĐOÁN HOT BỞI AI 🔥</ThemedText>
          </View>

          {/* Clickable Confidence Tag */}
          <TouchableOpacity
            style={[styles.confidenceContainer, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="analytics" size={14} color={colors.success} style={{ marginRight: 4 }} />
            <ThemedText style={[styles.confidenceText, { color: colors.success }]}>
              Độ tin cậy: {recommendation.confidence}% (Bấm để xem)
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Match Info */}
        <ThemedText type="subtitle" style={styles.matchTitle}>
          {recommendation.homeTeam} vs {recommendation.awayTeam}
        </ThemedText>

        {/* Reasoning */}
        <View style={styles.reasonContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} style={styles.quoteIcon} />
          <ThemedText style={styles.reasonText} numberOfLines={3}>
            {recommendation.reason}
          </ThemedText>
        </View>

        {/* Footer Actions */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.detailHintBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
            <ThemedText style={[styles.detailHintText, { color: colors.primary }]}>Chi tiết phân tích</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/matches')}
          >
            <ThemedText style={styles.actionBtnText}>Xem trận đấu</ThemedText>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* AI Detailed Analysis Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />

          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.aiBadgeIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="sparkles" size={18} color={colors.primary} />
                </View>
                <View>
                  <ThemedText style={styles.modalHeaderTitle}>PHÂN TÍCH CHI TIẾT AI</ThemedText>
                  <ThemedText style={styles.modalHeaderSubtitle}>Mô hình dự đoán thông minh</ThemedText>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.background }]}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {/* Match Header Info */}
              <View style={[styles.matchHeaderBox, { backgroundColor: colors.background }]}>
                <ThemedText style={styles.modalMatchTitle}>
                  {recommendation.homeTeam} <ThemedText style={{ color: colors.primary }}>VS</ThemedText> {recommendation.awayTeam}
                </ThemedText>

                {recommendation.predictedScore && (
                  <View style={[styles.scoreBadge, { backgroundColor: colors.primary }]}>
                    <ThemedText style={styles.scoreBadgeText}>
                      Dự đoán tỉ số: {recommendation.predictedScore}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Confidence Metric */}
              <View style={[styles.confidenceBox, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                <View style={styles.confidenceHeader}>
                  <ThemedText style={[styles.confidenceLabel, { color: colors.success }]}>
                    ĐỘ TIN CẬY DỰ ĐOÁN
                  </ThemedText>
                  <ThemedText style={[styles.confidenceVal, { color: colors.success }]}>
                    {recommendation.confidence}%
                  </ThemedText>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${recommendation.confidence}%`, backgroundColor: colors.success }
                    ]}
                  />
                </View>
              </View>

              {/* Win Probabilities Bar */}
              <View style={styles.sectionContainer}>
                <ThemedText style={styles.sectionTitle}>🎯 Xác suất kết quả trận đấu</ThemedText>
                
                {/* Visual Bar */}
                <View style={styles.multiBarTrack}>
                  <View style={[styles.multiBarSegment, { flex: homeWinProb, backgroundColor: '#3B82F6' }]} />
                  <View style={[styles.multiBarSegment, { flex: drawProb, backgroundColor: '#9CA3AF' }]} />
                  <View style={[styles.multiBarSegment, { flex: awayWinProb, backgroundColor: '#EF4444' }]} />
                </View>

                {/* Probability Legend */}
                <View style={styles.probLegendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                    <ThemedText style={styles.legendText}>
                      {recommendation.homeTeam}: <ThemedText style={{ fontWeight: 'bold' }}>{homeWinProb}%</ThemedText>
                    </ThemedText>
                  </View>

                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
                    <ThemedText style={styles.legendText}>
                      Hòa: <ThemedText style={{ fontWeight: 'bold' }}>{drawProb}%</ThemedText>
                    </ThemedText>
                  </View>

                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <ThemedText style={styles.legendText}>
                      {recommendation.awayTeam}: <ThemedText style={{ fontWeight: 'bold' }}>{awayWinProb}%</ThemedText>
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Key Factors Analysis */}
              <View style={styles.sectionContainer}>
                <ThemedText style={styles.sectionTitle}>🔍 Các yếu tố phân tích then chốt</ThemedText>
                <View style={styles.factorsList}>
                  {factors.map((factor, idx) => (
                    <View key={idx} style={[styles.factorCard, { backgroundColor: colors.background }]}>
                      <ThemedText style={styles.factorText}>{factor}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>

              {/* Head-to-head & Extra Predictions */}
              {(recommendation.headToHead || recommendation.overUnder) && (
                <View style={styles.sectionContainer}>
                  <ThemedText style={styles.sectionTitle}>📊 Thống kê & Kèo phụ</ThemedText>

                  {recommendation.headToHead && (
                    <View style={[styles.statRow, { backgroundColor: colors.background }]}>
                      <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
                      <ThemedText style={styles.statLabel}>Đối đầu:</ThemedText>
                      <ThemedText style={styles.statVal}>{recommendation.headToHead}</ThemedText>
                    </View>
                  )}

                  {recommendation.overUnder && (
                    <View style={[styles.statRow, { backgroundColor: colors.background }]}>
                      <Ionicons name="football" size={16} color={colors.gold} />
                      <ThemedText style={styles.statLabel}>Tổng bàn thắng:</ThemedText>
                      <ThemedText style={styles.statVal}>{recommendation.overUnder}</ThemedText>
                    </View>
                  )}
                </View>
              )}

              {/* AI Disclaimer */}
              <ThemedText style={styles.disclaimerText}>
                💡 *Lưu ý: Dự đoán bởi AI dựa trên phân tích thuật toán thống kê dữ liệu. Thông tin mang tính chất tham khảo.*
              </ThemedText>
            </ScrollView>

            {/* Modal Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={[styles.closeModalBtnText, { color: colors.text }]}>Đóng</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.viewMatchBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setModalVisible(false);
                  router.push('/(tabs)/matches');
                }}
              >
                <ThemedText style={styles.viewMatchBtnText}>Xem chi tiết trận đấu</ThemedText>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexWrap: 'wrap',
    gap: 6,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  confidenceText: {
    fontSize: 11,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  detailHintText: {
    fontSize: 11,
    fontWeight: '700',
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

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: '#A0AEC0',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchHeaderBox: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalMatchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  confidenceBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confidenceVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionContainer: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  multiBarTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  multiBarSegment: {
    height: '100%',
  },
  probLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  factorsList: {
    gap: 8,
  },
  factorCard: {
    padding: 12,
    borderRadius: 12,
  },
  factorText: {
    fontSize: 12,
    lineHeight: 18,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#A0AEC0',
    fontWeight: '600',
  },
  statVal: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  disclaimerText: {
    fontSize: 10,
    color: '#718096',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  viewMatchBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewMatchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
