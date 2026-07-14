/**
 * coin-wallet.tsx
 * Màn hình Lịch sử giao dịch Ví Coin
 * Hiển thị: số dư hiện tại + lịch sử các lần điểm danh / giao dịch coin
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDailyCheckin } from '@/hooks/use-daily-checkin';
import { auth, db } from '@/services/firebase';

interface CoinTransaction {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: string;
  amount?: number;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${hh}:${mm} · ${dd}/${mo}/${yy}`;
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'checkin': return '📅';
    case 'reward': return '🎁';
    case 'spend': return '💸';
    case 'purchase': return '💳';
    default: return '🪙';
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'checkin': return '#00C853';
    case 'reward': return '#FFD700';
    case 'spend': return '#FF4D4F';
    case 'purchase': return '#2F80ED';
    default: return '#A0AEC0';
  }
}

export default function CoinWalletScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const { coins, dailyReward } = useDailyCheckin();

  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }

    try {
      // Query đơn giản chỉ theo userId để tránh yêu cầu tạo Composite Index trên Firebase Console
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CoinTransaction, 'id'>),
        }))
        // Lọc các loại giao dịch liên quan đến ví coin trên client
        .filter((item) =>
          ['checkin', 'reward', 'spend', 'purchase', 'coin_change'].includes(item.type)
        )
        // Sắp xếp theo timestamp giảm dần (mới nhất lên trước) trên client
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        // Giới hạn 50 mục gần nhất
        .slice(0, 50);

      setTransactions(list);
    } catch (err) {
      console.warn('Error loading coin transactions:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadNotifications = useCallback(() => {
    setLoading(true);
    loadTransactions();
  }, [loadTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTransactions();
  }, [loadTransactions]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyEmoji}>🪙</Text>
      <ThemedText style={styles.emptyTitle}>Chưa có giao dịch</ThemedText>
      <ThemedText style={[styles.emptyDesc, { color: colors.icon }]}>
        Điểm danh hàng ngày để bắt đầu tích lũy coin!
      </ThemedText>
    </View>
  );

  const renderItem = ({ item }: { item: CoinTransaction }) => {
    const icon = getTypeIcon(item.type);
    const accent = getTypeColor(item.type);
    const isPositive = item.type !== 'spend';

    return (
      <View style={[styles.txRow, {
        backgroundColor: isDark ? colors.card : '#fff',
        borderColor: colors.border,
      }]}>
        {/* Icon bubble */}
        <View style={[styles.txIconWrap, { backgroundColor: accent + '18' }]}>
          <Text style={styles.txIcon}>{icon}</Text>
        </View>

        {/* Info */}
        <View style={styles.txInfo}>
          <ThemedText style={styles.txTitle} numberOfLines={1}>{item.title}</ThemedText>
          <Text style={[styles.txTime, { color: colors.icon }]}>
            {formatDateTime(item.timestamp)}
          </Text>
        </View>

        {/* Amount */}
        <View style={styles.txAmountWrap}>
          <Text style={[styles.txAmount, { color: isPositive ? '#00C853' : '#FF4D4F' }]}>
            {isPositive ? '+' : '-'}{(item.amount ?? dailyReward).toLocaleString()}
          </Text>
          <Text style={[styles.txAmountSub, { color: colors.icon }]}>coin</Text>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Ví Coin</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Balance Card ── */}
        <View style={[styles.balanceCard, {
          backgroundColor: isDark ? '#1a2340' : '#f0f4ff',
          borderColor: colors.primary + '40',
        }]}>
          <View style={styles.balanceLabelRow}>
            <Text style={styles.balanceEmoji}>🪙</Text>
            <Text style={[styles.balanceLabel, { color: colors.icon }]}>Số dư hiện tại</Text>
          </View>
          <Text style={[styles.balanceAmount, { color: '#FFD700' }]}>
            {coins.toLocaleString()}
          </Text>
          <Text style={[styles.balanceSub, { color: colors.icon }]}>coin</Text>

          {/* Reward info */}
          <View style={[styles.rewardInfoRow, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '30' }]}>
            <Text style={{ fontSize: 14 }}>📅</Text>
            <Text style={[styles.rewardInfoText, { color: colors.primary }]}>
              Điểm danh hàng ngày nhận <Text style={{ fontWeight: '800' }}>{dailyReward.toLocaleString()} coin</Text>
            </Text>
          </View>
        </View>

        {/* ── Transaction history ── */}
        <View style={styles.listHeader}>
          <Text style={[styles.listHeaderTitle, { color: colors.text }]}>📋 Lịch sử giao dịch</Text>
          <Text style={[styles.listHeaderCount, { color: colors.icon }]}>
            {transactions.length} mục
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  safeArea:    { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn:     { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  balanceCard: {
    margin: 16, borderRadius: 20, borderWidth: 1.5,
    padding: 24, alignItems: 'center',
  },
  balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  balanceEmoji:    { fontSize: 22 },
  balanceLabel:    { fontSize: 14, fontWeight: '500' },
  balanceAmount:   { fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  balanceSub:      { fontSize: 14, marginTop: -4, marginBottom: 16 },

  rewardInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8, marginTop: 4,
  },
  rewardInfoText: { fontSize: 13 },

  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  listHeaderTitle: { fontSize: 15, fontWeight: '700' },
  listHeaderCount: { fontSize: 13 },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  txIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txIcon:     { fontSize: 22 },
  txInfo:     { flex: 1 },
  txTitle:    { fontSize: 14, fontWeight: '600' },
  txTime:     { fontSize: 12, marginTop: 3 },
  txAmountWrap: { alignItems: 'flex-end' },
  txAmount:   { fontSize: 16, fontWeight: '800' },
  txAmountSub:{ fontSize: 11, marginTop: 1 },

  emptyWrap:  { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyDesc:  { fontSize: 13, textAlign: 'center', maxWidth: 240 },
});
