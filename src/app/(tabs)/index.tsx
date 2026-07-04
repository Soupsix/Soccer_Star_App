

import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { auth } from '@/services/firebase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const user = auth.currentUser;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greetingText}>Xin chào, Champ! 👋</ThemedText>
            <ThemedText type="subtitle" style={styles.usernameText}>
              {user?.displayName || 'Thành viên mới'}
            </ThemedText>
          </View>
          <TouchableOpacity style={[styles.walletBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol size={18} name="house.fill" color={colors.gold} />
            <ThemedText style={[styles.walletText, { color: colors.gold }]}>1,250</ThemedText>
          </TouchableOpacity>
        </View>

        {/* AI Recommendation Card */}
        <View style={[styles.aiBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
          <View style={styles.bannerBadge}>
            <ThemedText style={styles.badgeText}>DỰ ĐOÁN HOT BỞI AI</ThemedText>
          </View>
          <ThemedText type="subtitle" style={styles.bannerTitle}>
            Real Madrid vs Man City
          </ThemedText>
          <ThemedText style={styles.bannerPredict}>
            Đề xuất: Trên 2.5 Bàn Thắng (Tỷ lệ: 1.85)
          </ThemedText>
          <View style={styles.bannerFooter}>
            <ThemedText style={styles.confidenceText}>Độ tin cậy: 89%</ThemedText>
            <TouchableOpacity
              style={[styles.predictBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/bet')}
            >
              <ThemedText style={styles.predictBtnText}>Đặt Cược Ngay</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Mission Progress */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Nhiệm Vụ Hàng Ngày</ThemedText>
            <ThemedText style={{ color: colors.primary, fontWeight: 'bold' }}>2/5</ThemedText>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: '40%' }]} />
          </View>
          <ThemedText style={styles.progressSubtext}>
            Hoàn thành thêm 3 nhiệm vụ để nhận 200 Coins
          </ThemedText>
        </View>

        {/* Section: Live Matches */}
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Trận Đấu Nổi Bật</ThemedText>
          <TouchableOpacity onPress={() => router.push('/(tabs)/matches')}>
            <ThemedText style={{ color: colors.primary }}>Tất cả</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Hot Match Card */}
        <TouchableOpacity 
          style={[styles.matchCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/matches')}
        >
          <View style={styles.matchCardTeams}>
            <View style={styles.matchTeam}>
              <IconSymbol size={24} name="house.fill" color={colors.text} />
              <ThemedText style={styles.matchTeamName}>Real Madrid</ThemedText>
            </View>
            <View style={styles.matchScore}>
              <ThemedText style={styles.scoreText}>2 - 1</ThemedText>
              <View style={[styles.liveIndicator, { backgroundColor: colors.success + '20' }]}>
                <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
                <ThemedText style={[styles.liveIndicatorText, { color: colors.success }]}>{"L75'"}</ThemedText>
              </View>
            </View>
            <View style={styles.matchTeam}>
              <IconSymbol size={24} name="house.fill" color={colors.text} />
              <ThemedText style={styles.matchTeamName}>Man City</ThemedText>
            </View>
          </View>
        </TouchableOpacity>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  usernameText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  walletText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  aiBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD54F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D1117',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerPredict: {
    fontSize: 14,
    color: '#A0AEC0',
    marginBottom: 16,
  },
  bannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00C853',
  },
  predictBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  predictBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  matchCardTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchTeam: {
    alignItems: 'center',
    width: '35%',
  },
  matchTeamName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  matchScore: {
    alignItems: 'center',
    width: '30%',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  liveIndicatorText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});

