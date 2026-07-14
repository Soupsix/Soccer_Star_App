/**
 * coin-wallet.tsx
 * Màn hình Lịch sử giao dịch Ví Coin
 * Hiển thị: số dư hiện tại + lịch sử các lần điểm danh / giao dịch coin
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
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
import { MIN_TOP_UP_COINS, useCoinTopUp } from '@/hooks/use-coin-top-up';
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

type TopUpStep = 'amount' | 'bank' | 'success';

const QUICK_AMOUNTS = [5000, 10000, 50000];
const BANK_DETAILS = [
  { key: 'owner', label: 'Chủ tài khoản', value: 'TA MINH HIEN' },
  { key: 'bank', label: 'Ngân hàng', value: 'MBBANK' },
  { key: 'account', label: 'STK', value: '12131415161819' },
] as const;

const BANK_DETAILS_TEXT = BANK_DETAILS
  .map((item) => `${item.label}: ${item.value}`)
  .join('\n');

function parseCoinAmount(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

function formatCoinInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  return digits ? Number(digits).toLocaleString('vi-VN') : '';
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
  const { submitting, topUpCoins } = useCoinTopUp();

  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [topUpStep, setTopUpStep] = useState<TopUpStep>('amount');
  const [amountInput, setAmountInput] = useState('');
  const [amountError, setAmountError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);
  const [newBalance, setNewBalance] = useState(0);
  const confirmingTransferRef = useRef(false);

  const topUpAmount = parseCoinAmount(amountInput);
  const processingTransfer = confirmingTransfer || submitting;

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

  const openTopUp = useCallback(() => {
    setTopUpStep('amount');
    setAmountInput('');
    setAmountError('');
    setRequestError('');
    setCopiedKey(null);
    setNewBalance(0);
    setTopUpVisible(true);
  }, []);

  const closeTopUp = useCallback(() => {
    if (processingTransfer) return;
    setTopUpVisible(false);
  }, [processingTransfer]);

  const handleAmountChange = useCallback((value: string) => {
    setAmountInput(formatCoinInput(value));
    setAmountError('');
    setRequestError('');
  }, []);

  const handleSubmitAmount = useCallback(() => {
    if (topUpAmount < MIN_TOP_UP_COINS) {
      setAmountError(`Số coin nạp tối thiểu là ${MIN_TOP_UP_COINS.toLocaleString('vi-VN')}.`);
      return;
    }
    setAmountError('');
    setRequestError('');
    setCopiedKey(null);
    setTopUpStep('bank');
  }, [topUpAmount]);

  const handleCopy = useCallback(async (key: string, value: string) => {
    try {
      await Clipboard.setStringAsync(value);
      setCopiedKey(key);
      setRequestError('');
    } catch {
      setRequestError('Không thể sao chép. Vui lòng nhấn giữ vào nội dung để chọn.');
    }
  }, []);

  const handleConfirmTransfer = useCallback(async () => {
    if (processingTransfer || confirmingTransferRef.current) return;

    confirmingTransferRef.current = true;
    setRequestError('');
    setConfirmingTransfer(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const result = await topUpCoins(topUpAmount);
      setNewBalance(result.newTotal);
      setTopUpStep('success');
      await loadTransactions();
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : 'Không thể nạp coin. Vui lòng thử lại.',
      );
    } finally {
      confirmingTransferRef.current = false;
      setConfirmingTransfer(false);
    }
  }, [loadTransactions, processingTransfer, topUpAmount, topUpCoins]);

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

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Nạp coin"
            activeOpacity={0.85}
            onPress={openTopUp}
            style={[styles.topUpButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.topUpButtonText}>Nạp coin</Text>
          </TouchableOpacity>
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

      <Modal
        animationType="slide"
        onRequestClose={closeTopUp}
        transparent
        visible={topUpVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable
            accessibilityRole="button"
            onPress={closeTopUp}
            style={styles.modalBackdrop}
          />

          <View style={[styles.topUpSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                accessibilityLabel={topUpStep === 'bank' ? 'Quay lại nhập số coin' : 'Đóng'}
                accessibilityRole="button"
                disabled={processingTransfer}
                onPress={topUpStep === 'bank' ? () => setTopUpStep('amount') : closeTopUp}
                style={styles.sheetIconButton}
              >
                <Ionicons
                  color={processingTransfer ? colors.icon : colors.text}
                  name={topUpStep === 'bank' ? 'arrow-back' : 'close'}
                  size={24}
                />
              </TouchableOpacity>
              <ThemedText style={styles.sheetTitle}>
                {topUpStep === 'amount' ? 'Nạp coin' : topUpStep === 'bank' ? 'Chuyển khoản' : 'Hoàn tất'}
              </ThemedText>
              <View style={styles.sheetIconButton} />
            </View>

            <ScrollView
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {topUpStep === 'amount' && (
                <View>
                  <View style={[styles.topUpIcon, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name="wallet-outline" size={30} color={colors.primary} />
                  </View>
                  <ThemedText style={styles.stepTitle}>Nhập số coin muốn nạp</ThemedText>
                  <Text style={[styles.stepDescription, { color: colors.icon }]}>
                    Số coin tối thiểu cho mỗi lần nạp là {MIN_TOP_UP_COINS.toLocaleString('vi-VN')} coin.
                  </Text>

                  <View style={styles.amountLabelRow}>
                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Số coin</Text>
                    <Text style={[styles.currentBalance, { color: colors.icon }]}>
                      Số dư: {coins.toLocaleString('vi-VN')}
                    </Text>
                  </View>
                  <View style={[
                    styles.amountInputWrap,
                    {
                      backgroundColor: isDark ? colors.background : '#F7F9FC',
                      borderColor: amountError ? '#E53935' : colors.border,
                    },
                  ]}>
                    <TextInput
                      accessibilityLabel="Số coin muốn nạp"
                      keyboardType="number-pad"
                      maxLength={11}
                      onChangeText={handleAmountChange}
                      placeholder="5.000"
                      placeholderTextColor={colors.icon}
                      selectionColor={colors.primary}
                      style={[styles.amountInput, { color: colors.text }]}
                      value={amountInput}
                    />
                    <Text style={[styles.amountSuffix, { color: colors.icon }]}>coin</Text>
                  </View>
                  {!!amountError && <Text style={styles.errorText}>{amountError}</Text>}

                  <View style={styles.quickAmountRow}>
                    {QUICK_AMOUNTS.map((amount) => {
                      const selected = topUpAmount === amount;
                      return (
                        <TouchableOpacity
                          accessibilityRole="button"
                          activeOpacity={0.8}
                          key={amount}
                          onPress={() => handleAmountChange(String(amount))}
                          style={[
                            styles.quickAmountButton,
                            {
                              backgroundColor: selected ? colors.primary + '18' : 'transparent',
                              borderColor: selected ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text style={[
                            styles.quickAmountText,
                            { color: selected ? colors.primary : colors.text },
                          ]}>
                            {amount.toLocaleString('vi-VN')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.85}
                    onPress={handleSubmitAmount}
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.primaryButtonText}>Gửi</Text>
                    <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              {topUpStep === 'bank' && (
                <View>
                  <View style={[styles.transferAmountBand, { backgroundColor: colors.primary + '12' }]}>
                    <Text style={[styles.transferAmountLabel, { color: colors.icon }]}>Số coin sẽ nhận</Text>
                    <Text style={[styles.transferAmountValue, { color: colors.primary }]}>
                      {topUpAmount.toLocaleString('vi-VN')} coin
                    </Text>
                  </View>

                  <Text style={[styles.fieldLabel, styles.bankTitle, { color: colors.text }]}>
                    Thông tin nhận chuyển khoản
                  </Text>
                  <View style={[styles.bankDetails, { borderColor: colors.border }]}>
                    {BANK_DETAILS.map((detail, index) => {
                      const copied = copiedKey === detail.key;
                      return (
                        <View
                          key={detail.key}
                          style={[
                            styles.bankRow,
                            index < BANK_DETAILS.length - 1 && {
                              borderBottomColor: colors.border,
                              borderBottomWidth: StyleSheet.hairlineWidth,
                            },
                          ]}
                        >
                          <View style={styles.bankValueWrap}>
                            <Text style={[styles.bankLabel, { color: colors.icon }]}>{detail.label}</Text>
                            <Text selectable style={[styles.bankValue, { color: colors.text }]}>
                              {detail.value}
                            </Text>
                          </View>
                          <TouchableOpacity
                            accessibilityLabel={`Sao chép ${detail.label}`}
                            accessibilityRole="button"
                            activeOpacity={0.75}
                            onPress={() => handleCopy(detail.key, detail.value)}
                            style={[styles.copyButton, { backgroundColor: colors.primary + '12' }]}
                          >
                            <Ionicons
                              color={copied ? '#00A86B' : colors.primary}
                              name={copied ? 'checkmark' : 'copy-outline'}
                              size={17}
                            />
                            <Text style={[styles.copyButtonText, { color: copied ? '#00A86B' : colors.primary }]}>
                              {copied ? 'Đã chép' : 'Sao chép'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.8}
                    onPress={() => handleCopy('all', BANK_DETAILS_TEXT)}
                    style={[styles.copyAllButton, { borderColor: colors.border }]}
                  >
                    <Ionicons
                      color={copiedKey === 'all' ? '#00A86B' : colors.primary}
                      name={copiedKey === 'all' ? 'checkmark-circle-outline' : 'copy-outline'}
                      size={19}
                    />
                    <Text style={[
                      styles.copyAllText,
                      { color: copiedKey === 'all' ? '#00A86B' : colors.primary },
                    ]}>
                      {copiedKey === 'all' ? 'Đã sao chép tất cả' : 'Sao chép tất cả thông tin'}
                    </Text>
                  </TouchableOpacity>

                  <View style={[styles.transferNote, { backgroundColor: isDark ? colors.background : '#F7F9FC' }]}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.icon} />
                    <Text style={[styles.transferNoteText, { color: colors.icon }]}>
                      Sau khi chuyển khoản, nhấn nút bên dưới để xác nhận giao dịch.
                    </Text>
                  </View>

                  {!!requestError && <Text style={[styles.errorText, styles.requestError]}>{requestError}</Text>}

                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.85}
                    disabled={processingTransfer}
                    onPress={handleConfirmTransfer}
                    style={[
                      styles.primaryButton,
                      { backgroundColor: processingTransfer ? colors.icon : colors.primary },
                    ]}
                  >
                    {processingTransfer ? (
                      <>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <Text style={styles.primaryButtonText}>Đang xác nhận...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Đã chuyển khoản</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {topUpStep === 'success' && (
                <View style={styles.successContent}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={38} color="#FFFFFF" />
                  </View>
                  <ThemedText style={styles.successTitle}>Nạp coin thành công</ThemedText>
                  <Text style={[styles.successDescription, { color: colors.icon }]}>
                    {topUpAmount.toLocaleString('vi-VN')} coin đã được cộng vào ví của bạn.
                  </Text>
                  <View style={[styles.newBalanceBand, { backgroundColor: colors.primary + '12' }]}>
                    <Text style={[styles.newBalanceLabel, { color: colors.icon }]}>Số dư mới</Text>
                    <Text style={[styles.newBalanceValue, { color: colors.primary }]}>
                      {newBalance.toLocaleString('vi-VN')} coin
                    </Text>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.85}
                    onPress={closeTopUp}
                    style={[styles.primaryButton, styles.finishButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.primaryButtonText}>Hoàn tất</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  topUpButton: {
    width: '100%', height: 48, borderRadius: 8, marginTop: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  topUpButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

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

  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.52)' },
  topUpSheet: {
    width: '100%', maxWidth: 520, maxHeight: '92%', alignSelf: 'center',
    borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden',
  },
  sheetHeader: {
    height: 58, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sheetIconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 17, fontWeight: '800' },
  sheetContent: {
    paddingHorizontal: 20, paddingTop: 22,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  topUpIcon: {
    width: 56, height: 56, borderRadius: 28, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  stepTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  stepDescription: {
    fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6, marginBottom: 24,
  },
  amountLabelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  fieldLabel: { fontSize: 14, fontWeight: '700' },
  currentBalance: { fontSize: 12, fontWeight: '500' },
  amountInputWrap: {
    minHeight: 58, borderRadius: 8, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
  },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '800', paddingVertical: 12 },
  amountSuffix: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
  errorText: { color: '#E53935', fontSize: 12, lineHeight: 18, marginTop: 7 },
  quickAmountRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  quickAmountButton: {
    flex: 1, minHeight: 40, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  quickAmountText: { fontSize: 13, fontWeight: '700' },
  primaryButton: {
    minHeight: 50, borderRadius: 8, marginTop: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  transferAmountBand: {
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  transferAmountLabel: { fontSize: 13, fontWeight: '600' },
  transferAmountValue: { fontSize: 17, fontWeight: '900' },
  bankTitle: { marginTop: 24, marginBottom: 10 },
  bankDetails: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  bankRow: {
    minHeight: 78, paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  bankValueWrap: { flex: 1 },
  bankLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  bankValue: { fontSize: 15, fontWeight: '800' },
  copyButton: {
    minWidth: 90, minHeight: 36, borderRadius: 8, paddingHorizontal: 9,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  copyButtonText: { fontSize: 12, fontWeight: '700' },
  copyAllButton: {
    minHeight: 44, marginTop: 10, borderWidth: 1, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  copyAllText: { fontSize: 13, fontWeight: '700' },
  transferNote: {
    borderRadius: 8, padding: 12, marginTop: 16,
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
  },
  transferNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  requestError: { textAlign: 'center', marginTop: 12 },
  successContent: { alignItems: 'center', paddingTop: 8 },
  successIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#00A86B',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  successTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  successDescription: {
    maxWidth: 300, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7,
  },
  newBalanceBand: {
    width: '100%', borderRadius: 8, marginTop: 24, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  newBalanceLabel: { fontSize: 13, fontWeight: '600' },
  newBalanceValue: { fontSize: 18, fontWeight: '900' },
  finishButton: { width: '100%' },
});
