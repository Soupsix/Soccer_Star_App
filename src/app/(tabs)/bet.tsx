import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BetScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title">Dự Đoán</ThemedText>
          <ThemedText style={{ color: '#A0AEC0' }}>Đặt cược bằng Coin ảo và nhận thưởng</ThemedText>
        </View>

        {/* Coin Balance Bar */}
        <View style={[styles.balanceBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={{ color: '#A0AEC0', fontWeight: '600' }}>VÍ COIN</ThemedText>
          <View style={styles.coinWrapper}>
            <IconSymbol size={20} name="house.fill" color={colors.gold} />
            <ThemedText style={[styles.coinText, { color: colors.gold }]}>1,250 COINS</ThemedText>
          </View>
        </View>

        {/* Betting Match Odds */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={styles.leagueText}>PREMIER LEAGUE</ThemedText>
          <ThemedText style={styles.matchTitle}>Arsenal vs Chelsea</ThemedText>
          <ThemedText style={styles.timeText}>Hôm nay, 22:30</ThemedText>

          <View style={styles.oddsContainer}>
            <TouchableOpacity style={[styles.oddsBtn, { borderColor: colors.border }]}>
              <ThemedText style={styles.oddsLabel}>Arsenal</ThemedText>
              <ThemedText style={[styles.oddsValue, { color: colors.primary }]}>1.85</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.oddsBtn, { borderColor: colors.border }]}>
              <ThemedText style={styles.oddsLabel}>Hòa</ThemedText>
              <ThemedText style={[styles.oddsValue, { color: colors.primary }]}>3.40</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.oddsBtn, { borderColor: colors.border }]}>
              <ThemedText style={styles.oddsLabel}>Chelsea</ThemedText>
              <ThemedText style={[styles.oddsValue, { color: colors.primary }]}>4.10</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

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
    marginBottom: 24,
  },
  balanceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  coinWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinText: {
    fontWeight: 'bold',
    marginLeft: 6,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  leagueText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#A0AEC0',
    letterSpacing: 1,
    marginBottom: 8,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 4,
    marginBottom: 16,
  },
  oddsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  oddsBtn: {
    width: '31%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  oddsLabel: {
    fontSize: 12,
    color: '#A0AEC0',
    marginBottom: 4,
  },
  oddsValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
